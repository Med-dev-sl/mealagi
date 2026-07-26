import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from "@nestjs/swagger";

import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { QueryRoleDto } from "./dto/query-role.dto";
import { AssignPermissionsDto } from "./dto/assign-permissions.dto";
import {
  RoleResponseDto,
  PaginatedRoleResponseDto,
  SingleRoleResponseDto,
} from "./dto/role-response.dto";
import { PermissionResponseDto } from "../permissions/dto/permission-response.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@ApiTags("Roles")
@ApiBearerAuth()
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new role" })
  @ApiCreatedResponse({ type: RoleResponseDto })
  create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rolesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List roles" })
  @ApiOkResponse({ type: PaginatedRoleResponseDto })
  findAll(
    @Query() query: QueryRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rolesService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get role by ID" })
  @ApiOkResponse({ type: SingleRoleResponseDto })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rolesService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update role" })
  @ApiOkResponse({ type: RoleResponseDto })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rolesService.update(id, dto, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete role", description: "System roles cannot be deleted" })
  @ApiNoContentResponse({ description: "Role deleted" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.rolesService.remove(id, user);
  }

  @Post(":id/permissions")
  @ApiOperation({ summary: "Assign permissions to role", description: "Replaces all existing permission assignments" })
  @ApiOkResponse({ type: RoleResponseDto })
  assignPermissions(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rolesService.assignPermissions(id, dto, user);
  }

  @Get(":id/permissions")
  @ApiOperation({ summary: "Get permissions assigned to role" })
  @ApiOkResponse({ type: [PermissionResponseDto] })
  getPermissions(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rolesService.getPermissions(id, user);
  }
}
