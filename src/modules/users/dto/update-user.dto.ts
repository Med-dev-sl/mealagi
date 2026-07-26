import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  IsBoolean,
  MaxLength,
  IsIn,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiPropertyOptional({ description: "First name", example: "John" })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: "Last name", example: "Doe" })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: "Email address", example: "john.doe@organization.org" })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

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

  @ApiPropertyOptional({ description: "Job title", example: "Senior MEAL Officer" })
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

  @ApiPropertyOptional({ description: "Role UUID" })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ description: "Whether the user is active" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
