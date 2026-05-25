import { Module } from "@nestjs/common";
import { OrgContextService } from "../../common/org-context.service";
import { SavedSearchesService } from "./saved-searches.service";
import { SavedSearchesController } from "./saved-searches.controller";

@Module({
  providers: [SavedSearchesService, OrgContextService],
  controllers: [SavedSearchesController],
  exports: [SavedSearchesService],
})
export class SavedSearchesModule {}
