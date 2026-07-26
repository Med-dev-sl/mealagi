import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PermissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  resource: string;

  @ApiProperty()
  action: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isSystem: boolean;
}
