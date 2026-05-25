import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class SavedSearchFiltersDto {
  @IsIn(["autos", "real_estate", "smartphones", "laptops"])
  @IsOptional()
  category?: string;

  @IsIn(["buy", "sell", "rent", "unknown"])
  @IsOptional()
  intent?: string;

  @IsString() @IsOptional() location?: string;

  @Type(() => Number) @IsNumber() @Min(0) @IsOptional() priceMin?: number;
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional() priceMax?: number;
}

export class CreateSavedSearchDto {
  @ApiProperty({ example: "Busco Toyota Hilux SPS" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: [String], example: ["Toyota", "Hilux"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SavedSearchFiltersDto)
  @IsOptional()
  filters?: SavedSearchFiltersDto;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
