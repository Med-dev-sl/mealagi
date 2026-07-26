import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProjectStatus } from "@prisma/client";

class TeamMemberInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}

export class ProjectResponseDto {
  @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  id: string;

  @ApiProperty({ example: "PRJ-2024-001" })
  projectCode: string;

  @ApiProperty({ example: "Community Health Initiative" })
  projectName: string;

  @ApiPropertyOptional({ example: "CHI" })
  shortName?: string;

  @ApiPropertyOptional({ example: "USAID" })
  donor?: string;

  @ApiPropertyOptional({ example: "World Vision" })
  implementingPartner?: string;

  @ApiPropertyOptional({ example: "Government of Uganda" })
  fundingSource?: string;

  @ApiProperty({ example: 500000.0 })
  budget: number;

  @ApiProperty({ example: "USD" })
  currency: string;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  startDate: Date;

  @ApiProperty({ example: "2026-12-31T00:00:00.000Z" })
  endDate: Date;

  @ApiPropertyOptional()
  projectManagerId?: string;

  @ApiProperty()
  organizationId: string;

  @ApiPropertyOptional({ example: "Kampala" })
  district?: string;

  @ApiPropertyOptional({ example: "Kampala Central" })
  chiefdom?: string;

  @ApiPropertyOptional({ example: "Luzira" })
  community?: string;

  @ApiPropertyOptional({ example: "Health" })
  sector?: string;

  @ApiProperty({ enum: ProjectStatus, example: "ACTIVE" })
  status: ProjectStatus;

  @ApiPropertyOptional({ example: "A community health initiative" })
  description?: string;

  @ApiPropertyOptional({ example: "Improve child health outcomes" })
  objectives?: string;

  @ApiPropertyOptional({ example: "Reduced mortality rates" })
  expectedOutcomes?: string;

  @ApiPropertyOptional({ example: "5,000 children under 5" })
  targetBeneficiaries?: string;

  @ApiPropertyOptional({ type: [TeamMemberInfo] })
  teamMembers?: TeamMemberInfo[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SingleProjectResponseDto {
  @ApiProperty({ type: ProjectResponseDto })
  item: ProjectResponseDto;
}

class PaginationMeta {
  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedProjectResponseDto {
  @ApiProperty({ type: [ProjectResponseDto] })
  items: ProjectResponseDto[];

  @ApiProperty()
  meta: PaginationMeta;
}
