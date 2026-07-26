import { ApiProperty } from "@nestjs/swagger";

class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  avatar!: string | null;
}

class OrganizationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  subscriptionPlan!: string;
}

class RoleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

class PermissionResponseDto {
  @ApiProperty()
  resource!: string;

  @ApiProperty()
  action!: string;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  expiresIn!: number;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ type: OrganizationResponseDto })
  organization!: OrganizationResponseDto;

  @ApiProperty({ type: [RoleResponseDto] })
  roles!: RoleResponseDto[];

  @ApiProperty({ type: [PermissionResponseDto] })
  permissions!: PermissionResponseDto[];
}
