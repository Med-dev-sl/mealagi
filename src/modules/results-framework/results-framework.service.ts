import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";
import { CreateLogframeDto } from "./dto/create-logframe.dto";
import { UpdateLogframeDto } from "./dto/update-logframe.dto";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { CreateOutcomeDto } from "./dto/create-outcome.dto";
import { CreateOutputDto } from "./dto/create-output.dto";
import { CreateAssumptionDto } from "./dto/create-assumption.dto";
import { CreateRiskDto } from "./dto/create-risk.dto";
import { QueryLogframeDto } from "./dto/query-logframe.dto";
import { AUDIT_ACTION } from "../../core/constants";
import { Prisma, LogframeStatus } from "@prisma/client";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@Injectable()
export class ResultsFrameworkService {
  constructor(private readonly prisma: PrismaService) {}

  async createLogframe(dto: CreateLogframeDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create logframes");
    }

    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project || project.deletedAt) {
      throw new BadRequestException("Project not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    const isOrgAdmin = user.roles.some((r) => r.name === "ORGANIZATION_ADMIN");
    if (!isSuperAdmin && !isOrgAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only create logframes in your own organization");
    }

    const latestVersion = await this.prisma.logframe.findFirst({
      where: { projectId: dto.projectId, deletedAt: null },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (latestVersion?.version ?? 0) + 1;

    const logframeId = await this.prisma.$transaction(async (tx) => {
      const logframe = await tx.logframe.create({
        data: {
          projectId: dto.projectId,
          title: dto.title,
          description: dto.description,
          version: nextVersion,
          createdById: user.id,
        } as Prisma.LogframeUncheckedCreateInput,
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.LOGFRAME_CREATED,
          resource: "logframe",
          resourceId: logframe.id,
          changes: {
            title: dto.title,
            version: nextVersion,
            projectId: dto.projectId,
          } as Prisma.InputJsonValue,
        },
      });

      return logframe.id;
    });

    const created = await this.fetchLogframeById(logframeId);
    return this.formatLogframeResponse(created!);
  }

  async findAllLogframes(query: QueryLogframeDto, user: AuthenticatedUser) {
    const {
      page = 1,
      limit = 10,
      search,
      projectId,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LogframeWhereInput = { deletedAt: null };

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    const isOrgAdmin = user.roles.some((r) => r.name === "ORGANIZATION_ADMIN");
    const isProjectManager = user.roles.some((r) => r.name === "PROJECT_MANAGER");
    const isFieldOfficer = user.roles.some((r) => r.name === "FIELD_OFFICER");

    if (!isSuperAdmin) {
      const accessibleProjectIds = await this.getAccessibleProjectIds(user, isOrgAdmin, isProjectManager, isFieldOfficer);
      if (projectId) {
        where.projectId = { in: accessibleProjectIds.filter((id) => id === projectId) };
      } else {
        where.projectId = { in: accessibleProjectIds };
      }
    } else if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      const searchOr: Prisma.LogframeWhereInput[] = [
        { title: { contains: search, mode: "insensitive" } },
        { project: { projectName: { contains: search, mode: "insensitive" } } },
        { project: { projectCode: { contains: search, mode: "insensitive" } } },
      ];

      if (where.OR) {
        where.AND = [{ OR: searchOr }];
      } else {
        where.OR = searchOr;
      }
    }

    const orderBy: Prisma.LogframeOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.logframe.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          goals: {
            where: { deletedAt: null },
            include: {
              outcomes: {
                where: { deletedAt: null },
                include: {
                  outputs: { where: { deletedAt: null } },
                },
              },
            },
          },
        },
      }),
      this.prisma.logframe.count({ where }),
    ]);

    return {
      items: items.map((l) => this.formatLogframeResponse(l)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneLogframe(id: string, user: AuthenticatedUser) {
    const logframe = await this.fetchLogframeById(id);

    if (!logframe || logframe.deletedAt) {
      throw new NotFoundException("Logframe not found");
    }

    const project = await this.prisma.project.findUnique({
      where: { id: logframe.projectId },
      select: { organizationId: true },
    });

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project?.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only view logframes in your own organization");
    }

    const assumptions = await this.prisma.assumption.findMany({
      where: { deletedAt: null },
    });

    const risks = await this.prisma.risk.findMany({
      where: { deletedAt: null },
    });

    return {
      item: {
        ...this.formatLogframeResponse(logframe),
        assumptions: assumptions.map((a) => ({
          id: a.id,
          level: a.level,
          referenceId: a.referenceId,
          description: a.description,
          mitigation: a.mitigation ?? undefined,
        })),
        risks: risks.map((r) => ({
          id: r.id,
          level: r.level,
          referenceId: r.referenceId,
          description: r.description,
          probability: r.probability ?? undefined,
          impact: r.impact ?? undefined,
          mitigation: r.mitigation ?? undefined,
        })),
      },
    };
  }

  async updateLogframe(id: string, dto: UpdateLogframeDto, user: AuthenticatedUser) {
    const logframe = await this.prisma.logframe.findUnique({ where: { id } });

    if (!logframe || logframe.deletedAt) {
      throw new NotFoundException("Logframe not found");
    }

    const hasUpdate = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "update",
    );
    if (!hasUpdate) {
      throw new ForbiddenException("You do not have permission to update logframes");
    }

    const project = await this.prisma.project.findUnique({
      where: { id: logframe.projectId },
      select: { organizationId: true },
    });

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project?.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only update logframes in your own organization");
    }

    if (dto.status === LogframeStatus.ACTIVE) {
      const existingActive = await this.prisma.logframe.findFirst({
        where: {
          projectId: logframe.projectId,
          status: LogframeStatus.ACTIVE,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingActive) {
        throw new ConflictException("An active logframe already exists for this project");
      }
    }

    const changes: Record<string, unknown> = {};
    if (dto.title !== undefined && dto.title !== logframe.title) changes.title = dto.title;
    if (dto.description !== undefined && dto.description !== logframe.description) changes.description = dto.description;

    if (dto.status === LogframeStatus.ACTIVE) {
      changes.approvedAt = new Date().toISOString();
    }

    const updateData: Prisma.LogframeUncheckedUpdateInput = {
      updatedById: user.id,
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === LogframeStatus.ACTIVE) {
        updateData.approvedBy = user.id;
        updateData.approvedAt = new Date();
      }
    }

    const auditAction =
      dto.status === LogframeStatus.ACTIVE
        ? AUDIT_ACTION.VERSION_APPROVED
        : AUDIT_ACTION.LOGFRAME_UPDATED;

    await this.prisma.$transaction(async (tx) => {
      await tx.logframe.update({
        where: { id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          organizationId: project!.organizationId,
          userId: user.id,
          action: auditAction,
          resource: "logframe",
          resourceId: id,
          changes: {
            ...changes,
            ...(dto.status !== undefined ? { previousStatus: logframe.status, newStatus: dto.status } : {}),
          } as Prisma.InputJsonValue,
        },
      });
    });

    const updated = await this.fetchLogframeById(id);
    return this.formatLogframeResponse(updated!);
  }

  async deleteLogframe(id: string, user: AuthenticatedUser) {
    const hasDelete = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "delete",
    );
    if (!hasDelete) {
      throw new ForbiddenException("You do not have permission to delete logframes");
    }

    const logframe = await this.prisma.logframe.findUnique({ where: { id } });

    if (!logframe || logframe.deletedAt) {
      throw new NotFoundException("Logframe not found");
    }

    const project = await this.prisma.project.findUnique({
      where: { id: logframe.projectId },
      select: { organizationId: true, projectName: true },
    });

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project?.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only delete logframes in your own organization");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.logframe.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedById: user.id,
        } as Prisma.LogframeUncheckedUpdateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: project!.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.LOGFRAME_DELETED,
          resource: "logframe",
          resourceId: id,
          changes: {
            title: logframe.title,
            version: logframe.version,
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  async createGoal(logframeId: string, dto: CreateGoalDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create goals");
    }

    const logframe = await this.prisma.logframe.findUnique({ where: { id: logframeId } });

    if (!logframe || logframe.deletedAt) {
      throw new NotFoundException("Logframe not found");
    }

    const project = await this.prisma.project.findUnique({
      where: { id: logframe.projectId },
      select: { organizationId: true },
    });

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project?.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only create goals in your own organization");
    }

    const goalId = await this.prisma.$transaction(async (tx) => {
      const goal = await tx.goal.create({
        data: {
          logframeId,
          title: dto.title,
          description: dto.description,
          createdById: user.id,
        } as Prisma.GoalUncheckedCreateInput,
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          organizationId: project!.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.GOAL_CREATED,
          resource: "goal",
          resourceId: goal.id,
          changes: {
            title: dto.title,
            logframeId,
          } as Prisma.InputJsonValue,
        },
      });

      return goal.id;
    });

    const created = await this.prisma.goal.findUnique({ where: { id: goalId } });
    return {
      id: created!.id,
      logframeId: created!.logframeId,
      title: created!.title,
      description: created!.description ?? undefined,
    };
  }

  async createOutcome(goalId: string, dto: CreateOutcomeDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create outcomes");
    }

    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });

    if (!goal || goal.deletedAt) {
      throw new NotFoundException("Goal not found");
    }

    const logframe = await this.prisma.logframe.findUnique({ where: { id: goal.logframeId } });
    const project = await this.prisma.project.findUnique({
      where: { id: logframe!.projectId },
      select: { organizationId: true },
    });

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project?.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only create outcomes in your own organization");
    }

    const outcomeId = await this.prisma.$transaction(async (tx) => {
      const outcome = await tx.outcome.create({
        data: {
          goalId,
          code: dto.code,
          title: dto.title,
          description: dto.description,
          createdById: user.id,
        } as Prisma.OutcomeUncheckedCreateInput,
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          organizationId: project!.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.OUTCOME_CREATED,
          resource: "outcome",
          resourceId: outcome.id,
          changes: {
            title: dto.title,
            code: dto.code,
            goalId,
          } as Prisma.InputJsonValue,
        },
      });

      return outcome.id;
    });

    const created = await this.prisma.outcome.findUnique({ where: { id: outcomeId } });
    return {
      id: created!.id,
      goalId: created!.goalId,
      code: created!.code ?? undefined,
      title: created!.title,
      description: created!.description ?? undefined,
    };
  }

  async createOutput(outcomeId: string, dto: CreateOutputDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create outputs");
    }

    const outcome = await this.prisma.outcome.findUnique({ where: { id: outcomeId } });

    if (!outcome || outcome.deletedAt) {
      throw new NotFoundException("Outcome not found");
    }

    const goal = await this.prisma.goal.findUnique({ where: { id: outcome.goalId } });
    const logframe = await this.prisma.logframe.findUnique({ where: { id: goal!.logframeId } });
    const project = await this.prisma.project.findUnique({
      where: { id: logframe!.projectId },
      select: { organizationId: true },
    });

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project?.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only create outputs in your own organization");
    }

    const outputId = await this.prisma.$transaction(async (tx) => {
      const output = await tx.output.create({
        data: {
          outcomeId,
          code: dto.code,
          title: dto.title,
          description: dto.description,
          createdById: user.id,
        } as Prisma.OutputUncheckedCreateInput,
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          organizationId: project!.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.OUTPUT_CREATED,
          resource: "output",
          resourceId: output.id,
          changes: {
            title: dto.title,
            code: dto.code,
            outcomeId,
          } as Prisma.InputJsonValue,
        },
      });

      return output.id;
    });

    const created = await this.prisma.output.findUnique({ where: { id: outputId } });
    return {
      id: created!.id,
      outcomeId: created!.outcomeId,
      code: created!.code ?? undefined,
      title: created!.title,
      description: created!.description ?? undefined,
    };
  }

  async createAssumption(dto: CreateAssumptionDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create assumptions");
    }

    await this.validateReferenceExists(dto.level, dto.referenceId);

    const orgId = await this.resolveOrgIdFromResultLevel(dto.level, dto.referenceId);

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && orgId !== user.organizationId) {
      throw new ForbiddenException("You can only create assumptions in your own organization");
    }

    const assumption = await this.prisma.$transaction(async (tx) => {
      const created = await tx.assumption.create({
        data: {
          level: dto.level,
          referenceId: dto.referenceId,
          description: dto.description,
          mitigation: dto.mitigation,
          createdById: user.id,
        } as Prisma.AssumptionUncheckedCreateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          action: AUDIT_ACTION.ASSUMPTION_CREATED,
          resource: "assumption",
          resourceId: created.id,
          changes: {
            level: dto.level,
            referenceId: dto.referenceId,
            description: dto.description,
          } as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return {
      id: assumption.id,
      level: assumption.level,
      referenceId: assumption.referenceId,
      description: assumption.description,
      mitigation: assumption.mitigation ?? undefined,
    };
  }

  async createRisk(dto: CreateRiskDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "indicator" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create risks");
    }

    await this.validateReferenceExists(dto.level, dto.referenceId);

    const orgId = await this.resolveOrgIdFromResultLevel(dto.level, dto.referenceId);

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && orgId !== user.organizationId) {
      throw new ForbiddenException("You can only create risks in your own organization");
    }

    const risk = await this.prisma.$transaction(async (tx) => {
      const created = await tx.risk.create({
        data: {
          level: dto.level,
          referenceId: dto.referenceId,
          description: dto.description,
          probability: dto.probability,
          impact: dto.impact,
          mitigation: dto.mitigation,
          createdById: user.id,
        } as Prisma.RiskUncheckedCreateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          action: AUDIT_ACTION.RISK_CREATED,
          resource: "risk",
          resourceId: created.id,
          changes: {
            level: dto.level,
            referenceId: dto.referenceId,
            description: dto.description,
          } as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return {
      id: risk.id,
      level: risk.level,
      referenceId: risk.referenceId,
      description: risk.description,
      probability: risk.probability ?? undefined,
      impact: risk.impact ?? undefined,
      mitigation: risk.mitigation ?? undefined,
    };
  }

  private async validateReferenceExists(level: string, referenceId: string) {
    let record: unknown = null;
    switch (level) {
      case "GOAL":
        record = await this.prisma.goal.findUnique({ where: { id: referenceId } });
        break;
      case "OUTCOME":
        record = await this.prisma.outcome.findUnique({ where: { id: referenceId } });
        break;
      case "OUTPUT":
        record = await this.prisma.output.findUnique({ where: { id: referenceId } });
        break;
    }
    if (!record) {
      throw new BadRequestException(`Referenced ${level.toLowerCase()} not found`);
    }
  }

  private async resolveOrgIdFromResultLevel(level: string, referenceId: string): Promise<string> {
    switch (level) {
      case "GOAL": {
        const g = await this.prisma.goal.findUnique({ where: { id: referenceId }, include: { logframe: { include: { project: true } } } });
        return g!.logframe.project.organizationId;
      }
      case "OUTCOME": {
        const o = await this.prisma.outcome.findUnique({ where: { id: referenceId }, include: { goal: { include: { logframe: { include: { project: true } } } } } });
        return o!.goal.logframe.project.organizationId;
      }
      case "OUTPUT": {
        const o = await this.prisma.output.findUnique({ where: { id: referenceId }, include: { outcome: { include: { goal: { include: { logframe: { include: { project: true } } } } } } } });
        return o!.outcome.goal.logframe.project.organizationId;
      }
      default:
        throw new BadRequestException("Invalid result level");
    }
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

  private async fetchLogframeById(id: string) {
    const logframe = await this.prisma.logframe.findUnique({
      where: { id },
      include: {
        goals: {
          where: { deletedAt: null },
          include: {
            outcomes: {
              where: { deletedAt: null },
              include: {
                outputs: { where: { deletedAt: null } },
              },
            },
          },
        },
      },
    });
    return logframe;
  }

  private formatLogframeResponse(logframe: {
    id: string;
    projectId: string;
    title: string;
    version: number;
    status: LogframeStatus;
    description: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    goals: {
      id: string;
      title: string;
      description: string | null;
      outcomes: {
        id: string;
        code: string | null;
        title: string;
        description: string | null;
        outputs: { id: string; code: string | null; title: string; description: string | null }[];
      }[];
    }[];
  }) {
    return {
      id: logframe.id,
      projectId: logframe.projectId,
      title: logframe.title,
      version: logframe.version,
      status: logframe.status,
      description: logframe.description ?? undefined,
      approvedBy: logframe.approvedBy ?? undefined,
      approvedAt: logframe.approvedAt ?? undefined,
      goals: logframe.goals.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description ?? undefined,
        outcomes: g.outcomes.map((o) => ({
          id: o.id,
          code: o.code ?? undefined,
          title: o.title,
          description: o.description ?? undefined,
          outputs: o.outputs.map((op) => ({
            id: op.id,
            code: op.code ?? undefined,
            title: op.title,
            description: op.description ?? undefined,
          })),
        })),
      })),
      createdAt: logframe.createdAt,
      updatedAt: logframe.updatedAt,
    };
  }
}
