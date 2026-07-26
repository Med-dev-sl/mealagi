import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IndicatorStatus, ReportingFrequency } from "@prisma/client";

class BaselineInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  baselineDate: Date;

  @ApiPropertyOptional()
  source?: string;

  @ApiPropertyOptional()
  verifiedBy?: string;
}

class TargetInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reportingPeriod: string;

  @ApiProperty()
  targetValue: string;

  @ApiProperty()
  targetDate: Date;
}

class DisaggregationInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  value: string;
}

class MeansOfVerificationInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  documentType?: string;

  @ApiPropertyOptional()
  storageLocation?: string;
}

class OutputBrief {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  code?: string;
}

export class IndicatorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  outputId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  indicatorType?: string;

  @ApiPropertyOptional()
  unitOfMeasure?: string;

  @ApiProperty({ enum: ReportingFrequency })
  reportingFrequency: ReportingFrequency;

  @ApiPropertyOptional()
  dataSource?: string;

  @ApiPropertyOptional()
  calculationMethod?: string;

  @ApiPropertyOptional()
  responsiblePersonId?: string;

  @ApiProperty({ enum: IndicatorStatus })
  status: IndicatorStatus;

  @ApiPropertyOptional({ type: OutputBrief })
  output?: OutputBrief;

  @ApiPropertyOptional({ type: [BaselineInfo] })
  baselines?: BaselineInfo[];

  @ApiPropertyOptional({ type: [TargetInfo] })
  targets?: TargetInfo[];

  @ApiPropertyOptional({ type: [DisaggregationInfo] })
  disaggregations?: DisaggregationInfo[];

  @ApiPropertyOptional({ type: [MeansOfVerificationInfo] })
  meansOfVerifications?: MeansOfVerificationInfo[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SingleIndicatorResponseDto {
  @ApiProperty({ type: IndicatorResponseDto })
  item: IndicatorResponseDto;
}

class PaginationMeta {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedIndicatorResponseDto {
  @ApiProperty({ type: [IndicatorResponseDto] })
  items: IndicatorResponseDto[];

  @ApiProperty()
  meta: PaginationMeta;
}
