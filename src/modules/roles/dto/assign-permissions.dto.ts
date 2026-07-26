import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class AssignPermissionsDto {
  @ApiProperty({ description: "Array of permission IDs to assign to the role" })
  @IsUUID("4", { each: true })
  permissionIds: string[];
}
