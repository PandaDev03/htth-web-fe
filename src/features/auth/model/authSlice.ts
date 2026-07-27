import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  loginUser,
  refreshAuthSession,
  registerUser,
} from "@/features/auth/model/authThunks";
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredAuthUser,
  getStoredRefreshToken,
  setAuthSession,
  type AuthSession,
} from "@/features/auth/model/tokenStorage";
import type { AuthUser } from "@/shared/types/auth";

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: getStoredAuthUser(),
  accessToken: getStoredAccessToken(),
  refreshToken: getStoredRefreshToken(),
  loading: false,
  error: null,
};

function applySession(state: AuthState, session: AuthSession) {
  state.user = session.user;
  state.accessToken = session.accessToken;
  state.refreshToken = session.refreshToken;
  state.loading = false;
  state.error = null;

  setAuthSession(session);
}

function clearSession(state: AuthState) {
  state.user = null;
  state.accessToken = null;
  state.refreshToken = null;
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

export const { clearAuthError, logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
