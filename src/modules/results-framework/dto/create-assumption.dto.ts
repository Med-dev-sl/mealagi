import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResultLevel } from "@prisma/client";

export class CreateAssumptionDto {
  @ApiProperty({ enum: ResultLevel, description: "Level this assumption belongs to" })
  @IsEnum(ResultLevel)
  level: ResultLevel;

  @ApiProperty({ description: "ID of the goal, outcome, or output this assumption belongs to" })
  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @ApiProperty({ description: "Assumption description", example: "Government funding remains stable" })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: "Mitigation strategy" })
  @IsString()
  @IsOptional()
  mitigation?: string;
}
