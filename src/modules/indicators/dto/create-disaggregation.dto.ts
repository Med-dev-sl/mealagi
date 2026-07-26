import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDisaggregationDto {
  @ApiProperty({ description: "Disaggregation category", example: "Gender" })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: "Disaggregation value", example: "Female" })
  @IsString()
  @IsNotEmpty()
  value: string;
}
