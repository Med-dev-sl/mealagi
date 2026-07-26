import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateMeansOfVerificationDto {
  @ApiProperty({ description: "Title", example: "Monthly health facility reports" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Document type", example: "PDF" })
  @IsString()
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional({ description: "Storage location", example: "S3://bucket/reports/" })
  @IsString()
  @IsOptional()
  storageLocation?: string;
}
