import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";

export type PayosPayment = {
  amount: number;
  webCoinAmount: number;
  multiplier: number;
  description: string;
  order_code: string;
  qr_image_url: string;
  checkout_url: string;
};

export type PayosPaymentState =
  | "empty"
  | "pending"
  | "queued"
  | "processed"
  | "duplicate"
  | "failed"
  | "delivery_failed"
  | "cancelled"
  | "canceled"
  | "expired";

export type PayosPaymentStatus = {
  paid: boolean;
  state: PayosPaymentState | (string & {});
  order_code?: string;
  amount?: number;
  webCoinAmount?: number;
  multiplier?: number;
  coin?: number;
  tongnap?: number;
  support_required?: boolean;
};

export type DepositHistoryItem = {
  id: number;
  ref_no: string;
  paid_at: string;
  amount: number;
  webCoinAmount: number;
  status: string;
  bank: string;
};

export type PayosDepositConfig = {
  enabled: boolean;
  multiplier: number;
  minAmount: number;
  maxAmount: number;
};

type ApiEnvelope<T> = { message?: string; data: T };

function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  return error instanceof Error ? error.message : fallback;
}

export async function getPayosDepositConfig() {
  try {
    const response = await httpClient.get<ApiEnvelope<PayosDepositConfig>>(
      "/donate/payos/config",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(
      apiErrorMessage(error, "Không thể tải cấu hình Donate PayOS."),
    );
  }
}

export async function createPayosPayment(amount: number) {
  try {
    const response = await httpClient.post<ApiEnvelope<PayosPayment>>(
      "/donate/payos/payments",
      { amount },
    );
    return {
      message: response.data.message || "Tạo mã QR Donate thành công.",
      data: response.data.data,
    };
  } catch (error) {
    throw new Error(
      apiErrorMessage(error, "Không thể tạo mã QR Donate."),
    );
  }
}

export async function getPayosPaymentStatus(orderCode: string) {
  try {
    const response = await httpClient.get<ApiEnvelope<PayosPaymentStatus>>(
      "/donate/payos/payments/" + encodeURIComponent(orderCode) + "/status",
    );
    return {
      message: response.data.message || "Đã kiểm tra trạng thái Donate.",
      data: response.data.data,
    };
  } catch (error) {
    throw new Error(
      apiErrorMessage(error, "Không thể kiểm tra trạng thái Donate."),
    );
  }
}

export async function getDepositHistory() {
  try {
    const response = await httpClient.get<ApiEnvelope<DepositHistoryItem[]>>(
      "/donate/payos/history",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Không thể tải lịch sử Donate."));
  }
}
