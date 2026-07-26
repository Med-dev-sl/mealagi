import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { JwtPayload } from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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
}
