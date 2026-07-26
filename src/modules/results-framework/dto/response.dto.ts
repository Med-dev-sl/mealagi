import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LogframeStatus, ResultLevel } from "@prisma/client";

class OutputInfo {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;
}

class OutcomeInfo {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: [OutputInfo] })
  outputs?: OutputInfo[];
}

class GoalInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: [OutcomeInfo] })
  outcomes?: OutcomeInfo[];
}

class AssumptionInfo {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ResultLevel })
  level: ResultLevel;

  @ApiProperty()
  referenceId: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  mitigation?: string;
}

class RiskInfo {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ResultLevel })
  level: ResultLevel;

  @ApiProperty()
  referenceId: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  probability?: string;

  @ApiPropertyOptional()
  impact?: string;

  @ApiPropertyOptional()
  mitigation?: string;
}

export class LogframeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  version: number;

  @ApiProperty({ enum: LogframeStatus })
  status: LogframeStatus;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  approvedBy?: string;

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiPropertyOptional({ type: [GoalInfo] })
  goals?: GoalInfo[];

  @ApiPropertyOptional({ type: [AssumptionInfo] })
  assumptions?: AssumptionInfo[];

  @ApiPropertyOptional({ type: [RiskInfo] })
  risks?: RiskInfo[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SingleLogframeResponseDto {
  @ApiProperty({ type: LogframeResponseDto })
  item: LogframeResponseDto;
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

export class PaginatedLogframeResponseDto {
  @ApiProperty({ type: [LogframeResponseDto] })
  items: LogframeResponseDto[];

  @ApiProperty()
  meta: PaginationMeta;
}
