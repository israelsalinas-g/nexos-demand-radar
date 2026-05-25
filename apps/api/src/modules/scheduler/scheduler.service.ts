import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUES } from "@radar/queue";
import { PrismaService } from "../../db/prisma.service";
import { logger } from "@radar/logger";

@Injectable()
export class SchedulerService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(QUEUES.COLLECT) private collectQueue: Queue,
  ) {}

  // Runs every 15 minutes
  @Cron("0 */15 * * * *")
  async enqueuePendingSources() {
    const sources = await this.prisma.source.findMany({
      where: { status: "active" },
      select: { id: true },
    });

    if (sources.length === 0) return;

    for (const source of sources) {
      await this.collectQueue.add(
        "collect",
        { sourceId: source.id },
        {
          // dedup: BullMQ skips adding if a job with same jobId is already waiting/active
          jobId: `collect:${source.id}:auto`,
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        },
      );
    }

    logger.info({ count: sources.length }, "scheduler: sources enqueued");
  }
}
