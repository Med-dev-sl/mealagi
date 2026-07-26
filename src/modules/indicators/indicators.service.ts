import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";
import { CreateIndicatorDto } from "./dto/create-indicator.dto";
import { UpdateIndicatorDto } from "./dto/update-indicator.dto";
import { CreateBaselineDto } from "./dto/create-baseline.dto";
import { CreateTargetDto } from "./dto/create-target.dto";
import { CreateDisaggregationDto } from "./dto/create-disaggregation.dto";
import { CreateMeansOfVerificationDto } from "./dto/create-means-of-verification.dto";
import { QueryIndicatorDto } from "./dto/query-indicator.dto";
import { AUDIT_ACTION } from "../../core/constants";
import { Prisma, IndicatorStatus } from "@prisma/client";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@Injectable()
export class IndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIndicatorDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create indicators");
    }

    const output = await this.prisma.output.findUnique({
      where: { id: dto.outputId },
      include: {
        outcome: {
          include: {
            goal: {
              include: {
                logframe: {
                  include: { project: true },
                },
              },
            },
          },
        },
      },
    });

    if (!output || output.deletedAt) {
      throw new BadRequestException("Output not found");
    }

    const project = output.outcome.goal.logframe.project;
    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only create indicators in your own organization");
    }

    const existingCode = await this.prisma.indicator.findFirst({
      where: {
        code: dto.code,
        deletedAt: null,
        output: {
          outcome: {
            goal: {
              logframe: {
                projectId: project.id,
              },
            },
          },
        },
      },
    });
    if (existingCode) {
      throw new ConflictException("An indicator with this code already exists in this project");
    }

    if (dto.responsiblePersonId) {
      const person = await this.prisma.user.findUnique({ where: { id: dto.responsiblePersonId } });
      if (!person || person.deletedAt) {
        throw new BadRequestException("Responsible person not found");
      }
    }

    const indicatorId = await this.prisma.$transaction(async (tx) => {
      const indicator = await tx.indicator.create({
        data: {
          outputId: dto.outputId,
          code: dto.code,
          name: dto.name,
          description: dto.description,
          indicatorType: dto.indicatorType,
          unitOfMeasure: dto.unitOfMeasure,
          reportingFrequency: dto.reportingFrequency ?? "ANNUAL",
          dataSource: dto.dataSource,
          calculationMethod: dto.calculationMethod,
          responsiblePersonId: dto.responsiblePersonId,
          createdById: user.id,
        } as Prisma.IndicatorUncheckedCreateInput,
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.INDICATOR_CREATED,
          resource: "indicator",
          resourceId: indicator.id,
          changes: { code: dto.code, name: dto.name } as Prisma.InputJsonValue,
        },
      });

      return indicator.id;
    });

    const created = await this.fetchById(indicatorId);
    return this.formatResponse(created!);
  }

  async findAll(query: QueryIndicatorDto, user: AuthenticatedUser) {
    const {
      page = 1,
      limit = 10,
      search,
      projectId,
      outcomeId,
      outputId,
      indicatorType,
      reportingFrequency,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.IndicatorWhereInput = { deletedAt: null };

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    const isOrgAdmin = user.roles.some((r) => r.name === "ORGANIZATION_ADMIN");
    const isProjectManager = user.roles.some((r) => r.name === "PROJECT_MANAGER");
    const isFieldOfficer = user.roles.some((r) => r.name === "FIELD_OFFICER");

    const outputWhere: Prisma.OutputWhereInput = {};

    if (!isSuperAdmin) {
      const accessible = await this.getAccessibleProjectIds(user, isOrgAdmin, isProjectManager, isFieldOfficer);
      outputWhere.outcome = {
        goal: { logframe: { projectId: { in: accessible } } },
      };
    }

    if (projectId) {
      outputWhere.outcome = {
        ...(outputWhere.outcome as object || {}),
        goal: { logframe: { projectId } },
      };
    }

    if (outcomeId) {
      outputWhere.outcome = { ...(outputWhere.outcome as object || {}), id: outcomeId };
    }

    if (outputId) {
      outputWhere.id = outputId;
    }

    if (Object.keys(outputWhere).length > 0) {
      where.output = outputWhere;
    }

    if (indicatorType) {
      where.indicatorType = indicatorType;
    }

    if (reportingFrequency) {
      where.reportingFrequency = reportingFrequency;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      const searchOr: Prisma.IndicatorWhereInput[] = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { dataSource: { contains: search, mode: "insensitive" } },
      ];

      if (where.OR) {
        where.AND = [{ OR: searchOr }];
      } else {
        where.OR = searchOr;
      }
    }

    const orderBy: Prisma.IndicatorOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.indicator.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
        output: true,
          baselines: { where: { deletedAt: null } },
          targets: { where: { deletedAt: null } },
          disaggregations: { where: { deletedAt: null } },
          meansOfVerifications: { where: { deletedAt: null } },
        },
      }),
      this.prisma.indicator.count({ where }),
    ]);

    return {
      items: items.map((i) => this.formatResponse(i)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const indicator = await this.prisma.indicator.findUnique({
      where: { id },
      include: {
        output: {
          include: {
            outcome: {
              include: {
                goal: { include: { logframe: { include: { project: { select: { organizationId: true } } } } } },
              },
            },
          },
        },
        baselines: { where: { deletedAt: null } },
        targets: { where: { deletedAt: null }, orderBy: { targetDate: "asc" } },
        disaggregations: { where: { deletedAt: null } },
        meansOfVerifications: { where: { deletedAt: null } },
      },
    });

    if (!indicator || indicator.deletedAt) {
      throw new NotFoundException("Indicator not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin) {
      const orgId = indicator.output.outcome.goal.logframe.project.organizationId;
      if (orgId !== user.organizationId) {
        throw new ForbiddenException("You can only view indicators in your own organization");
      }
    }

    return { item: this.formatResponse(indicator) };
  }

  async update(id: string, dto: UpdateIndicatorDto, user: AuthenticatedUser) {
    const indicator = await this.prisma.indicator.findUnique({
      where: { id },
      include: {
        output: {
          include: {
            outcome: {
              include: {
                goal: { include: { logframe: { include: { project: true } } } },
              },
            },
          },
        },
      },
    });

    if (!indicator || indicator.deletedAt) {
      throw new NotFoundException("Indicator not found");
    }

    const hasUpdate = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "update",
    );
    if (!hasUpdate) {
      throw new ForbiddenException("You do not have permission to update indicators");
    }

    const project = indicator.output.outcome.goal.logframe.project;
    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only update indicators in your own organization");
    }

    if (dto.code && dto.code !== indicator.code) {
      const existingCode = await this.prisma.indicator.findFirst({
        where: {
          code: dto.code,
          deletedAt: null,
          id: { not: id },
          output: {
            outcome: {
              goal: {
                logframe: {
                  projectId: project.id,
                },
              },
            },
          },
        },
      });
      if (existingCode) {
        throw new ConflictException("An indicator with this code already exists in this project");
      }
    }

    if (dto.responsiblePersonId) {
      const person = await this.prisma.user.findUnique({ where: { id: dto.responsiblePersonId } });
      if (!person || person.deletedAt) {
        throw new BadRequestException("Responsible person not found");
      }
    }

    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        const indicatorKey = key as keyof typeof indicator;
        if (String(value) !== String(indicator[indicatorKey])) {
          changes[key] = value;
        }
      }
    }

    const auditAction =
      dto.status === IndicatorStatus.ARCHIVED
        ? AUDIT_ACTION.INDICATOR_ARCHIVED
        : AUDIT_ACTION.INDICATOR_UPDATED;

    const updateData: Prisma.IndicatorUncheckedUpdateInput = { updatedById: user.id };

    const fields: (keyof UpdateIndicatorDto)[] = [
      "code", "name", "description", "indicatorType", "unitOfMeasure",
      "reportingFrequency", "dataSource", "calculationMethod",
      "responsiblePersonId", "status",
    ];
    for (const field of fields) {
      if (dto[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = dto[field];
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.indicator.update({ where: { id }, data: updateData });

        await tx.auditLog.create({
          data: {
            organizationId: project.organizationId,
            userId: user.id,
            action: auditAction,
            resource: "indicator",
            resourceId: id,
            changes: changes as Prisma.InputJsonValue,
          },
        });
      });
    }

    const updated = await this.fetchById(id);
    return this.formatResponse(updated!);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const hasDelete = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "delete",
    );
    if (!hasDelete) {
      throw new ForbiddenException("You do not have permission to delete indicators");
    }

    const indicator = await this.prisma.indicator.findUnique({
      where: { id },
      include: {
        output: {
          include: {
            outcome: {
              include: {
                goal: { include: { logframe: { include: { project: true } } } },
              },
            },
          },
        },
      },
    });

    if (!indicator || indicator.deletedAt) {
      throw new NotFoundException("Indicator not found");
    }

    const project = indicator.output.outcome.goal.logframe.project;
    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only delete indicators in your own organization");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.indicator.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: IndicatorStatus.ARCHIVED,
          updatedById: user.id,
        } as Prisma.IndicatorUncheckedUpdateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.INDICATOR_DELETED,
          resource: "indicator",
          resourceId: id,
          changes: { name: indicator.name, code: indicator.code } as Prisma.InputJsonValue,
        },
      });
    });
  }

  async createBaseline(indicatorId: string, dto: CreateBaselineDto, user: AuthenticatedUser) {
    const indicator = await this.prisma.indicator.findUnique({
      where: { id: indicatorId },
      include: {
        output: {
          include: {
            outcome: {
              include: {
                goal: { include: { logframe: { include: { project: true } } } },
              },
            },
          },
        },
      },
    });

    if (!indicator || indicator.deletedAt) {
      throw new NotFoundException("Indicator not found");
    }

    const project = indicator.output.outcome.goal.logframe.project;
    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only add baselines in your own organization");
    }

    const existingBaseline = await this.prisma.baseline.findUnique({
      where: { indicatorId },
    });
    if (existingBaseline) {
      throw new ConflictException("A baseline already exists for this indicator");
    }

    const baseline = await this.prisma.$transaction(async (tx) => {
      const created = await tx.baseline.create({
        data: {
          indicatorId,
          value: dto.value,
          baselineDate: new Date(dto.baselineDate),
          source: dto.source,
          verifiedBy: dto.verifiedBy,
          createdById: user.id,
        } as Prisma.BaselineUncheckedCreateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.BASELINE_CREATED,
          resource: "baseline",
          resourceId: created.id,
          changes: { indicatorId, value: dto.value } as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return {
      id: baseline.id,
      indicatorId: baseline.indicatorId,
      value: baseline.value,
      baselineDate: baseline.baselineDate,
      source: baseline.source ?? undefined,
      verifiedBy: baseline.verifiedBy ?? undefined,
    };
  }

  async createTarget(indicatorId: string, dto: CreateTargetDto, user: AuthenticatedUser) {
    const indicator = await this.prisma.indicator.findUnique({
      where: { id: indicatorId },
      include: {
        output: {
          include: {
            outcome: {
              include: {
                goal: { include: { logframe: { include: { project: true } } } },
              },
            },
          },
        },
      },
    });

    if (!indicator || indicator.deletedAt) {
      throw new NotFoundException("Indicator not found");
    }

    const project = indicator.output.outcome.goal.logframe.project;
    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only add targets in your own organization");
    }

    const target = await this.prisma.$transaction(async (tx) => {
      const created = await tx.target.create({
        data: {
          indicatorId,
          reportingPeriod: dto.reportingPeriod,
          targetValue: dto.targetValue,
          targetDate: new Date(dto.targetDate),
          createdById: user.id,
        } as Prisma.TargetUncheckedCreateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.TARGET_CREATED,
          resource: "target",
          resourceId: created.id,
          changes: { indicatorId, reportingPeriod: dto.reportingPeriod, targetValue: dto.targetValue } as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return {
      id: target.id,
      indicatorId: target.indicatorId,
      reportingPeriod: target.reportingPeriod,
      targetValue: target.targetValue,
      targetDate: target.targetDate,
    };
  }

  async createDisaggregation(indicatorId: string, dto: CreateDisaggregationDto, user: AuthenticatedUser) {
    const indicator = await this.prisma.indicator.findUnique({
      where: { id: indicatorId },
      include: {
        output: {
          include: {
            outcome: {
              include: {
                goal: { include: { logframe: { include: { project: true } } } },
              },
            },
          },
        },
      },
    });

    if (!indicator || indicator.deletedAt) {
      throw new NotFoundException("Indicator not found");
    }

    const project = indicator.output.outcome.goal.logframe.project;
    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only add disaggregations in your own organization");
    }

    const disagg = await this.prisma.$transaction(async (tx) => {
      const created = await tx.disaggregation.create({
        data: {
          indicatorId,
          category: dto.category,
          value: dto.value,
          createdById: user.id,
        } as Prisma.DisaggregationUncheckedCreateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.DISAGGREGATION_CREATED,
          resource: "disaggregation",
          resourceId: created.id,
          changes: { indicatorId, category: dto.category, value: dto.value } as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return {
      id: disagg.id,
      indicatorId: disagg.indicatorId,
      category: disagg.category,
      value: disagg.value,
    };
  }

  async createMeansOfVerification(indicatorId: string, dto: CreateMeansOfVerificationDto, user: AuthenticatedUser) {
    const indicator = await this.prisma.indicator.findUnique({
      where: { id: indicatorId },
      include: {
        output: {
          include: {
            outcome: {
              include: {
                goal: { include: { logframe: { include: { project: true } } } },
              },
            },
          },
        },
      },
    });

    if (!indicator || indicator.deletedAt) {
      throw new NotFoundException("Indicator not found");
    }

    const project = indicator.output.outcome.goal.logframe.project;
    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only add means of verification in your own organization");
    }

    const mov = await this.prisma.$transaction(async (tx) => {
      const created = await tx.meansOfVerification.create({
        data: {
          indicatorId,
          title: dto.title,
          description: dto.description,
          documentType: dto.documentType,
          storageLocation: dto.storageLocation,
          createdById: user.id,
        } as Prisma.MeansOfVerificationUncheckedCreateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.MOV_CREATED,
          resource: "meansOfVerification",
          resourceId: created.id,
          changes: { indicatorId, title: dto.title } as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return {
      id: mov.id,
      indicatorId: mov.indicatorId,
      title: mov.title,
      description: mov.description ?? undefined,
      documentType: mov.documentType ?? undefined,
      storageLocation: mov.storageLocation ?? undefined,
    };
  }

  async getBaselines(indicatorId: string, user: AuthenticatedUser) {
    const indicator = await this.prisma.indicator.findUnique({ where: { id: indicatorId } });
    if (!indicator || indicator.deletedAt) {
      throw new NotFoundException("Indicator not found");
    }

    const baselines = await this.prisma.baseline.findMany({
      where: { indicatorId, deletedAt: null },
    });

    return {
      items: baselines.map((b) => ({
        id: b.id,
        indicatorId: b.indicatorId,
        value: b.value,
        baselineDate: b.baselineDate,
        source: b.source ?? undefined,
        verifiedBy: b.verifiedBy ?? undefined,
      })),
    };
  }

  async getTargets(indicatorId: string, user: AuthenticatedUser) {
    const indicator = await this.prisma.indicator.findUnique({ where: { id: indicatorId } });
    if (!indicator || indicator.deletedAt) {
      throw new NotFoundException("Indicator not found");
    }

    const targets = await this.prisma.target.findMany({
      where: { indicatorId, deletedAt: null },
      orderBy: { targetDate: "asc" },
    });

    return {
      items: targets.map((t) => ({
        id: t.id,
        indicatorId: t.indicatorId,
        reportingPeriod: t.reportingPeriod,
        targetValue: t.targetValue,
        targetDate: t.targetDate,
      })),
    };
  }

  private async getAccessibleProjectIds(
    user: AuthenticatedUser,
    isOrgAdmin: boolean,
    isProjectManager: boolean,
    isFieldOfficer: boolean,
  ): Promise<string[]> {
    if (isOrgAdmin) {
      const projects = await this.prisma.project.findMany({
        where: { organizationId: user.organizationId, deletedAt: null },
        select: { id: true },
      });
      return projects.map((p) => p.id);
    }

    if (isProjectManager || isFieldOfficer) {
      const projects = await this.prisma.project.findMany({
        where: {
          organizationId: user.organizationId,
          deletedAt: null,
          OR: [
            { projectManagerId: user.id },
            { teamMembers: { some: { userId: user.id } } },
          ],
        },
        select: { id: true },
      });
      return projects.map((p) => p.id);
    }

    return [];
  }

  private async fetchById(id: string) {
    const indicator = await this.prisma.indicator.findUnique({
      where: { id },
      include: {
        output: {
          include: {
            outcome: {
              include: {
                goal: { include: { logframe: { include: { project: { select: { id: true, organizationId: true } } } } } },
              },
            },
          },
        },
        baselines: { where: { deletedAt: null } },
        targets: { where: { deletedAt: null }, orderBy: { targetDate: "asc" } },
        disaggregations: { where: { deletedAt: null } },
        meansOfVerifications: { where: { deletedAt: null } },
      },
    });
    return indicator;
  }

  private formatResponse(indicator: {
    id: string;
    outputId: string;
    code: string;
    name: string;
    description: string | null;
    indicatorType: string | null;
    unitOfMeasure: string | null;
    reportingFrequency: string;
    dataSource: string | null;
    calculationMethod: string | null;
    responsiblePersonId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    output: { id: string; title: string; code: string | null };
    baselines: { id: string; value: string; baselineDate: Date; source: string | null; verifiedBy: string | null }[];
    targets: { id: string; reportingPeriod: string; targetValue: string; targetDate: Date }[];
    disaggregations: { id: string; category: string; value: string }[];
    meansOfVerifications: { id: string; title: string; description: string | null; documentType: string | null; storageLocation: string | null }[];
  }) {
    return {
      id: indicator.id,
      outputId: indicator.outputId,
      code: indicator.code,
      name: indicator.name,
      description: indicator.description ?? undefined,
      indicatorType: indicator.indicatorType ?? undefined,
      unitOfMeasure: indicator.unitOfMeasure ?? undefined,
      reportingFrequency: indicator.reportingFrequency,
      dataSource: indicator.dataSource ?? undefined,
      calculationMethod: indicator.calculationMethod ?? undefined,
      responsiblePersonId: indicator.responsiblePersonId ?? undefined,
      status: indicator.status,
      output: indicator.output
        ? { id: indicator.output.id, title: indicator.output.title, code: indicator.output.code ?? undefined }
        : undefined,
      baselines: indicator.baselines.map((b) => ({
        id: b.id,
        value: b.value,
        baselineDate: b.baselineDate,
        source: b.source ?? undefined,
        verifiedBy: b.verifiedBy ?? undefined,
      })),
      targets: indicator.targets.map((t) => ({
        id: t.id,
        reportingPeriod: t.reportingPeriod,
        targetValue: t.targetValue,
        targetDate: t.targetDate,
      })),
      disaggregations: indicator.disaggregations.map((d) => ({
        id: d.id,
        category: d.category,
        value: d.value,
      })),
      meansOfVerifications: indicator.meansOfVerifications.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description ?? undefined,
        documentType: m.documentType ?? undefined,
        storageLocation: m.storageLocation ?? undefined,
      })),
      createdAt: indicator.createdAt,
      updatedAt: indicator.updatedAt,
    };
  }
}
