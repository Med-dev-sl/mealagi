export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
