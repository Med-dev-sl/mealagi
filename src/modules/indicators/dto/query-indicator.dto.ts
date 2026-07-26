import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, IsEnum, Min } from "class-validator";
import { Type } from "class-transformer";
import { IndicatorStatus, ReportingFrequency } from "@prisma/client";

export class QueryIndicatorDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  outcomeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  outputId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indicatorType?: string;

  @ApiPropertyOptional({ enum: ReportingFrequency })
  @IsOptional()
  @IsEnum(ReportingFrequency)
  reportingFrequency?: ReportingFrequency;

  @ApiPropertyOptional({ enum: IndicatorStatus })
  @IsOptional()
  @IsEnum(IndicatorStatus)
  status?: IndicatorStatus;

  @ApiPropertyOptional({ enum: ["createdAt", "name", "code", "indicatorType", "status"], default: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}
