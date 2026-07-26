import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class OrganizationMeta {
  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class OrganizationResponseDto {
  @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  id: string;

  @ApiProperty({ example: "Save the Children" })
  name: string;

  @ApiPropertyOptional({ example: "STC" })
  shortName?: string;

  @ApiProperty({ example: "save-the-children" })
  slug: string;

  @ApiProperty({ example: "ORG-A1B2C3" })
  code: string;

  @ApiPropertyOptional({ example: "NGO-2024-001" })
  registrationNumber?: string;

  @ApiPropertyOptional({ example: "NGO" })
  organizationType?: string;

  @ApiPropertyOptional({ example: "contact@organization.org" })
  email?: string;

  @ApiPropertyOptional({ example: "+256-312-000-000" })
  phone?: string;

  @ApiPropertyOptional({ example: "https://organization.org" })
  website?: string;

  @ApiPropertyOptional({ example: "Uganda" })
  country?: string;

  @ApiPropertyOptional({ example: "Kampala" })
  district?: string;

  @ApiPropertyOptional({ example: "Kampala" })
  city?: string;

  @ApiPropertyOptional({ example: "Plot 15, Jinja Road" })
  address?: string;

  @ApiPropertyOptional({ example: "https://organization.org/logo.png" })
  logo?: string;

  @ApiPropertyOptional({ example: "A non-profit organization focused on child welfare" })
  description?: string;

  @ApiProperty({ example: "Africa/Kampala" })
  timezone: string;

  @ApiProperty({ example: "UGX" })
  currency: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "2026-07-26T15:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-07-26T15:00:00.000Z" })
  updatedAt: Date;
}

export class PaginatedOrganizationResponseDto {
  @ApiProperty({ type: [OrganizationResponseDto] })
  items: OrganizationResponseDto[];

  @ApiProperty()
  meta: OrganizationMeta;
}

export class SingleOrganizationResponseDto {
  @ApiProperty({ type: OrganizationResponseDto })
  item: OrganizationResponseDto;
}
