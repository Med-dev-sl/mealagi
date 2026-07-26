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

import { OrganizationsService } from "./organizations.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { QueryOrganizationDto } from "./dto/query-organization.dto";
import {
  OrganizationResponseDto,
  PaginatedOrganizationResponseDto,
  SingleOrganizationResponseDto,
} from "./dto/organization-response.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@ApiTags("Organizations")
@ApiBearerAuth()
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new organization", description: "Only SUPER_ADMIN can create organizations" })
  @ApiCreatedResponse({ type: OrganizationResponseDto })
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List organizations", description: "SUPER_ADMIN sees all; ORG_ADMIN sees only their own" })
  @ApiOkResponse({ type: PaginatedOrganizationResponseDto })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  @ApiQuery({ name: "search", required: false, example: "Save" })
  @ApiQuery({ name: "sortBy", required: false, example: "createdAt", enum: ["createdAt", "name", "updatedAt"] })
  @ApiQuery({ name: "sortOrder", required: false, example: "desc", enum: ["asc", "desc"] })
  findAll(
    @Query() query: QueryOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get organization by ID" })
  @ApiOkResponse({ type: SingleOrganizationResponseDto })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update organization" })
  @ApiOkResponse({ type: OrganizationResponseDto })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.update(id, dto, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete organization", description: "Only SUPER_ADMIN can delete organizations" })
  @ApiNoContentResponse({ description: "Organization deleted" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.organizationsService.remove(id, user);
  }
}
