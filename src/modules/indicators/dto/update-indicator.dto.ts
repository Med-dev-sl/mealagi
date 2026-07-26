import { IsString, IsOptional, IsUUID, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { ReportingFrequency, IndicatorStatus } from "@prisma/client";

export class UpdateIndicatorDto {
  @ApiPropertyOptional({ description: "Indicator code", example: "IND-001" })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: "Indicator name", example: "Number of children vaccinated" })
  @IsString()
  @IsOptional()
  name?: string;

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

  @ApiPropertyOptional({ enum: ReportingFrequency })
  @IsEnum(ReportingFrequency)
  @IsOptional()
  reportingFrequency?: ReportingFrequency;

  @ApiPropertyOptional({ description: "Data source", example: "Health facility records" })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiPropertyOptional({ description: "Calculation method" })
  @IsString()
  @IsOptional()
  calculationMethod?: string;

  @ApiPropertyOptional({ description: "Responsible person user ID" })
  @IsUUID()
  @IsOptional()
  responsiblePersonId?: string;

  @ApiPropertyOptional({ enum: IndicatorStatus })
  @IsEnum(IndicatorStatus)
  @IsOptional()
  status?: IndicatorStatus;
}
