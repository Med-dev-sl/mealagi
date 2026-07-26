import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";

import { PrismaModule } from "./prisma/prisma.module";

import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { RolesModule } from "./modules/roles/roles.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { AuditModule } from "./modules/audit/audit.module";

import { RequestLoggerMiddleware } from "./common/middleware/request-logger.middleware";

const featureModules = [
  HealthModule,
  AuthModule,
  UsersModule,
  OrganizationsModule,
  RolesModule,
  PermissionsModule,
  AuditModule,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ".env",
    }),
    PrismaModule,
    ...featureModules,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}
