import { Module } from "@nestjs/common";
import { OrgContextService } from "../../common/org-context.service";
import { SignalsService } from "./signals.service";
import { SignalsController } from "./signals.controller";

@Module({
  providers: [SignalsService, OrgContextService],
  controllers: [SignalsController],
})
export class SignalsModule {}
