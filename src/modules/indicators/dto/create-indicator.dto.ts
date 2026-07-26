import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReportingFrequency } from "@prisma/client";

export class CreateIndicatorDto {
  @ApiProperty({ description: "Output ID this indicator belongs to" })
  @IsUUID()
  outputId: string;

  @ApiProperty({ description: "Indicator code", example: "IND-001" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: "Indicator name", example: "Number of children vaccinated" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: "Indicator description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Indicator type", example: "Quantitative" })
  @IsString()
  @IsOptional()
  indicatorType?: string;

  @ApiPropertyOptional({ description: "Unit of measure", example: "Count" })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  @ApiPropertyOptional({ enum: ReportingFrequency, default: "ANNUAL" })
  @IsEnum(ReportingFrequency)
  @IsOptional()
  reportingFrequency?: ReportingFrequency;

  @ApiPropertyOptional({ description: "Data source", example: "Health facility records" })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiPropertyOptional({ description: "Calculation method", example: "Sum of monthly reports" })
  @IsString()
  @IsOptional()
  calculationMethod?: string;

  @ApiPropertyOptional({ description: "Responsible person user ID" })
  @IsUUID()
  @IsOptional()
  responsiblePersonId?: string;
}
