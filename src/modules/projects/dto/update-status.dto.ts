import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { ProjectStatus } from "@prisma/client";

export class UpdateStatusDto {
  @ApiProperty({
    description: "New project status",
    enum: ["DRAFT", "PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED", "ARCHIVED"],
    example: "ACTIVE",
  })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}
