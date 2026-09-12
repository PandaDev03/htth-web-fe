import { httpClient } from "@/shared/api/httpClient";
import type { AuthUser } from "@/shared/types/auth";
import type { ServerId } from "@/shared/types/server";

export type LoginRequest = {
  serverId: ServerId;
  username: string;
  password: string;
};

export type RegisterRequest = {
  serverId: ServerId;
  username: string;
  password: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  serverId: ServerId;
};

export async function login(payload: LoginRequest) {
  const { data } = await httpClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerAccount(payload: RegisterRequest) {
  const { data } = await httpClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function refreshSession(refreshToken: string) {
  const { data } = await httpClient.post<AuthResponse>("/auth/refresh", { refreshToken });
  return data;
}

export async function logoutSession() {
  await httpClient.post("/auth/logout");
}
