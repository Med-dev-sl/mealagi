import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  MaxLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: "Project name", example: "Community Health Initiative" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  projectName?: string;

  @ApiPropertyOptional({ description: "Short name / acronym", example: "CHI" })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  shortName?: string;

  @ApiPropertyOptional({ description: "Donor name", example: "USAID" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  donor?: string;

  @ApiPropertyOptional({ description: "Implementing partner", example: "World Vision" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  implementingPartner?: string;

  @ApiPropertyOptional({ description: "Funding source", example: "Government of Uganda" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  fundingSource?: string;

  @ApiPropertyOptional({ description: "Budget amount", example: 500000.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ description: "Currency code", example: "USD" })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: "Project start date", example: "2026-01-01T00:00:00.000Z" })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: "Project end date", example: "2026-12-31T00:00:00.000Z" })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: "District / Region", example: "Kampala" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({ description: "Chiefdom", example: "Kampala Central" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  chiefdom?: string;

  @ApiPropertyOptional({ description: "Community", example: "Luzira" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  community?: string;

  @ApiPropertyOptional({ description: "Sector", example: "Health" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sector?: string;

  @ApiPropertyOptional({ description: "Project description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Project objectives" })
  @IsString()
  @IsOptional()
  objectives?: string;

  @ApiPropertyOptional({ description: "Expected outcomes" })
  @IsString()
  @IsOptional()
  expectedOutcomes?: string;

  @ApiPropertyOptional({ description: "Target beneficiaries", example: "5,000 children under 5" })
  @IsString()
  @IsOptional()
  targetBeneficiaries?: string;
}
