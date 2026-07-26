import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class AssignTeamDto {
  @ApiProperty({
    description: "Array of user IDs to assign as team members",
    example: ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
  })
  @IsUUID("4", { each: true })
  userIds: string[];
}
