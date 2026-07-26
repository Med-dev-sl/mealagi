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
  ApiQuery,
} from "@nestjs/swagger";

import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangeUserStatusDto } from "./dto/change-user-status.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import {
  UserResponseDto,
  PaginatedUserResponseDto,
  SingleUserResponseDto,
} from "./dto/user-response.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new user", description: "SUPER_ADMIN can create in any org; ORG_ADMIN only in their own" })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List users", description: "SUPER_ADMIN sees all; ORG_ADMIN sees their org; standard users see only themselves" })
  @ApiOkResponse({ type: PaginatedUserResponseDto })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  @ApiQuery({ name: "search", required: false, example: "John" })
  @ApiQuery({ name: "organizationId", required: false, example: "28b7d95f-d52b-4a23-a245-bdc15442f044" })
  @ApiQuery({ name: "roleId", required: false, example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @ApiQuery({ name: "isActive", required: false, example: true })
  @ApiQuery({ name: "sortBy", required: false, example: "createdAt", enum: ["createdAt", "firstName", "lastName", "email", "updatedAt", "jobTitle"] })
  @ApiQuery({ name: "sortOrder", required: false, example: "desc", enum: ["asc", "desc"] })
  findAll(
    @Query() query: QueryUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiOkResponse({ type: SingleUserResponseDto })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user" })
  @ApiOkResponse({ type: UserResponseDto })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Activate or deactivate a user" })
  @ApiOkResponse({ type: UserResponseDto })
  changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeUserStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.changeStatus(id, dto, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete a user" })
  @ApiNoContentResponse({ description: "User deleted" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.usersService.remove(id, user);
  }
}
