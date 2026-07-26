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

import { ResultsFrameworkService } from "./results-framework.service";
import { CreateLogframeDto } from "./dto/create-logframe.dto";
import { UpdateLogframeDto } from "./dto/update-logframe.dto";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { CreateOutcomeDto } from "./dto/create-outcome.dto";
import { CreateOutputDto } from "./dto/create-output.dto";
import { CreateAssumptionDto } from "./dto/create-assumption.dto";
import { CreateRiskDto } from "./dto/create-risk.dto";
import { QueryLogframeDto } from "./dto/query-logframe.dto";
import {
  LogframeResponseDto,
  PaginatedLogframeResponseDto,
  SingleLogframeResponseDto,
} from "./dto/response.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@ApiTags("Results Framework")
@ApiBearerAuth()
@Controller()
export class ResultsFrameworkController {
  constructor(private readonly resultsFrameworkService: ResultsFrameworkService) {}

  @Post("logframes")
  @ApiOperation({ summary: "Create a new logframe", description: "Auto-increments version per project" })
  @ApiCreatedResponse({ type: LogframeResponseDto })
  createLogframe(
    @Body() dto: CreateLogframeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resultsFrameworkService.createLogframe(dto, user);
  }

  @Get("logframes")
  @ApiOperation({ summary: "List logframes", description: "Search by title, project name, or project code. Filter by project or status." })
  @ApiOkResponse({ type: PaginatedLogframeResponseDto })
  findAllLogframes(
    @Query() query: QueryLogframeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resultsFrameworkService.findAllLogframes(query, user);
  }

  @Get("logframes/:id")
  @ApiOperation({ summary: "Get logframe by ID with full hierarchy (goals, outcomes, outputs, assumptions, risks)" })
  @ApiOkResponse({ type: SingleLogframeResponseDto })
  findOneLogframe(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resultsFrameworkService.findOneLogframe(id, user);
  }

  @Patch("logframes/:id")
  @ApiOperation({ summary: "Update logframe", description: "Setting status to ACTIVE auto-approves and deactivates other versions" })
  @ApiOkResponse({ type: LogframeResponseDto })
  updateLogframe(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLogframeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resultsFrameworkService.updateLogframe(id, dto, user);
  }

  @Delete("logframes/:id")
  @ApiOperation({ summary: "Soft-delete logframe" })
  @ApiNoContentResponse({ description: "Logframe deleted" })
  async deleteLogframe(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.resultsFrameworkService.deleteLogframe(id, user);
  }

  @Post("logframes/:id/goals")
  @ApiOperation({ summary: "Create a goal under a logframe" })
  @ApiCreatedResponse({ description: "Goal created" })
  createGoal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateGoalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resultsFrameworkService.createGoal(id, dto, user);
  }

  @Post("goals/:id/outcomes")
  @ApiOperation({ summary: "Create an outcome under a goal" })
  @ApiCreatedResponse({ description: "Outcome created" })
  createOutcome(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateOutcomeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resultsFrameworkService.createOutcome(id, dto, user);
  }

  @Post("outcomes/:id/outputs")
  @ApiOperation({ summary: "Create an output under an outcome" })
  @ApiCreatedResponse({ description: "Output created" })
  createOutput(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateOutputDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resultsFrameworkService.createOutput(id, dto, user);
  }

  @Post("assumptions")
  @ApiOperation({ summary: "Create an assumption linked to a goal, outcome, or output" })
  @ApiCreatedResponse({ description: "Assumption created" })
  createAssumption(
    @Body() dto: CreateAssumptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resultsFrameworkService.createAssumption(dto, user);
  }

  @Post("risks")
  @ApiOperation({ summary: "Create a risk linked to a goal, outcome, or output" })
  @ApiCreatedResponse({ description: "Risk created" })
  createRisk(
    @Body() dto: CreateRiskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resultsFrameworkService.createRisk(dto, user);
  }
}
