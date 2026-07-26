import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AuthUser } from "@/shared/types/auth";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
};

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem("htth_user") ?? "null") as AuthUser | null,
  accessToken: localStorage.getItem("htth_access_token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      localStorage.setItem("htth_user", JSON.stringify(action.payload.user));
      localStorage.setItem("htth_access_token", action.payload.accessToken);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      localStorage.removeItem("htth_user");
      localStorage.removeItem("htth_access_token");
    },
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
