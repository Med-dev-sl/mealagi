import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResultLevel } from "@prisma/client";

export class CreateRiskDto {
  @ApiProperty({ enum: ResultLevel, description: "Level this risk belongs to" })
  @IsEnum(ResultLevel)
  level: ResultLevel;

  @ApiProperty({ description: "ID of the goal, outcome, or output this risk belongs to" })
  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @ApiProperty({ description: "Risk description", example: "Staff turnover may delay training" })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: "Probability rating", example: "Medium" })
  @IsString()
  @IsOptional()
  probability?: string;

  @ApiPropertyOptional({ description: "Impact rating", example: "High" })
  @IsString()
  @IsOptional()
  impact?: string;

  @ApiPropertyOptional({ description: "Mitigation strategy" })
  @IsString()
  @IsOptional()
  mitigation?: string;
}
