import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "admin@aimeal.local", description: "User email address" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Admin@123456", description: "User password" })
  @IsString()
  @MinLength(8)
  password!: string;
}
