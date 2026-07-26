import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean } from "class-validator";

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: "Senior Program Manager" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Manages programs and projects at senior level" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isActive?: string;
}
