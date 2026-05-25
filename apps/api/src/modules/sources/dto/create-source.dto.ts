import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, IsUrl } from "class-validator";
import type { SourceType, Vertical } from "@radar/shared-types";

export class CreateSourceDto {
  @ApiProperty({ example: "Facebook Marketplace Autos HN" })
  @IsString()
  name: string;

  @ApiProperty({ enum: ["rss", "api", "scraper", "webhook"] })
  @IsIn(["rss", "api", "scraper", "webhook"])
  type: SourceType;

  @ApiPropertyOptional({ example: "https://example.com/feed.xml" })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ enum: ["autos", "real_estate", "smartphones", "laptops"] })
  @IsIn(["autos", "real_estate", "smartphones", "laptops"])
  @IsOptional()
  vertical?: Vertical;
}
