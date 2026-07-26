import { IsString, IsNotEmpty, IsOptional, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTargetDto {
  @ApiProperty({ description: "Reporting period", example: "2026-Q1" })
  @IsString()
  @IsNotEmpty()
  reportingPeriod: string;

  @ApiProperty({ description: "Target value", example: "2000" })
  @IsString()
  @IsNotEmpty()
  targetValue: string;

  @ApiProperty({ description: "Target date", example: "2026-03-31T00:00:00.000Z" })
  @IsDateString()
  targetDate: string;
}
