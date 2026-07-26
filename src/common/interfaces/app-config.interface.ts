export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  logLevel: string;
}

export interface DatabaseConfig {
  url: string;
}
