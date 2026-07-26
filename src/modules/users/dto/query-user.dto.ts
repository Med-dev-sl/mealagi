import { IsOptional, IsString, IsInt, IsUUID, IsBoolean, Min, Max, IsIn } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class QueryUserDto {
  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: "Search by name, email, or job title" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by organization UUID" })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ description: "Filter by role UUID" })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({ description: "Filter by active status" })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Sort field", default: "createdAt", enum: ["createdAt", "firstName", "lastName", "email", "updatedAt"] })
  @IsOptional()
  @IsString()
  @IsIn(["createdAt", "firstName", "lastName", "email", "updatedAt", "jobTitle"])
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ description: "Sort order", default: "desc", enum: ["asc", "desc"] })
  @IsOptional()
  @IsString()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
