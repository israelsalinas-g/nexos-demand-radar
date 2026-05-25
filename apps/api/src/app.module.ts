import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { DbModule } from "./db/db.module";
import { AuthModule } from "./auth/auth.module";
import { SourcesModule } from "./modules/sources/sources.module";
import { SignalsModule } from "./modules/signals/signals.module";
import { SavedSearchesModule } from "./modules/saved-searches/saved-searches.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { SchedulerModule } from "./modules/scheduler/scheduler.module";

@Module({
  imports: [
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" },
    }),
    DbModule,
    AuthModule,
    SourcesModule,
    SignalsModule,
    SavedSearchesModule,
    AlertsModule,
    OrganizationsModule,
    SchedulerModule,
  ],
})
export class AppModule {}
