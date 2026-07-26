import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class PermissionInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  resource: string;

  @ApiProperty()
  action: string;

  @ApiPropertyOptional()
  description?: string;
}

export class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiPropertyOptional({ type: [PermissionInfo] })
  permissions?: PermissionInfo[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SingleRoleResponseDto {
  @ApiProperty({ type: RoleResponseDto })
  item: RoleResponseDto;
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

export class PaginatedRoleResponseDto {
  @ApiProperty({ type: [RoleResponseDto] })
  items: RoleResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
