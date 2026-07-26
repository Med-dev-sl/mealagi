import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsUUID } from "class-validator";

export class CreateRoleDto {
  @ApiProperty({ example: "Program Manager" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "Manages programs and projects" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Organization ID" })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ description: "Permission IDs to assign" })
  @IsOptional()
  @IsUUID("4", { each: true })
  permissionIds?: string[];
}
