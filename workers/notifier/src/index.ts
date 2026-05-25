import { createWorker, QUEUES } from "@radar/queue";
import { PrismaClient } from "@radar/db";
import { logger } from "@radar/logger";
import { sendEmail } from "./channels/email";
import { sendTelegram } from "./channels/telegram";
import { buildEmailHtml, buildTelegramMessage } from "./templates";

const prisma = new PrismaClient();

createWorker<{ alertId: string; signalId: string }>(QUEUES.NOTIFY, async (job) => {
  const { alertId, signalId } = job.data;
  logger.info({ alertId, signalId }, "notifier job started");

  const [alert, signal] = await Promise.all([
    prisma.alert.findUniqueOrThrow({ where: { id: alertId } }),
    prisma.extractedSignal.findUniqueOrThrow({
      where: { id: signalId },
      include: { item: true },
    }),
  ]);

  const config = (alert.channelConfig ?? {}) as Record<string, string>;

  try {
    if (alert.channel === "email" && config["email"]) {
      await sendEmail(
        config["email"],
        `Demand Radar: ${alert.name}`,
        buildEmailHtml(signal as Parameters<typeof buildEmailHtml>[0], alert),
      );
    } else if (alert.channel === "telegram" && config["chatId"]) {
      await sendTelegram(
        config["chatId"],
        buildTelegramMessage(signal as Parameters<typeof buildTelegramMessage>[0], alert),
      );
    } else {
      logger.warn({ alertId, channel: alert.channel }, "unsupported channel or missing config");
    }

    await prisma.alertRun.updateMany({
      where: { alertId, signalId, status: "pending" },
      data: { status: "sent", sentAt: new Date() },
    });

    logger.info({ alertId, signalId, channel: alert.channel }, "notification sent");
  } catch (err) {
    await prisma.alertRun.updateMany({
      where: { alertId, signalId, status: "pending" },
      data: { status: "failed", error: String(err) },
    });
    throw err;
  }
});

logger.info("notifier worker started");
