import type { AuthUser } from "@/shared/types/auth";
import { isServerId, type ServerId } from "@/shared/types/server";
import { queryClient } from "@/shared/api/queryClient";

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
    const user = JSON.parse(value) as Partial<AuthUser> | null;
    if (
      !user ||
      typeof user.id !== "string" ||
      typeof user.username !== "string" ||
      typeof user.name !== "string" ||
      !isUserRole(user.role)
    ) {
      return null;
    }

    return user as AuthUser;
  } catch {
    return null;
  }
}

function isUserRole(value: unknown): value is AuthUser["role"] {
  return value === "admin" || value === "moderator" || value === "user";
}

export function getStoredAuthSession(): AuthSession | null {
  const user = getStoredAuthUser();
  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  const serverId = getStoredServerId();

  if (user && accessToken && refreshToken && serverId) {
    return { user, accessToken, refreshToken, serverId };
  }

  if (user || accessToken || refreshToken || serverId) {
    clearAuthSession();
  }

  return null;
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
  return isServerId(value) ? value : null;
}

export function setStoredAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function setAuthSession(session: AuthSession) {
  const previousUser = getStoredAuthUser();
  const previousServerId = getStoredServerId();
  const hasChangedAuthenticatedIdentity = Boolean(
    previousUser &&
      previousServerId &&
      (previousUser.id !== session.user.id || previousServerId !== session.serverId),
  );

  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, session.refreshToken);
  localStorage.setItem(AUTH_SERVER_STORAGE_KEY, session.serverId);

  if (hasChangedAuthenticatedIdentity) {
    queryClient.clear();
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_SERVER_STORAGE_KEY);
  queryClient.clear();
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
