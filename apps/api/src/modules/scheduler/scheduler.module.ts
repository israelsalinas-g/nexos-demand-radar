import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@radar/queue";
import { SchedulerService } from "./scheduler.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: QUEUES.COLLECT }),
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
