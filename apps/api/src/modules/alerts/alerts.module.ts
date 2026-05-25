import { Module } from "@nestjs/common";
import { OrgContextService } from "../../common/org-context.service";
import { AlertsService } from "./alerts.service";
import { AlertsController } from "./alerts.controller";

@Module({
  providers: [AlertsService, OrgContextService],
  controllers: [AlertsController],
})
export class AlertsModule {}
