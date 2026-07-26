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

import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { AssignTeamDto } from "./dto/assign-team.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { QueryProjectDto } from "./dto/query-project.dto";
import {
  ProjectResponseDto,
  PaginatedProjectResponseDto,
  SingleProjectResponseDto,
} from "./dto/project-response.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@ApiTags("Projects")
@ApiBearerAuth()
@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new project" })
  @ApiCreatedResponse({ type: ProjectResponseDto })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List projects", description: "Filter by status, donor, district, sector, organization, project manager, or date range" })
  @ApiOkResponse({ type: PaginatedProjectResponseDto })
  findAll(
    @Query() query: QueryProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get project by ID" })
  @ApiOkResponse({ type: SingleProjectResponseDto })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update project" })
  @ApiOkResponse({ type: ProjectResponseDto })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update project status" })
  @ApiOkResponse({ type: ProjectResponseDto })
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.updateStatus(id, dto, user);
  }

  @Post(":id/team")
  @ApiOperation({ summary: "Assign team members to project", description: "Replaces all existing team members" })
  @ApiOkResponse({ type: ProjectResponseDto })
  assignTeam(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AssignTeamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.assignTeam(id, dto, user);
  }

  @Get(":id/team")
  @ApiOperation({ summary: "Get project team members" })
  @ApiOkResponse({ description: "List of team members" })
  getTeam(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.getTeam(id, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete project" })
  @ApiNoContentResponse({ description: "Project deleted" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.projectsService.remove(id, user);
  }
}
