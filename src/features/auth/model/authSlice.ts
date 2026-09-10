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
};

const storedSession = getStoredAuthSession();

const initialState: AuthState = {
  user: storedSession?.user ?? null,
  accessToken: storedSession?.accessToken ?? null,
  refreshToken: storedSession?.refreshToken ?? null,
  serverId: storedSession?.serverId ?? null,
  loading: false,
  error: null,
};

function applySession(state: AuthState, session: AuthSession) {
  state.user = session.user;
  state.accessToken = session.accessToken;
  state.refreshToken = session.refreshToken;
  state.serverId = session.serverId;
  state.loading = false;
  state.error = null;

  setAuthSession(session);
}

function clearSession(state: AuthState) {
  state.user = null;
  state.accessToken = null;
  state.refreshToken = null;
  state.serverId = null;
  state.loading = false;
  state.error = null;

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
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể đăng nhập.";
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể tạo tài khoản.";
      })
      .addCase(refreshAuthSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshAuthSession.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(refreshAuthSession.rejected, (state, action) => {
        if (action.meta.aborted) {
          state.loading = false;
          return;
        }

        clearSession(state);
      });
  },
});

export const { clearAuthError, logout, setCredentials, updateAuthUser } =
  authSlice.actions;
export default authSlice.reducer;
