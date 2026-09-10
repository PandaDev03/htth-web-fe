import type { AuthUser } from "@/shared/types/auth";
import type { ServerId } from "@/shared/types/server";

export const ACCESS_TOKEN_STORAGE_KEY = "htth_access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "htth_refresh_token";
export const AUTH_USER_STORAGE_KEY = "htth_user";
export const AUTH_SERVER_STORAGE_KEY = "htth_server_id";
export const REMEMBERED_USERNAME_STORAGE_KEY = "htth_remembered_username";

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  serverId: ServerId;
};

function safeParseUser(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function getStoredAuthUser() {
  return safeParseUser(localStorage.getItem(AUTH_USER_STORAGE_KEY));
}

export function getStoredServerId(): ServerId | null {
  const value = localStorage.getItem(AUTH_SERVER_STORAGE_KEY);
  return value === "server1" || value === "tan_binh" ? value : null;
}

export function setStoredAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function setAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, session.refreshToken);
  localStorage.setItem(AUTH_SERVER_STORAGE_KEY, session.serverId);
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_SERVER_STORAGE_KEY);
}

export function getRememberedUsername() {
  return localStorage.getItem(REMEMBERED_USERNAME_STORAGE_KEY) ?? "";
}

export function setRememberedUsername(username: string) {
  localStorage.setItem(REMEMBERED_USERNAME_STORAGE_KEY, username);
}

export function clearRememberedUsername() {
  localStorage.removeItem(REMEMBERED_USERNAME_STORAGE_KEY);
}
