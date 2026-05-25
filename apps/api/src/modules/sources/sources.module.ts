import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@radar/queue";
import { OrgContextService } from "../../common/org-context.service";
import { SourcesService } from "./sources.service";
import { SourcesController } from "./sources.controller";

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.COLLECT })],
  providers: [SourcesService, OrgContextService],
  controllers: [SourcesController],
})
export class SourcesModule {}
