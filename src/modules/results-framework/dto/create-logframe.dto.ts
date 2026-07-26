import { IsString, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateLogframeDto {
  @ApiProperty({ description: "Project ID" })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: "Logframe title", example: "Results Framework for CHI" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Logframe description" })
  @IsString()
  @IsOptional()
  description?: string;
}
