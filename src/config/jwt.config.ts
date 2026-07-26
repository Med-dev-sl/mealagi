import { registerAs } from "@nestjs/config";

export default registerAs("jwt", () => ({
  secret: process.env.JWT_SECRET ?? "fallback-secret",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "fallback-refresh-secret",
  expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
}));
