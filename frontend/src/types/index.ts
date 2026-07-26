export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roles: { id: string; name: string }[];
  permissions: { resource: string; action: string }[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  organization: { id: string; name: string; slug: string };
  roles: { id: string; name: string }[];
  permissions: { resource: string; action: string }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
