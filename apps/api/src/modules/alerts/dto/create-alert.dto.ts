import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class AlertChannelConfigDto {
  @IsString() @IsOptional() email?: string;
  @IsString() @IsOptional() chatId?: string;
  @IsString() @IsOptional() url?: string;
  @IsString() @IsOptional() secret?: string;
}

export class CreateAlertDto {
  @ApiProperty({ example: "Alerta Toyota Hilux" })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  savedSearchId?: string;

  @ApiProperty({ enum: ["email", "telegram", "webhook"] })
  @IsIn(["email", "telegram", "webhook"])
  channel: string;

  @ApiProperty({ example: { email: "user@example.com" } })
  @IsObject()
  @ValidateNested()
  @Type(() => AlertChannelConfigDto)
  channelConfig: AlertChannelConfigDto;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
