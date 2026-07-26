import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { QueryRoleDto } from "./dto/query-role.dto";
import { AssignPermissionsDto } from "./dto/assign-permissions.dto";
import { AUDIT_ACTION } from "../../core/constants";
import { Prisma } from "@prisma/client";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "role" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create roles");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && dto.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only create roles in your own organization");
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!org || org.deletedAt) {
      throw new BadRequestException("Organization not found");
    }

    const existing = await this.prisma.role.findFirst({
      where: { name: dto.name, organizationId: dto.organizationId, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException("A role with this name already exists in this organization");
    }

    const roleId = await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: dto.name,
          description: dto.description,
          organizationId: dto.organizationId,
          createdById: user.id,
        } as Prisma.RoleUncheckedCreateInput,
        select: { id: true },
      });

      if (dto.permissionIds && dto.permissionIds.length > 0) {
        const validPermissions = await tx.permission.findMany({
          where: { id: { in: dto.permissionIds }, deletedAt: null },
          select: { id: true },
        });

        if (validPermissions.length !== dto.permissionIds.length) {
          throw new BadRequestException("One or more permission IDs are invalid");
        }

        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: dto.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.ROLE_CREATED,
          resource: "role",
          resourceId: role.id,
          changes: {
            name: dto.name,
            permissionIds: dto.permissionIds,
          } as Prisma.InputJsonValue,
        },
      });

      return role.id;
    });

    const created = await this.fetchById(roleId);
    return this.formatResponse(created!);
  }

  async findAll(query: QueryRoleDto, user: AuthenticatedUser) {
    const { page = 1, limit = 10, search, organizationId, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RoleWhereInput = {
      deletedAt: null,
    };

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin) {
      where.organizationId = user.organizationId;
    } else if (organizationId) {
      where.organizationId = organizationId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.RoleOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      items: items.map((r) => this.formatResponse(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const role = await this.fetchById(id);

    if (!role || role.deletedAt) {
      throw new NotFoundException("Role not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && role.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only view roles in your own organization");
    }

    return { item: this.formatResponse(role) };
  }

  async update(id: string, dto: UpdateRoleDto, user: AuthenticatedUser) {
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role || role.deletedAt) {
      throw new NotFoundException("Role not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && role.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only update roles in your own organization");
    }

    const hasUpdate = user.permissions.some(
      (p) => p.resource === "role" && p.action === "update",
    );
    if (!hasUpdate) {
      throw new ForbiddenException("You do not have permission to update roles");
    }

    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.role.findFirst({
        where: {
          name: dto.name,
          organizationId: role.organizationId,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException("A role with this name already exists in this organization");
      }
    }

    const changes: Record<string, unknown> = {};
    if (dto.name !== undefined && dto.name !== role.name) changes.name = dto.name;
    if (dto.description !== undefined && dto.description !== role.description) changes.description = dto.description;

    const updateData: Prisma.RoleUncheckedUpdateInput = {
      updatedById: user.id,
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;

    if (Object.keys(changes).length > 0 || dto.isActive !== undefined) {
      await this.prisma.$transaction(async (tx) => {
        await tx.role.update({
          where: { id },
          data: updateData,
        });

        await tx.auditLog.create({
          data: {
            organizationId: role.organizationId,
            userId: user.id,
            action: AUDIT_ACTION.ROLE_UPDATED,
            resource: "role",
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
      (p) => p.resource === "role" && p.action === "delete",
    );
    if (!hasDelete) {
      throw new ForbiddenException("You do not have permission to delete roles");
    }

    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role || role.deletedAt) {
      throw new NotFoundException("Role not found");
    }

    if (role.isSystem) {
      throw new ForbiddenException("System roles cannot be deleted");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && role.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only delete roles in your own organization");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedById: user.id,
        } as Prisma.RoleUncheckedUpdateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: role.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.ROLE_DELETED,
          resource: "role",
          resourceId: id,
          changes: {
            name: role.name,
            deletedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto, user: AuthenticatedUser) {
    const hasAssign = user.permissions.some(
      (p) => p.resource === "permission" && p.action === "assign",
    );
    if (!hasAssign) {
      throw new ForbiddenException("You do not have permission to assign permissions");
    }

    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role || role.deletedAt) {
      throw new NotFoundException("Role not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && role.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only manage permissions for roles in your own organization");
    }

    const validPermissions = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissionIds }, deletedAt: null },
      select: { id: true },
    });

    if (validPermissions.length !== dto.permissionIds.length) {
      throw new BadRequestException("One or more permission IDs are invalid");
    }

    const previousPermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: id },
      include: { permission: { select: { resource: true, action: true } } },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });

      if (dto.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }

      const previousPerms = previousPermissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}`,
      );

      const newPermissions = await tx.permission.findMany({
        where: { id: { in: dto.permissionIds } },
        select: { resource: true, action: true },
      });
      const newPermStrings = newPermissions.map(
        (p) => `${p.resource}:${p.action}`,
      );

      await tx.auditLog.create({
        data: {
          organizationId: role.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.PERMISSION_ASSIGNED,
          resource: "role",
          resourceId: id,
          changes: {
            previousPermissions: previousPerms,
            newPermissions: newPermStrings,
          } as Prisma.InputJsonValue,
        },
      });
    });

    const updated = await this.fetchById(id);
    return this.formatResponse(updated!);
  }

  async getPermissions(id: string, user: AuthenticatedUser) {
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role || role.deletedAt) {
      throw new NotFoundException("Role not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && role.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only view roles in your own organization");
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: id },
      include: { permission: true },
    });

    return {
      items: rolePermissions.map((rp) => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description ?? undefined,
        isSystem: rp.permission.isSystem,
      })),
    };
  }

  private async fetchById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
    return role;
  }

  private formatResponse(role: {
    id: string;
    name: string;
    description: string | null;
    organizationId: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    rolePermissions: {
      permission: { id: string; resource: string; action: string; description: string | null };
    }[];
  }) {
    return {
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      organizationId: role.organizationId,
      isSystem: role.isSystem,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description ?? undefined,
      })),
      isActive: !role.deletedAt,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
