import type { PrismaClient } from "@radar/db";
import type { Queue } from "bullmq";
import { logger } from "@radar/logger";

export async function matchAndEnqueue(
  prisma: PrismaClient,
  notifyQueue: Queue,
  signalId: string,
  orgId: string,
): Promise<void> {
  const signal = await prisma.extractedSignal.findUnique({
    where: { id: signalId },
    include: { item: true },
  });
  if (!signal) return;

  const savedSearches = await prisma.savedSearch.findMany({
    where: { organizationId: orgId, isActive: true },
    include: { alerts: { where: { isActive: true } } },
  });

  for (const ss of savedSearches) {
    if (!signalMatchesSavedSearch(ss, signal)) continue;

    for (const alert of ss.alerts) {
      // idempotency — skip if already enqueued for this pair
      const exists = await prisma.alertRun.findFirst({
        where: { alertId: alert.id, signalId },
        select: { id: true },
      });
      if (exists) continue;

      await prisma.alertRun.create({
        data: { alertId: alert.id, signalId, status: "pending" },
      });

      await notifyQueue.add(
        "notify",
        { alertId: alert.id, signalId },
        { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
      );

      logger.info({ alertId: alert.id, signalId }, "alert_run enqueued");
    }
  }
}

function signalMatchesSavedSearch(
  ss: { keywords: string[]; filters: unknown },
  signal: { category: string | null; intent: string | null; price: unknown; location: string | null; item: { title: string | null } | null; metadata: unknown },
): boolean {
  const f = (ss.filters ?? {}) as Record<string, unknown>;

  if (f["category"] && signal.category !== f["category"]) return false;
  if (f["intent"] && signal.intent !== f["intent"]) return false;

  const price = Number(signal.price);
  if (f["priceMin"] && price < Number(f["priceMin"])) return false;
  if (f["priceMax"] && price > Number(f["priceMax"])) return false;

  if (f["location"] && signal.location) {
    const loc = signal.location.toLowerCase();
    if (!loc.includes(String(f["location"]).toLowerCase())) return false;
  }

  if (ss.keywords.length > 0) {
    const title = signal.item?.title ?? "";
    const meta = JSON.stringify(signal.metadata ?? {});
    const text = `${title} ${meta}`.toLowerCase();
    return ss.keywords.some((kw) => text.includes(kw.toLowerCase()));
  }

  return true;
}
