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

import { IndicatorsService } from "./indicators.service";
import { CreateIndicatorDto } from "./dto/create-indicator.dto";
import { UpdateIndicatorDto } from "./dto/update-indicator.dto";
import { CreateBaselineDto } from "./dto/create-baseline.dto";
import { CreateTargetDto } from "./dto/create-target.dto";
import { CreateDisaggregationDto } from "./dto/create-disaggregation.dto";
import { CreateMeansOfVerificationDto } from "./dto/create-means-of-verification.dto";
import { QueryIndicatorDto } from "./dto/query-indicator.dto";
import {
  IndicatorResponseDto,
  PaginatedIndicatorResponseDto,
  SingleIndicatorResponseDto,
} from "./dto/indicator-response.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@ApiTags("Indicators")
@ApiBearerAuth()
@Controller("indicators")
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new indicator" })
  @ApiCreatedResponse({ type: IndicatorResponseDto })
  create(
    @Body() dto: CreateIndicatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.indicatorsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List indicators", description: "Filter by project, outcome, output, type, frequency, or status. Search by code, name, or data source." })
  @ApiOkResponse({ type: PaginatedIndicatorResponseDto })
  findAll(
    @Query() query: QueryIndicatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.indicatorsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get indicator by ID with baselines, targets, disaggregations, and means of verification" })
  @ApiOkResponse({ type: SingleIndicatorResponseDto })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.indicatorsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update indicator" })
  @ApiOkResponse({ type: IndicatorResponseDto })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateIndicatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.indicatorsService.update(id, dto, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete indicator" })
  @ApiNoContentResponse({ description: "Indicator deleted" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.indicatorsService.remove(id, user);
  }

  @Post(":id/baselines")
  @ApiOperation({ summary: "Create baseline for indicator", description: "Only one baseline per indicator" })
  @ApiCreatedResponse({ description: "Baseline created" })
  createBaseline(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateBaselineDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.indicatorsService.createBaseline(id, dto, user);
  }

  @Post(":id/targets")
  @ApiOperation({ summary: "Create target for indicator", description: "Multiple targets allowed per indicator" })
  @ApiCreatedResponse({ description: "Target created" })
  createTarget(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateTargetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.indicatorsService.createTarget(id, dto, user);
  }

  @Post(":id/disaggregations")
  @ApiOperation({ summary: "Add disaggregation to indicator", description: "E.g. Gender, Age Group, Location" })
  @ApiCreatedResponse({ description: "Disaggregation created" })
  createDisaggregation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateDisaggregationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.indicatorsService.createDisaggregation(id, dto, user);
  }

  @Post(":id/means-of-verification")
  @ApiOperation({ summary: "Add means of verification to indicator" })
  @ApiCreatedResponse({ description: "Means of verification created" })
  createMeansOfVerification(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateMeansOfVerificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.indicatorsService.createMeansOfVerification(id, dto, user);
  }

  @Get(":id/baselines")
  @ApiOperation({ summary: "Get baselines for indicator" })
  @ApiOkResponse({ description: "List of baselines" })
  getBaselines(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.indicatorsService.getBaselines(id, user);
  }

  @Get(":id/targets")
  @ApiOperation({ summary: "Get targets for indicator" })
  @ApiOkResponse({ description: "List of targets" })
  getTargets(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.indicatorsService.getTargets(id, user);
  }
}
