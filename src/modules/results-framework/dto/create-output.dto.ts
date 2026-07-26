import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOutputDto {
  @ApiPropertyOptional({ description: "Output code", example: "OP-1.1" })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: "Output title", example: "Community health workers trained" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Output description" })
  @IsString()
  @IsOptional()
  description?: string;
}
