import { apiClient } from "./apiClient";
import type {
  AuthResponse,
  HealthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "./types";

/** Thin typed wrappers over the backend API contract (all under /api/v1). */

async function health(): Promise<HealthResponse> {
  const res = await apiClient.get<HealthResponse>("/api/v1/health");
  return res.data;
}

async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/api/v1/auth/register", data);
  return res.data;
}

async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/api/v1/auth/login", data);
  return res.data;
}

async function logout(): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>("/api/v1/auth/logout", {});
  return res.data;
}

async function me(): Promise<User> {
  const res = await apiClient.get<User>("/api/v1/auth/me");
  return res.data;
}

export const api = { health, register, login, logout, me };
