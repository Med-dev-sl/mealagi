import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import appConfig from "./core/config/app.config";
import databaseConfig from "./core/config/database.config";
import jwtConfig from "./core/config/jwt.config";

import { PrismaModule } from "./core/database/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { UsersModule } from "./modules/users/users.module";
import { RolesModule } from "./modules/roles/roles.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { AuthModule } from "./core/auth/auth.module";

import { RequestLoggerMiddleware } from "./shared/middleware/request-logger.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ".env",
    }),
    PrismaModule,
    HealthModule,
    OrganizationsModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}
