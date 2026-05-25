// Re-export Prisma types as the canonical shared types
export type {
  User,
  Organization,
  OrganizationMember,
  Source,
  CollectedItem,
  ExtractedSignal,
  SavedSearch,
  Alert,
  AlertRun,
} from "@radar/db";

// Domain enums (keep in sync with DB check constraints if added later)
export type SourceType     = "rss" | "api" | "scraper" | "webhook";
export type SourceStatus   = "active" | "paused" | "error";
export type Vertical       = "autos" | "real_estate" | "smartphones" | "laptops";
export type Intent         = "buy" | "sell" | "rent" | "unknown";
export type AlertChannel   = "email" | "telegram" | "webhook";
export type AlertRunStatus = "pending" | "sent" | "failed";
export type OrgPlan        = "free" | "pro" | "enterprise";
export type OrgRole        = "owner" | "admin" | "member";
