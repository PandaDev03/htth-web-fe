import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthSession,
} from "@/features/auth/model/tokenStorage";
import { env } from "@/shared/config/env";
import type { AuthUser } from "@/shared/types/auth";

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type RefreshResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

let refreshPromise: Promise<string | null> | null = null;

function shouldSkipRefresh(url?: string) {
  return Boolean(
    url?.includes("/auth/login") ||
      url?.includes("/auth/register") ||
      url?.includes("/auth/refresh"),
  );
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    clearAuthSession();
    return null;
  }

  const { data } = await axios.post<RefreshResponse>(
    (env.apiBaseUrl.endsWith("/") ? env.apiBaseUrl.slice(0, -1) : env.apiBaseUrl) + "/auth/refresh",
    { refreshToken },
    { timeout: 15000 },
  );

  setAuthSession(data);
  return data.accessToken;
}

httpClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const nextAccessToken = await refreshPromise.catch(() => {
      clearAuthSession();
      return null;
    });

    if (!nextAccessToken) {
      clearAuthSession();
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
    return httpClient(originalRequest);
  },
);
