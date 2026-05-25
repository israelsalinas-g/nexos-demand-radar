import { createWorker, createQueue, QUEUES } from "@radar/queue";
import { PrismaClient } from "@radar/db";
import { logger } from "@radar/logger";
import { fetchRssFeed } from "./rss";

const prisma = new PrismaClient();
const enrichQueue = createQueue(QUEUES.ENRICH);

createWorker<{ sourceId: string }>(QUEUES.COLLECT, async (job) => {
  const { sourceId } = job.data;
  logger.info({ sourceId }, "collector job started");

  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) {
    logger.warn({ sourceId }, "source not found, skipping");
    return;
  }

  if (source.type !== "rss" || !source.url) {
    logger.warn({ sourceId, type: source.type }, "unsupported source type or missing url");
    return;
  }

  let items;
  try {
    items = await fetchRssFeed(source.url);
  } catch (err) {
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "error", lastCheckedAt: new Date() },
    });
    throw err;
  }

  logger.info({ sourceId, count: items.length }, "rss items fetched");

  let newCount = 0;
  for (const item of items) {
    const externalId =
      item.guid ?? item.id ?? item.link ?? crypto.randomUUID();

    const body = item.contentSnippet ?? item.content ?? null;

    // upsert — do nothing on conflict (dedup by externalId)
    const existing = await prisma.collectedItem.findFirst({
      where: { sourceId, externalId },
      select: { id: true },
    });

    if (existing) continue;

    const collected = await prisma.collectedItem.create({
      data: {
        sourceId,
        externalId,
        url: item.link ?? null,
        title: item.title ?? null,
        body,
        publishedAt: item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : null,
        rawPayload: item as object,
      },
    });

    await enrichQueue.add(
      "enrich",
      {
        itemId: collected.id,
        organizationId: source.organizationId,
        title: collected.title,
        body: collected.body,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
      },
    );

    newCount++;
  }

  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "active", lastCheckedAt: new Date() },
  });

  logger.info({ sourceId, newCount }, "collector job done");
});

logger.info("collector worker started");
