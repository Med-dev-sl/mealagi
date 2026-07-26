import { IsString, IsNotEmpty, IsOptional, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateBaselineDto {
  @ApiProperty({ description: "Baseline value", example: "1500" })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ description: "Date of baseline measurement", example: "2026-01-15T00:00:00.000Z" })
  @IsDateString()
  baselineDate: string;

  @ApiPropertyOptional({ description: "Source of baseline data", example: "Ministry of Health" })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: "Verified by user ID" })
  @IsString()
  @IsOptional()
  verifiedBy?: string;
}
