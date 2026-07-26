import { IsBoolean, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ChangeUserStatusDto {
  @ApiProperty({ description: "Whether the user is active", example: true })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
