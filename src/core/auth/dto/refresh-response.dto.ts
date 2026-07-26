import { ApiProperty } from "@nestjs/swagger";

export class RefreshResponseDto {
  @ApiProperty({ description: "New JWT access token" })
  accessToken!: string;

  @ApiProperty({ description: "New JWT refresh token" })
  refreshToken!: string;

  @ApiProperty({ description: "Access token expiry in seconds", example: 900 })
  expiresIn!: number;
}
