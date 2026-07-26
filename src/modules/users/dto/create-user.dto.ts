import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  IsBoolean,
  MinLength,
  MaxLength,
  IsIn,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ description: "First name", example: "John" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: "Last name", example: "Doe" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ description: "Email address", example: "john.doe@organization.org" })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({ description: "Password", example: "SecurePass123!" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ description: "Gender", example: "male" })
  @IsString()
  @IsOptional()
  @IsIn(["male", "female", "other"])
  gender?: string;

  @ApiPropertyOptional({ description: "Phone number", example: "+256-312-000-000" })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: "Job title", example: "MEAL Officer" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  jobTitle?: string;

  @ApiPropertyOptional({ description: "Employee ID", example: "EMP-001" })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  employeeId?: string;

  @ApiPropertyOptional({ description: "Profile photo URL", example: "https://storage.example.com/photos/john.jpg" })
  @IsString()
  @IsOptional()
  profilePhoto?: string;

  @ApiProperty({ description: "Organization UUID" })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ description: "Role UUID" })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiPropertyOptional({ description: "Whether the user is active", default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
