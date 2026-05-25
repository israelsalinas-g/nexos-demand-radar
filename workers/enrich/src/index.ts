import { createWorker, createQueue, QUEUES } from "@radar/queue";
import { PrismaClient } from "@radar/db";
import { logger } from "@radar/logger";
import { callEnrich } from "./ai-client";
import { matchAndEnqueue } from "./alert-matcher";

const prisma = new PrismaClient();
const notifyQueue = createQueue(QUEUES.NOTIFY);

interface EnrichJob {
  itemId: string;
  organizationId: string;
  title?: string | null;
  body?: string | null;
}

createWorker<EnrichJob>(QUEUES.ENRICH, async (job) => {
  const { itemId, organizationId, title, body } = job.data;
  logger.info({ itemId }, "enrich job started");

  const result = await callEnrich({ item_id: itemId, title, body });

  const signal = await prisma.extractedSignal.create({
    data: {
      itemId,
      organizationId,
      category: result.category,
      intent: result.intent,
      score: result.score,
      location: result.location,
      price: result.price ?? null,
      currency: "HNL",
      metadata: result.metadata,
    },
  });

  logger.info(
    { itemId, signalId: signal.id, intent: result.intent, score: result.score },
    "signal created",
  );

  await matchAndEnqueue(prisma, notifyQueue, signal.id, organizationId);
});

logger.info("enrich worker started");
