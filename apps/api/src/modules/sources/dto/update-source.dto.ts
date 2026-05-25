import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, IsUrl } from "class-validator";

export class UpdateSourceDto {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional({ enum: ["active", "paused"] })
  @IsIn(["active", "paused"])
  @IsOptional()
  status?: string;
  @ApiPropertyOptional() @IsUrl() @IsOptional() url?: string;
}
