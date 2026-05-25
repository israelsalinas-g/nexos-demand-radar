import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, Max, Min } from "class-validator";

export class QuerySignalsDto {
  @ApiPropertyOptional({ enum: ["autos", "real_estate", "smartphones", "laptops"] })
  @IsIn(["autos", "real_estate", "smartphones", "laptops"])
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: ["buy", "sell", "rent", "unknown"] })
  @IsIn(["buy", "sell", "rent", "unknown"])
  @IsOptional()
  intent?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  minScore?: number;

  @ApiPropertyOptional({ enum: ["24h", "7d", "30d"] })
  @IsIn(["24h", "7d", "30d"])
  @IsOptional()
  period?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  offset?: number;
}
