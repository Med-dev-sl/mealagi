import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { AssignTeamDto } from "./dto/assign-team.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { QueryProjectDto } from "./dto/query-project.dto";
import { AUDIT_ACTION } from "../../core/constants";
import { Prisma, ProjectStatus } from "@prisma/client";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "project" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create projects");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && dto.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only create projects in your own organization");
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!org || org.deletedAt) {
      throw new BadRequestException("Organization not found");
    }

    const existingCode = await this.prisma.project.findUnique({
      where: { projectCode: dto.projectCode },
    });
    if (existingCode) {
      throw new ConflictException("A project with this code already exists");
    }

    const existingName = await this.prisma.project.findFirst({
      where: {
        projectName: dto.projectName,
        organizationId: dto.organizationId,
        deletedAt: null,
      },
    });
    if (existingName) {
      throw new ConflictException("A project with this name already exists in this organization");
    }

    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException("End date must be after start date");
    }

    if (dto.projectManagerId) {
      const pm = await this.prisma.user.findUnique({
        where: { id: dto.projectManagerId },
      });
      if (!pm || pm.deletedAt) {
        throw new BadRequestException("Project manager not found");
      }
    }

    const projectId = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          projectCode: dto.projectCode,
          projectName: dto.projectName,
          shortName: dto.shortName,
          donor: dto.donor,
          implementingPartner: dto.implementingPartner,
          fundingSource: dto.fundingSource,
          budget: dto.budget ?? 0,
          currency: dto.currency ?? "USD",
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          projectManagerId: dto.projectManagerId,
          organizationId: dto.organizationId,
          district: dto.district,
          chiefdom: dto.chiefdom,
          community: dto.community,
          sector: dto.sector,
          description: dto.description,
          objectives: dto.objectives,
          expectedOutcomes: dto.expectedOutcomes,
          targetBeneficiaries: dto.targetBeneficiaries,
          createdById: user.id,
        } as Prisma.ProjectUncheckedCreateInput,
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          organizationId: dto.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.PROJECT_CREATED,
          resource: "project",
          resourceId: project.id,
          changes: {
            projectCode: dto.projectCode,
            projectName: dto.projectName,
          } as Prisma.InputJsonValue,
        },
      });

      return project.id;
    });

    const created = await this.fetchById(projectId);
    return this.formatResponse(created!);
  }

  async findAll(query: QueryProjectDto, user: AuthenticatedUser) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      donor,
      district,
      sector,
      organizationId,
      projectManagerId,
      startDateFrom,
      startDateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
    };

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    const isOrgAdmin = user.roles.some((r) => r.name === "ORGANIZATION_ADMIN");
    const isProjectManager = user.roles.some((r) => r.name === "PROJECT_MANAGER");
    const isFieldOfficer = user.roles.some((r) => r.name === "FIELD_OFFICER");

    if (!isSuperAdmin) {
      if (isOrgAdmin) {
        where.organizationId = user.organizationId;
      } else if (isProjectManager || isFieldOfficer) {
        where.OR = [
          { organizationId: user.organizationId, projectManagerId: user.id },
          { organizationId: user.organizationId, teamMembers: { some: { userId: user.id } } },
        ];
      } else if (organizationId) {
        where.organizationId = organizationId;
      } else {
        where.organizationId = user.organizationId;
      }
    } else if (organizationId) {
      where.organizationId = organizationId;
    }

    if (status) {
      where.status = status;
    }

    if (donor) {
      where.donor = { contains: donor, mode: "insensitive" };
    }

    if (district) {
      where.district = { contains: district, mode: "insensitive" };
    }

    if (sector) {
      where.sector = { contains: sector, mode: "insensitive" };
    }

    if (projectManagerId) {
      where.projectManagerId = projectManagerId;
    }

    if (startDateFrom) {
      where.startDate = { ...(where.startDate as object || {}), gte: new Date(startDateFrom) };
    }

    if (startDateTo) {
      where.endDate = { ...(where.endDate as object || {}), lte: new Date(startDateTo) };
    }

    if (search) {
      const searchOr: Prisma.ProjectWhereInput[] = [
        { projectCode: { contains: search, mode: "insensitive" } },
        { projectName: { contains: search, mode: "insensitive" } },
        { donor: { contains: search, mode: "insensitive" } },
        { community: { contains: search, mode: "insensitive" } },
      ];

      if (where.OR) {
        where.AND = [{ OR: searchOr }];
      } else {
        where.OR = searchOr;
      }
    }

    const orderBy: Prisma.ProjectOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          teamMembers: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items.map((p) => this.formatResponse(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const project = await this.fetchById(id);

    if (!project || project.deletedAt) {
      throw new NotFoundException("Project not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    const isOrgAdmin = user.roles.some((r) => r.name === "ORGANIZATION_ADMIN");

    if (!isSuperAdmin) {
      const sameOrg = project.organizationId === user.organizationId;
      const isManager = project.projectManagerId === user.id;
      const isTeamMember = project.teamMembers.some((tm) => tm.userId === user.id);

      if (!sameOrg) {
        throw new ForbiddenException("You can only view projects in your own organization");
      }

      if (!isOrgAdmin && !isManager && !isTeamMember) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    return { item: this.formatResponse(project) };
  }

  async update(id: string, dto: UpdateProjectDto, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project || project.deletedAt) {
      throw new NotFoundException("Project not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    const isOrgAdmin = user.roles.some((r) => r.name === "ORGANIZATION_ADMIN");
    const isProjectManager = project.projectManagerId === user.id;

    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only update projects in your own organization");
    }

    const hasUpdate = user.permissions.some(
      (p) => p.resource === "project" && p.action === "update",
    );
    if (!hasUpdate) {
      throw new ForbiddenException("You do not have permission to update projects");
    }

    if (!isSuperAdmin && !isOrgAdmin && !isProjectManager) {
      throw new ForbiddenException("Only the project manager or org admin can update this project");
    }

    if (dto.projectName && dto.projectName !== project.projectName) {
      const existingName = await this.prisma.project.findFirst({
        where: {
          projectName: dto.projectName,
          organizationId: project.organizationId,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existingName) {
        throw new ConflictException("A project with this name already exists in this organization");
      }
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : project.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : project.endDate;
    if (endDate <= startDate) {
      throw new BadRequestException("End date must be after start date");
    }

    if (dto.budget !== undefined && dto.budget < 0) {
      throw new BadRequestException("Budget cannot be negative");
    }

    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        const projectKey = key as keyof typeof project;
        if (String(value) !== String(project[projectKey])) {
          changes[key] = value;
        }
      }
    }

    const updateData: Prisma.ProjectUncheckedUpdateInput = {
      updatedById: user.id,
    };

    const fields: (keyof UpdateProjectDto)[] = [
      "projectName", "shortName", "donor", "implementingPartner", "fundingSource",
      "budget", "currency", "district", "chiefdom", "community", "sector",
      "description", "objectives", "expectedOutcomes", "targetBeneficiaries",
    ];
    for (const field of fields) {
      if (dto[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = dto[field];
      }
    }

    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);

    if (Object.keys(changes).length > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.project.update({
          where: { id },
          data: updateData,
        });

        await tx.auditLog.create({
          data: {
            organizationId: project.organizationId,
            userId: user.id,
            action: AUDIT_ACTION.PROJECT_UPDATED,
            resource: "project",
            resourceId: id,
            changes: changes as Prisma.InputJsonValue,
          },
        });
      });
    }

    const updated = await this.fetchById(id);
    return this.formatResponse(updated!);
  }

  async updateStatus(id: string, dto: UpdateStatusDto, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project || project.deletedAt) {
      throw new NotFoundException("Project not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    const isOrgAdmin = user.roles.some((r) => r.name === "ORGANIZATION_ADMIN");
    const isProjectManager = project.projectManagerId === user.id;

    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only update projects in your own organization");
    }

    const hasUpdate = user.permissions.some(
      (p) => p.resource === "project" && p.action === "update",
    );
    if (!hasUpdate) {
      throw new ForbiddenException("You do not have permission to update projects");
    }

    if (!isSuperAdmin && !isOrgAdmin && !isProjectManager) {
      throw new ForbiddenException("Only the project manager or org admin can change project status");
    }

    const auditAction =
      dto.status === ProjectStatus.ARCHIVED
        ? AUDIT_ACTION.PROJECT_ARCHIVED
        : AUDIT_ACTION.PROJECT_STATUS_CHANGED;

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          status: dto.status,
          updatedById: user.id,
        } as Prisma.ProjectUncheckedUpdateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: user.id,
          action: auditAction,
          resource: "project",
          resourceId: id,
          changes: {
            previousStatus: project.status,
            newStatus: dto.status,
          } as Prisma.InputJsonValue,
        },
      });
    });

    const updated = await this.fetchById(id);
    return this.formatResponse(updated!);
  }

  async assignTeam(id: string, dto: AssignTeamDto, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project || project.deletedAt) {
      throw new NotFoundException("Project not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    const isOrgAdmin = user.roles.some((r) => r.name === "ORGANIZATION_ADMIN");
    const isProjectManager = project.projectManagerId === user.id;

    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only manage teams in your own organization");
    }

    const hasUpdate = user.permissions.some(
      (p) => p.resource === "project" && p.action === "update",
    );
    if (!hasUpdate) {
      throw new ForbiddenException("You do not have permission to update projects");
    }

    if (!isSuperAdmin && !isOrgAdmin && !isProjectManager) {
      throw new ForbiddenException("Only the project manager or org admin can assign team members");
    }

    const validUsers = await this.prisma.user.findMany({
      where: {
        id: { in: dto.userIds },
        organizationId: project.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (validUsers.length !== dto.userIds.length) {
      throw new BadRequestException("One or more user IDs are invalid or not in your organization");
    }

    const previousTeam = await this.prisma.projectTeam.findMany({
      where: { projectId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.projectTeam.deleteMany({ where: { projectId: id } });

      if (dto.userIds.length > 0) {
        await tx.projectTeam.createMany({
          data: dto.userIds.map((userId) => ({
            projectId: id,
            userId,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.PROJECT_TEAM_ASSIGNED,
          resource: "project",
          resourceId: id,
          changes: {
            previousTeam: previousTeam.map((t) => ({
              id: t.user.id,
              name: `${t.user.firstName} ${t.user.lastName}`,
            })),
            newUserIds: dto.userIds,
          } as Prisma.InputJsonValue,
        },
      });
    });

    const updated = await this.fetchById(id);
    return this.formatResponse(updated!);
  }

  async getTeam(id: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project || project.deletedAt) {
      throw new NotFoundException("Project not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only view teams in your own organization");
    }

    const teamMembers = await this.prisma.projectTeam.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            avatar: true,
          },
        },
      },
    });

    return {
      items: teamMembers.map((tm) => ({
        id: tm.user.id,
        firstName: tm.user.firstName,
        lastName: tm.user.lastName,
        email: tm.user.email,
        jobTitle: tm.user.jobTitle ?? undefined,
        avatar: tm.user.avatar ?? undefined,
      })),
    };
  }

  async remove(id: string, user: AuthenticatedUser) {
    const hasDelete = user.permissions.some(
      (p) => p.resource === "project" && p.action === "delete",
    );
    if (!hasDelete) {
      throw new ForbiddenException("You do not have permission to delete projects");
    }

    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project || project.deletedAt) {
      throw new NotFoundException("Project not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && project.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only delete projects in your own organization");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: ProjectStatus.ARCHIVED,
          updatedById: user.id,
        } as Prisma.ProjectUncheckedUpdateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.PROJECT_DELETED,
          resource: "project",
          resourceId: id,
          changes: {
            projectName: project.projectName,
            projectCode: project.projectCode,
            deletedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  private async fetchById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        teamMembers: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
    return project;
  }

  private formatResponse(project: {
    id: string;
    projectCode: string;
    projectName: string;
    shortName: string | null;
    donor: string | null;
    implementingPartner: string | null;
    fundingSource: string | null;
    budget: Prisma.Decimal;
    currency: string;
    startDate: Date;
    endDate: Date;
    projectManagerId: string | null;
    organizationId: string;
    district: string | null;
    chiefdom: string | null;
    community: string | null;
    sector: string | null;
    status: ProjectStatus;
    description: string | null;
    objectives: string | null;
    expectedOutcomes: string | null;
    targetBeneficiaries: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    teamMembers: {
      user: { id: string; firstName: string; lastName: string; email: string };
    }[];
  }) {
    return {
      id: project.id,
      projectCode: project.projectCode,
      projectName: project.projectName,
      shortName: project.shortName ?? undefined,
      donor: project.donor ?? undefined,
      implementingPartner: project.implementingPartner ?? undefined,
      fundingSource: project.fundingSource ?? undefined,
      budget: Number(project.budget),
      currency: project.currency,
      startDate: project.startDate,
      endDate: project.endDate,
      projectManagerId: project.projectManagerId ?? undefined,
      organizationId: project.organizationId,
      district: project.district ?? undefined,
      chiefdom: project.chiefdom ?? undefined,
      community: project.community ?? undefined,
      sector: project.sector ?? undefined,
      status: project.status,
      description: project.description ?? undefined,
      objectives: project.objectives ?? undefined,
      expectedOutcomes: project.expectedOutcomes ?? undefined,
      targetBeneficiaries: project.targetBeneficiaries ?? undefined,
      teamMembers: project.teamMembers.map((tm) => ({
        id: tm.user.id,
        firstName: tm.user.firstName,
        lastName: tm.user.lastName,
        email: tm.user.email,
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
