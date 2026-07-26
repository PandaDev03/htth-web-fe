import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredAuthUser,
  getStoredRefreshToken,
  setAuthSession,
  type AuthSession,
} from "@/features/auth/model/tokenStorage";
import type { AuthUser } from "@/shared/types/auth";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
};

const initialState: AuthState = {
  user: getStoredAuthUser(),
  accessToken: getStoredAccessToken(),
  refreshToken: getStoredRefreshToken(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthSession>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      setAuthSession(action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      clearAuthSession();
    },
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
