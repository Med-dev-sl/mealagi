import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateGoalDto {
  @ApiProperty({ description: "Goal title", example: "Improved health outcomes for children under 5" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Goal description" })
  @IsString()
  @IsOptional()
  description?: string;
}
