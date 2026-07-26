import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { QueryOrganizationDto } from "./dto/query-organization.dto";
import { AUDIT_ACTION } from "../../core/constants";
import { Prisma, Status } from "@prisma/client";
import type { AuthenticatedUser } from "../../core/auth/strategies/jwt.strategy";

@Injectable()
export class OrganizationsService {

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto, user: AuthenticatedUser) {
    const hasCreate = user.permissions.some(
      (p) => p.resource === "organization" && p.action === "create",
    );
    if (!hasCreate) {
      throw new ForbiddenException("You do not have permission to create organizations");
    }

    const existingName = await this.prisma.organization.findFirst({
      where: { name: dto.name, deletedAt: null },
    });
    if (existingName) {
      throw new ConflictException("An organization with this name already exists");
    }

    if (dto.email) {
      const existingEmail = await this.prisma.organization.findFirst({
        where: { email: dto.email, deletedAt: null },
      });
      if (existingEmail) {
        throw new ConflictException("An organization with this email already exists");
      }
    }

    const slug = await this.generateUniqueSlug(dto.name);
    const code = this.generateCode();

    const status = dto.isActive === false ? Status.INACTIVE : Status.ACTIVE;

    const org = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.name,
          slug,
          code,
          shortName: dto.shortName,
          registrationNumber: dto.registrationNumber,
          organizationType: dto.organizationType,
          email: dto.email,
          phone: dto.phone,
          website: dto.website,
          country: dto.country,
          district: dto.district,
          city: dto.city,
          address: dto.address,
          logo: dto.logo,
          description: dto.description,
          status,
          createdBy: { connect: { id: user.id } },
        },
      });

      await tx.organizationSettings.create({
        data: {
          organizationId: organization.id,
          timezone: dto.timezone ?? "UTC",
          currency: dto.currency ?? "USD",
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: AUDIT_ACTION.ORG_CREATED,
          resource: "organization",
          resourceId: organization.id,
          changes: { name: dto.name, email: dto.email, organizationType: dto.organizationType } as Prisma.InputJsonValue,
        },
      });

      return organization;
    });

    return this.formatResponse(org);
  }

  async findAll(query: QueryOrganizationDto, user: AuthenticatedUser) {
    const { page = 1, limit = 10, search, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {
      deletedAt: null,
    };

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin) {
      where.id = user.organizationId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.OrganizationOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
    ]);

    const enriched = await Promise.all(
      items.map((org) => this.formatResponse(org)),
    );

    return {
      items: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!org || org.deletedAt) {
      throw new NotFoundException("Organization not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && org.id !== user.organizationId) {
      throw new ForbiddenException("You can only view your own organization");
    }

    return { item: await this.formatResponse(org) };
  }

  async update(id: string, dto: UpdateOrganizationDto, user: AuthenticatedUser) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!org || org.deletedAt) {
      throw new NotFoundException("Organization not found");
    }

    const isSuperAdmin = user.roles.some((r) => r.name === "SUPER_ADMIN");
    if (!isSuperAdmin && org.id !== user.organizationId) {
      throw new ForbiddenException("You can only update your own organization");
    }

    const hasUpdate = user.permissions.some(
      (p) => p.resource === "organization" && p.action === "update",
    );
    if (!hasUpdate) {
      throw new ForbiddenException("You do not have permission to update organizations");
    }

    if (dto.name && dto.name !== org.name) {
      const existingName = await this.prisma.organization.findFirst({
        where: { name: dto.name, deletedAt: null, id: { not: id } },
      });
      if (existingName) {
        throw new ConflictException("An organization with this name already exists");
      }
    }

    if (dto.email && dto.email !== org.email) {
      const existingEmail = await this.prisma.organization.findFirst({
        where: { email: dto.email, deletedAt: null, id: { not: id } },
      });
      if (existingEmail) {
        throw new ConflictException("An organization with this email already exists");
      }
    }

    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && value !== (org as unknown as Record<string, unknown>)[key]) {
        changes[key] = value;
      }
    }

    const updateData: Prisma.OrganizationUpdateInput = {
      updatedBy: { connect: { id: user.id } },
    };

    const fields: (keyof typeof dto)[] = [
      "name", "shortName", "registrationNumber", "organizationType",
      "email", "phone", "website", "country", "district", "city",
      "address", "logo", "description",
    ];
    for (const field of fields) {
      if (dto[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = dto[field];
      }
    }

    if (dto.isActive !== undefined) {
      updateData.status = dto.isActive ? Status.ACTIVE : Status.INACTIVE;
      changes.status = updateData.status;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.organization.update({
        where: { id },
        data: updateData,
      });

      if (dto.timezone !== undefined || dto.currency !== undefined) {
        const settingsUpdate: Prisma.OrganizationSettingsUpdateInput = {};
        if (dto.timezone !== undefined) settingsUpdate.timezone = dto.timezone;
        if (dto.currency !== undefined) settingsUpdate.currency = dto.currency;

        await tx.organizationSettings.update({
          where: { organizationId: id },
          data: settingsUpdate,
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: id,
          userId: user.id,
          action: AUDIT_ACTION.ORG_UPDATED,
          resource: "organization",
          resourceId: id,
          changes: changes as Prisma.InputJsonValue,
        },
      });

      return result;
    });

    return this.formatResponse(updated);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const hasDelete = user.permissions.some(
      (p) => p.resource === "organization" && p.action === "delete",
    );
    if (!hasDelete) {
      throw new ForbiddenException("You do not have permission to delete organizations");
    }

    const org = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!org || org.deletedAt) {
      throw new NotFoundException("Organization not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: Status.DELETED,
          updatedBy: { connect: { id: user.id } },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: id,
          userId: user.id,
          action: AUDIT_ACTION.ORG_DELETED,
          resource: "organization",
          resourceId: id,
          changes: { name: org.name, deletedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) slug = "org";

    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    return slug;
  }

  private generateCode(): string {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORG-${rand}`;
  }

  private async formatResponse(org: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
    code: string;
    registrationNumber: string | null;
    organizationType: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    country: string | null;
    district: string | null;
    city: string | null;
    address: string | null;
    logo: string | null;
    description: string | null;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const settings = await this.prisma.organizationSettings.findUnique({
      where: { organizationId: org.id },
    });

    return {
      id: org.id,
      name: org.name,
      shortName: org.shortName ?? undefined,
      slug: org.slug,
      code: org.code,
      registrationNumber: org.registrationNumber ?? undefined,
      organizationType: org.organizationType ?? undefined,
      email: org.email ?? undefined,
      phone: org.phone ?? undefined,
      website: org.website ?? undefined,
      country: org.country ?? undefined,
      district: org.district ?? undefined,
      city: org.city ?? undefined,
      address: org.address ?? undefined,
      logo: org.logo ?? undefined,
      description: org.description ?? undefined,
      timezone: settings?.timezone ?? "UTC",
      currency: settings?.currency ?? "USD",
      isActive: org.status === Status.ACTIVE,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }
}
