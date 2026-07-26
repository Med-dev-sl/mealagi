import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class UserRoleInfo {
  @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  id: string;

  @ApiProperty({ example: "MEAL_MANAGER" })
  name: string;
}

class UserOrganizationInfo {
  @ApiProperty({ example: "28b7d95f-d52b-4a23-a245-bdc15442f044" })
  id: string;

  @ApiProperty({ example: "Save the Children Uganda" })
  name: string;
}

class UserMeta {
  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class UserResponseDto {
  @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  id: string;

  @ApiProperty({ example: "John" })
  firstName: string;

  @ApiProperty({ example: "Doe" })
  lastName: string;

  @ApiProperty({ example: "john.doe@organization.org" })
  email: string;

  @ApiPropertyOptional({ example: "+256-312-000-000" })
  phone?: string;

  @ApiPropertyOptional({ example: "male" })
  gender?: string;

  @ApiPropertyOptional({ example: "MEAL Officer" })
  jobTitle?: string;

  @ApiPropertyOptional({ example: "EMP-001" })
  employeeId?: string;

  @ApiPropertyOptional({ example: "https://storage.example.com/photos/john.jpg" })
  profilePhoto?: string;

  @ApiProperty({ type: UserOrganizationInfo })
  organization: UserOrganizationInfo;

  @ApiProperty({ type: [UserRoleInfo] })
  roles: UserRoleInfo[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiProperty({ example: false })
  phoneVerified: boolean;

  @ApiPropertyOptional({ example: "2026-07-26T15:00:00.000Z" })
  lastLogin?: Date;

  @ApiProperty({ example: "2026-07-26T15:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-07-26T15:00:00.000Z" })
  updatedAt: Date;
}

export class PaginatedUserResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  items: UserResponseDto[];

  @ApiProperty()
  meta: UserMeta;
}

export class SingleUserResponseDto {
  @ApiProperty({ type: UserResponseDto })
  item: UserResponseDto;
}
