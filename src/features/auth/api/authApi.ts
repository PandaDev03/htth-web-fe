import { httpClient } from "@/shared/api/httpClient";
import type { AuthUser } from "@/shared/types/auth";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
};

export async function login(payload: LoginRequest) {
  const { data } = await httpClient.post<LoginResponse>("/auth/login", payload);
  return data;
}
