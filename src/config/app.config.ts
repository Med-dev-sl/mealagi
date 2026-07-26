import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET ?? "fallback-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "fallback-refresh-secret",
  logLevel: process.env.LOG_LEVEL ?? "debug",
}));
