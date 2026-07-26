import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../prisma/prisma.service";
import { Status } from "@prisma/client";
import type { JwtPayload } from "../interfaces/jwt-payload.interface";

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    code: string;
    subscriptionPlan: string;
  };
  roles: { id: string; name: string }[];
  permissions: { resource: string; action: string }[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.getOrThrow<string>("jwt.secret");

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        organization: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.status !== Status.ACTIVE) {
      throw new UnauthorizedException("Account is not active");
    }

    if (user.deletedAt) {
      throw new UnauthorizedException("Account has been deleted");
    }

    const roles = user.userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
    }));

    const permissionSet = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(`${rp.permission.resource}:${rp.permission.action}`);
      }
    }

    const permissions = Array.from(permissionSet).map((key) => {
      const [resource, action] = key.split(":");
      return { resource, action };
    });

    return {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      organization: user.organization,
      roles,
      permissions,
    };
  }
}
