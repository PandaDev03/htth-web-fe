import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";

export type AdminDashboardStats = {
  totalAccounts: number;
  activeAccounts: number;
  revenue: number;
};

export type AdminAccountActionResult = {
  id: number;
  username: string;
};

type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

type ApiErrorBody = {
  message?: string | string[];
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (message) return message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export async function getAdminDashboardStats() {
  try {
    const response = await httpClient.get<ApiEnvelope<AdminDashboardStats>>(
      "/admin/dashboard",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Không thể tải dữ liệu Dashboard quản trị."),
    );
  }
}

export async function addAdminWalletCoin(username: string, amount: number) {
  try {
    const response = await httpClient.patch<
      ApiEnvelope<AdminAccountActionResult & { coin: number }>
    >(`/admin/accounts/${encodeURIComponent(username.trim())}/coin`, { amount });
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Không thể cộng Coin vào ví web."),
    );
  }
}

export async function setAdminAccountLock(
  username: string,
  locked: boolean,
) {
  try {
    const response = await httpClient.patch<
      ApiEnvelope<AdminAccountActionResult & { locked: boolean }>
    >(`/admin/accounts/${encodeURIComponent(username.trim())}/lock`, { locked });
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Không thể cập nhật trạng thái tài khoản."),
    );
  }
}
