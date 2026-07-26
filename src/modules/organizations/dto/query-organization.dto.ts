import { IsOptional, IsString, IsInt, Min, Max, IsIn } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class QueryOrganizationDto {
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

  @ApiPropertyOptional({ description: "Search by name or country" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Sort field", default: "createdAt", enum: ["createdAt", "name", "updatedAt"] })
  @IsOptional()
  @IsString()
  @IsIn(["createdAt", "name", "updatedAt"])
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ description: "Sort order", default: "desc", enum: ["asc", "desc"] })
  @IsOptional()
  @IsString()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
