import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../database/prisma.service";
import { AUDIT_ACTION } from "../constants/audit-actions";
import { Status, AuditSeverity } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "node:crypto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import type { JwtPayload } from "./interfaces/jwt-payload.interface";

interface PermissionEntry {
  resource: string;
  action: string;
}

interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshExpiresInMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshExpiresInMs = 7 * 24 * 60 * 60 * 1000;
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organization: true },
    });

    if (!user) {
      await this.logFailed(dto.email, null, ipAddress, userAgent);
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.deletedAt) {
      await this.logFailed(dto.email, user.organizationId, ipAddress, userAgent);
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.status !== Status.ACTIVE) {
      await this.logFailed(dto.email, user.organizationId, ipAddress, userAgent);
      throw new ForbiddenException("Account is not active");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.logFailed(dto.email, user.organizationId, ipAddress, userAgent);
      throw new UnauthorizedException("Invalid email or password");
    }

    const org = user.organization;
    if (org.status !== Status.ACTIVE || org.deletedAt) {
      await this.logFailed(dto.email, user.organizationId, ipAddress, userAgent);
      throw new ForbiddenException("Organization is not active");
    }

    const roles = await this.loadRoles(user.id);
    const permissions = this.extractPermissions(roles);
    const { accessToken, refreshToken } = await this.createSession(
      user.id,
      user.organizationId,
      ipAddress,
      userAgent,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const expiresIn = this.parseExpiresIn(
      this.configService.get<string>("jwt.expiresIn", "15m"),
    );

    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: AUDIT_ACTION.LOGIN,
        resource: "auth",
        severity: AuditSeverity.INFO,
        metadata: { email: user.email },
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        code: org.code,
        subscriptionPlan: org.subscriptionPlan,
      },
      roles: roles.map((r) => ({ id: r.id, name: r.name })),
      permissions,
    };
  }

  async refresh(dto: RefreshTokenDto, ipAddress?: string, userAgent?: string) {
    let payload: RefreshTokenPayload;
    try {
      const secret = this.configService.getOrThrow<string>("jwt.refreshSecret");
      payload = this.jwtService.verify<RefreshTokenPayload>(dto.refreshToken, {
        secret,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      throw new UnauthorizedException("Session not found");
    }

    if (session.isRevoked || session.revokedAt) {
      throw new UnauthorizedException("Session has been revoked");
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token has expired");
    }

    if (!session.refreshTokenHash) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokenMatches = await bcrypt.compare(
      dto.refreshToken,
      session.refreshTokenHash,
    );
    if (!tokenMatches) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: { organization: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException("User not found");
    }

    if (user.status !== Status.ACTIVE) {
      throw new ForbiddenException("Account is not active");
    }

    const org = user.organization;
    if (org.status !== Status.ACTIVE || org.deletedAt) {
      throw new ForbiddenException("Organization is not active");
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, organizationId: user.organizationId } as unknown as Record<string, unknown>,
      {
        expiresIn: this.configService.get<string>("jwt.expiresIn", "15m") as never,
      },
    );

    const rawRefreshToken = this.jwtService.sign(
      { sub: user.id, sessionId: session.id } as unknown as Record<string, unknown>,
      {
        secret: this.configService.getOrThrow<string>("jwt.refreshSecret"),
        expiresIn: this.configService.get<string>("jwt.refreshExpiresIn", "7d") as never,
      },
    );

    const refreshTokenHash = await bcrypt.hash(rawRefreshToken, 10);
    const tokenHash = this.hashSha256(accessToken);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        tokenHash,
        refreshTokenHash,
        ipAddress: ipAddress ?? session.ipAddress,
        userAgent: userAgent ?? session.userAgent,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: AUDIT_ACTION.TOKEN_REFRESHED,
        resource: "auth",
        severity: AuditSeverity.INFO,
        metadata: { sessionId: session.id },
        ipAddress,
        userAgent,
      },
    });

    const expiresIn = this.parseExpiresIn(
      this.configService.get<string>("jwt.expiresIn", "15m"),
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn,
    };
  }

  generateAccessToken(payload: JwtPayload): string {
    const expiresIn = this.configService.get<string>("jwt.expiresIn", "15m");
    return this.jwtService.sign(payload as unknown as Record<string, unknown>, {
      expiresIn: expiresIn as never,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    const secret = this.configService.getOrThrow<string>("jwt.refreshSecret");
    const expiresIn = this.configService.get<string>("jwt.refreshExpiresIn", "7d");
    return this.jwtService.sign(payload as unknown as Record<string, unknown>, {
      secret,
      expiresIn: expiresIn as never,
    });
  }

  verifyToken(token: string, isRefresh = false): JwtPayload {
    const secret = isRefresh
      ? this.configService.getOrThrow<string>("jwt.refreshSecret")
      : this.configService.getOrThrow<string>("jwt.secret");

    return this.jwtService.verify<JwtPayload>(token, { secret });
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  private async createSession(
    userId: string,
    organizationId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      { sub: userId, organizationId } as unknown as Record<string, unknown>,
      {
        expiresIn: this.configService.get<string>("jwt.expiresIn", "15m") as never,
      },
    );

    const expiresAt = new Date(Date.now() + this.refreshExpiresInMs);

    const session = await this.prisma.session.create({
      data: {
        userId,
        tokenHash: this.hashSha256(accessToken),
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    const rawRefreshToken = this.jwtService.sign(
      { sub: userId, sessionId: session.id } as unknown as Record<string, unknown>,
      {
        secret: this.configService.getOrThrow<string>("jwt.refreshSecret"),
        expiresIn: this.configService.get<string>("jwt.refreshExpiresIn", "7d") as never,
      },
    );

    const refreshTokenHash = await bcrypt.hash(rawRefreshToken, 10);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private async logFailed(
    email: string,
    organizationId: string | null,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    if (!organizationId) return;

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        action: AUDIT_ACTION.LOGIN_FAILED,
        resource: "auth",
        severity: AuditSeverity.WARNING,
        metadata: { email } as object,
        ipAddress,
        userAgent,
      },
    });
  }

  private async loadRoles(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
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
    });

    return userRoles.map((ur) => ur.role);
  }

  private extractPermissions(
    roles: { rolePermissions: { permission: { resource: string; action: string } }[] }[],
  ): PermissionEntry[] {
    const set = new Set<string>();
    for (const role of roles) {
      for (const rp of role.rolePermissions) {
        set.add(`${rp.permission.resource}:${rp.permission.action}`);
      }
    }
    return Array.from(set).map((key) => {
      const [resource, action] = key.split(":");
      return { resource, action };
    });
  }

  private parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900;
    const num = parseInt(match[1], 10);
    switch (match[2]) {
      case "s": return num;
      case "m": return num * 60;
      case "h": return num * 3600;
      case "d": return num * 86400;
      default: return 900;
    }
  }

  private hashSha256(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
