import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  loginUser,
  refreshAuthSession,
  registerUser,
} from "@/features/auth/model/authThunks";
import {
  clearAuthSession,
  getStoredAuthSession,
  setAuthSession,
  setStoredAuthUser,
  type AuthSession,
} from "@/features/auth/model/tokenStorage";
import type { AuthUser } from "@/shared/types/auth";
import type { ServerId } from "@/shared/types/server";

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  serverId: ServerId | null;
  loading: boolean;
  error: string | null;
  activeRequestId: string | null;
};

const storedSession = getStoredAuthSession();

const initialState: AuthState = {
  user: storedSession?.user ?? null,
  accessToken: storedSession?.accessToken ?? null,
  refreshToken: storedSession?.refreshToken ?? null,
  serverId: storedSession?.serverId ?? null,
  loading: false,
  error: null,
  activeRequestId: null,
};

function applySession(state: AuthState, session: AuthSession) {
  state.user = session.user;
  state.accessToken = session.accessToken;
  state.refreshToken = session.refreshToken;
  state.serverId = session.serverId;
  state.loading = false;
  state.error = null;
  state.activeRequestId = null;

  setAuthSession(session);
}

function clearSession(state: AuthState) {
  state.user = null;
  state.accessToken = null;
  state.refreshToken = null;
  state.serverId = null;
  state.loading = false;
  state.error = null;
  state.activeRequestId = null;

  clearAuthSession();
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthSession>) => {
      applySession(state, action.payload);
    },
    logout: (state) => {
      clearSession(state);
    },
    updateAuthUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (!state.user) return;

      state.user = { ...state.user, ...action.payload };
      setStoredAuthUser(state.user);
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.activeRequestId = action.meta.requestId;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) return;

        applySession(state, action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) return;

        state.loading = false;
        state.error = action.payload ?? "Không thể đăng nhập.";
        state.activeRequestId = null;
      })
      .addCase(registerUser.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.activeRequestId = action.meta.requestId;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) return;

        applySession(state, action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) return;

        state.loading = false;
        state.error = action.payload ?? "Không thể tạo tài khoản.";
        state.activeRequestId = null;
      })
      .addCase(refreshAuthSession.pending, (state, action) => {
        if (state.refreshToken === action.meta.arg) {
          state.loading = true;
          state.activeRequestId = action.meta.requestId;
        }
      })
      .addCase(refreshAuthSession.fulfilled, (state, action) => {
        if (
          state.refreshToken !== action.meta.arg ||
          state.activeRequestId !== action.meta.requestId
        )
          return;

        applySession(state, action.payload);
      })
      .addCase(refreshAuthSession.rejected, (state, action) => {
        if (
          state.refreshToken !== action.meta.arg ||
          state.activeRequestId !== action.meta.requestId
        )
          return;

        if (action.meta.aborted) {
          state.loading = false;
          state.activeRequestId = null;
          return;
        }

        clearSession(state);
      });
  },
});

export const { clearAuthError, logout, setCredentials, updateAuthUser } =
  authSlice.actions;
export default authSlice.reducer;
