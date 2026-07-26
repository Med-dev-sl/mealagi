import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOutcomeDto {
  @ApiPropertyOptional({ description: "Outcome code", example: "OC-1" })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: "Outcome title", example: "Reduced under-5 mortality rate" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Outcome description" })
  @IsString()
  @IsOptional()
  description?: string;
}
