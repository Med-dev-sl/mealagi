import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUrl,
  IsBoolean,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOrganizationDto {
  @ApiProperty({ description: "Organization name", example: "Save the Children" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: "Short name / acronym", example: "STC" })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  shortName?: string;

  @ApiPropertyOptional({ description: "Government registration number", example: "NGO-2024-001" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  registrationNumber?: string;

  @ApiPropertyOptional({ description: "Organization type", example: "NGO" })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  organizationType?: string;

  @ApiPropertyOptional({ description: "Contact email", example: "contact@organization.org" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: "Contact phone", example: "+256-312-000-000" })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: "Website URL", example: "https://organization.org" })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: "Country", example: "Uganda" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: "District / Region", example: "Kampala" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({ description: "City", example: "Kampala" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: "Physical address", example: "Plot 15, Jinja Road" })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: "Logo URL", example: "https://organization.org/logo.png" })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ description: "Organization description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Timezone", example: "Africa/Kampala", default: "UTC" })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: "Currency code", example: "UGX", default: "USD" })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: "Whether the organization is active", default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
