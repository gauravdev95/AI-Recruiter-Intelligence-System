/** User role as defined by the backend auth contract. */
export type UserRole = "candidate" | "recruiter";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: User;
}

export interface HealthResponse {
  status: "ok" | "error";
  database: "connected" | "disconnected";
}

/** Backend error envelope: { error: { code, message, details } } */
export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}
