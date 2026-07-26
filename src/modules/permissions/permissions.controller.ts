import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";
import { PermissionsService } from "./permissions.service";
import { PermissionResponseDto } from "./dto/permission-response.dto";

@ApiTags("Permissions")
@ApiBearerAuth()
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: "List all permissions" })
  @ApiOkResponse({ description: "List of permissions", type: [PermissionResponseDto] })
  findAll() {
    return this.permissionsService.findAll();
  }
}
