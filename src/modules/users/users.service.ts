import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../core/database/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangeUserStatusDto } from "./dto/change-user-status.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { AUDIT_ACTION } from "../../core/constants";
import { Prisma, Status } from "@prisma/client";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "user" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create users");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && dto.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only create users in your own organization");
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!org || org.deletedAt) {
      throw new BadRequestException("Organization not found");
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException("A user with this email already exists");
    }

    if (dto.employeeId) {
      const existingEmployeeId = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId },
      });
      if (existingEmployeeId) {
        throw new ConflictException("A user with this employee ID already exists");
      }
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role || role.deletedAt) {
      throw new BadRequestException("Role not found");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const status = dto.isActive === false ? Status.INACTIVE : Status.ACTIVE;

    const userId = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          organizationId: dto.organizationId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          gender: dto.gender,
          jobTitle: dto.jobTitle,
          employeeId: dto.employeeId,
          avatar: dto.profilePhoto,
          passwordHash,
          status,
          createdById: user.id,
        } as Prisma.UserUncheckedCreateInput,
        select: { id: true },
      });

      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: dto.roleId,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: dto.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.USER_CREATED,
          resource: "user",
          resourceId: newUser.id,
          changes: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            roleId: dto.roleId,
          } as Prisma.InputJsonValue,
        },
      });

      return newUser.id;
    });

    const created = await this.fetchById(userId);
    return this.formatResponse(created!);
  }

  async findAll(query: QueryUserDto, user: AuthenticatedUser) {
    const {
      page = 1,
      limit = 10,
      search,
      organizationId,
      roleId,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin) {
      where.organizationId = user.organizationId;
    } else if (organizationId) {
      where.organizationId = organizationId;
    }

    if (isActive !== undefined) {
      where.status = isActive ? Status.ACTIVE : Status.INACTIVE;
    }

    if (roleId) {
      where.userRoles = { some: { roleId } };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          organization: { select: { id: true, name: true } },
          userRoles: { include: { role: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => this.formatResponse(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        userRoles: { include: { role: { select: { id: true, name: true } } } },
      },
    });

    if (!record || record.deletedAt) {
      throw new NotFoundException("User not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    const isOwnProfile = user.id === id;

    if (!isSuperAdmin && !isOwnProfile && record.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only view users in your own organization");
    }

    return { item: this.formatResponse(record) };
  }

  async update(id: string, dto: UpdateUserDto, user: AuthenticatedUser) {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        userRoles: { include: { role: { select: { id: true, name: true } } } },
      },
    });

    if (!record || record.deletedAt) {
      throw new NotFoundException("User not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && record.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only update users in your own organization");
    }

    const hasUpdate = user.permissions.some(
      (p) => p.resource === "user" && p.action === "update",
    );
    if (!hasUpdate) {
      throw new ForbiddenException("You do not have permission to update users");
    }

    if (dto.email && dto.email !== record.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException("A user with this email already exists");
      }
    }

    if (dto.employeeId && dto.employeeId !== record.employeeId) {
      const existingEmployeeId = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId },
      });
      if (existingEmployeeId) {
        throw new ConflictException("A user with this employee ID already exists");
      }
    }

    if (dto.roleId && !record.userRoles.some((ur) => ur.role.id === dto.roleId)) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role || role.deletedAt) {
        throw new BadRequestException("Role not found");
      }
    }

    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && value !== (record as unknown as Record<string, unknown>)[key]) {
        changes[key] = value;
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.UserUncheckedUpdateInput = {
        updatedById: user.id,
      };

      const fields: (keyof UpdateUserDto)[] = [
        "firstName", "lastName", "email", "gender",
        "phone", "jobTitle", "employeeId",
      ];
      for (const field of fields) {
        if (dto[field] !== undefined) {
          (updateData as Record<string, unknown>)[field] = dto[field];
        }
      }

      if (dto.profilePhoto !== undefined) {
        updateData.avatar = dto.profilePhoto;
        changes.profilePhoto = dto.profilePhoto;
      }

      if (dto.isActive !== undefined) {
        updateData.status = dto.isActive ? Status.ACTIVE : Status.INACTIVE;
        changes.isActive = dto.isActive;
      }

      if (dto.roleId !== undefined) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({ data: { userId: id, roleId: dto.roleId } });
        changes.roleId = dto.roleId;
      }

      await tx.user.update({
        where: { id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          organizationId: record.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.USER_UPDATED,
          resource: "user",
          resourceId: id,
          changes: changes as Prisma.InputJsonValue,
        },
      });
    });

    const updated = await this.fetchById(id);
    return this.formatResponse(updated!);
  }

  async changeStatus(id: string, dto: ChangeUserStatusDto, user: AuthenticatedUser) {
    const record = await this.prisma.user.findUnique({ where: { id } });

    if (!record || record.deletedAt) {
      throw new NotFoundException("User not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && record.organizationId !== user.organizationId) {
      throw new ForbiddenException("You can only change status of users in your own organization");
    }

    const hasUpdate = user.permissions.some(
      (p) => p.resource === "user" && p.action === "update",
    );
    if (!hasUpdate) {
      throw new ForbiddenException("You do not have permission to update users");
    }

    const newStatus = dto.isActive ? Status.ACTIVE : Status.INACTIVE;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          status: newStatus,
          updatedById: user.id,
        } as Prisma.UserUncheckedUpdateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: record.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.USER_STATUS_CHANGED,
          resource: "user",
          resourceId: id,
          changes: {
            previousStatus: record.status,
            newStatus,
          } as Prisma.InputJsonValue,
        },
      });
    });

    const updated = await this.fetchById(id);
    return this.formatResponse(updated!);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const hasDelete = user.permissions.some(
      (p) => p.resource === "user" && p.action === "delete",
    );
    if (!hasDelete) {
      throw new ForbiddenException("You do not have permission to delete users");
    }

    const record = await this.prisma.user.findUnique({ where: { id } });

    if (!record || record.deletedAt) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: Status.DELETED,
          updatedById: user.id,
        } as Prisma.UserUncheckedUpdateInput,
      });

      await tx.auditLog.create({
        data: {
          organizationId: record.organizationId,
          userId: user.id,
          action: AUDIT_ACTION.USER_DELETED,
          resource: "user",
          resourceId: id,
          changes: {
            email: record.email,
            deletedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  private async fetchById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        userRoles: { include: { role: { select: { id: true, name: true } } } },
      },
    });
    return user;
  }

  private formatResponse(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    gender: string | null;
    jobTitle: string | null;
    employeeId: string | null;
    avatar: string | null;
    status: Status;
    emailVerified: boolean;
    phoneVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    organization: { id: string; name: string };
    userRoles: { role: { id: string; name: string } }[];
  }) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? undefined,
      gender: user.gender ?? undefined,
      jobTitle: user.jobTitle ?? undefined,
      employeeId: user.employeeId ?? undefined,
      profilePhoto: user.avatar ?? undefined,
      organization: user.organization,
      roles: user.userRoles.map((ur) => ur.role),
      isActive: user.status === Status.ACTIVE,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      lastLogin: user.lastLogin ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
