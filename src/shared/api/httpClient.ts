import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredServerId,
  setAuthSession,
  type AuthSession,
} from "@/features/auth/model/tokenStorage";
import { env } from "@/shared/config/env";

type AuthRequestContext = {
  accessToken: string | null;
  refreshToken: string | null;
  serverId: AuthSession["serverId"] | null;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _authContext?: AuthRequestContext;
  _authRetryAccessToken?: string;
  _retry?: boolean;
};

type RefreshAttempt = {
  context: AuthRequestContext;
  refreshToken: string;
  promise: Promise<AuthSession | null>;
};

type AuthSessionSynchronizer = (session: AuthSession | null) => void;

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

let refreshAttempt: RefreshAttempt | null = null;
let authSessionSynchronizer: AuthSessionSynchronizer | null = null;

export function configureHttpAuthSessionSynchronizer(
  synchronizer: AuthSessionSynchronizer,
) {
  authSessionSynchronizer = synchronizer;
}

function expireAuthSession() {
  if (authSessionSynchronizer) {
    authSessionSynchronizer(null);
    return;
  }

  clearAuthSession();
}

function applyRefreshedAuthSession(session: AuthSession) {
  if (authSessionSynchronizer) {
    authSessionSynchronizer(session);
    return;
  }

  setAuthSession(session);
}

function getCurrentAuthRequestContext(): AuthRequestContext {
  return {
    accessToken: getStoredAccessToken(),
    refreshToken: getStoredRefreshToken(),
    serverId: getStoredServerId(),
  };
}

function hasSameAuthRequestContext(
  left: AuthRequestContext,
  right: AuthRequestContext,
) {
  return (
    left.accessToken === right.accessToken &&
    left.refreshToken === right.refreshToken &&
    left.serverId === right.serverId
  );
}

function isCurrentAuthRequestContext(context: AuthRequestContext) {
  return hasSameAuthRequestContext(context, getCurrentAuthRequestContext());
}

function isCurrentAuthSession(session: AuthSession) {
  return hasSameAuthRequestContext(getCurrentAuthRequestContext(), {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    serverId: session.serverId,
  });
}

function expireAuthSessionIfCurrent(context: AuthRequestContext) {
  if (isCurrentAuthRequestContext(context)) {
    expireAuthSession();
  }
}

function shouldSkipRefresh(url?: string) {
  return Boolean(
    url?.includes("/auth/login") ||
      url?.includes("/auth/register") ||
      url?.includes("/auth/refresh"),
  );
}

async function refreshAccessToken(context: AuthRequestContext) {
  const { refreshToken } = context;

  if (!refreshToken) {
    expireAuthSessionIfCurrent(context);
    return null;
  }

  try {
    const { data } = await axios.post<AuthSession>(
      (env.apiBaseUrl.endsWith("/") ? env.apiBaseUrl.slice(0, -1) : env.apiBaseUrl) + "/auth/refresh",
      { refreshToken },
      { timeout: 15000 },
    );

    if (!isCurrentAuthRequestContext(context)) {
      return null;
    }

    if (data.serverId !== context.serverId) {
      expireAuthSessionIfCurrent(context);
      return null;
    }

    applyRefreshedAuthSession(data);
    return data;
  } catch {
    expireAuthSessionIfCurrent(context);
    return null;
  }
}

function getRefreshAttempt(
  context: AuthRequestContext,
  refreshToken: string,
) {
  if (
    refreshAttempt?.refreshToken === refreshToken &&
    hasSameAuthRequestContext(refreshAttempt.context, context)
  ) {
    return refreshAttempt;
  }

  let attempt: RefreshAttempt;
  const promise = refreshAccessToken(context).finally(() => {
    if (refreshAttempt === attempt) {
      refreshAttempt = null;
    }
  });

  attempt = { context, refreshToken, promise };
  refreshAttempt = attempt;

  return attempt;
}

httpClient.interceptors.request.use((config) => {
  const requestConfig = config as RetriableRequestConfig;

  if (requestConfig._authRetryAccessToken !== undefined) {
    config.headers.Authorization = `Bearer ${requestConfig._authRetryAccessToken}`;
    return config;
  }

  const context = getCurrentAuthRequestContext();
  requestConfig._authContext = context;

  if (context.accessToken) {
    config.headers.Authorization = `Bearer ${context.accessToken}`;
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
      shouldSkipRefresh(originalRequest.url) ||
      !originalRequest._authContext
    ) {
      return Promise.reject(error);
    }

    const requestContext = originalRequest._authContext;

    if (!isCurrentAuthRequestContext(requestContext)) {
      return Promise.reject(error);
    }

    const { refreshToken } = requestContext;

    if (!refreshToken) {
      expireAuthSessionIfCurrent(requestContext);
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const attempt = getRefreshAttempt(requestContext, refreshToken);
    const refreshedSession = await attempt.promise;

    if (!refreshedSession || !isCurrentAuthSession(refreshedSession)) {
      return Promise.reject(error);
    }

    originalRequest._authContext = {
      accessToken: refreshedSession.accessToken,
      refreshToken: refreshedSession.refreshToken,
      serverId: refreshedSession.serverId,
    };
    originalRequest._authRetryAccessToken = refreshedSession.accessToken;
    originalRequest.headers.Authorization = `Bearer ${refreshedSession.accessToken}`;
    return httpClient(originalRequest);
  },
);
