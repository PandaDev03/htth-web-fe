import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import {
  login,
  refreshSession,
  registerAccount,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
} from "@/features/auth/api/authApi";

type ApiErrorBody = {
  message?: string | string[];
};

function getRequestError(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (message) {
      return message;
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginRequest,
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    return await login(payload);
  } catch (error) {
    return rejectWithValue(
      getRequestError(error, "Thông tin đăng nhập không đúng."),
    );
  }
});

export const registerUser = createAsyncThunk<
  AuthResponse,
  RegisterRequest,
  { rejectValue: string }
>("auth/register", async (payload, { rejectWithValue }) => {
  try {
    return await registerAccount(payload);
  } catch (error) {
    return rejectWithValue(
      getRequestError(error, "Không thể tạo tài khoản, vui lòng thử lại."),
    );
  }
});

export const refreshAuthSession = createAsyncThunk<
  AuthResponse,
  string,
  { rejectValue: string }
>("auth/refresh", async (refreshToken, { rejectWithValue }) => {
  try {
    return await refreshSession(refreshToken);
  } catch (error) {
    return rejectWithValue(
      getRequestError(error, "Phiên đăng nhập đã hết hạn."),
    );
  }
});
