import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";

export type PayosPayment = {
  amount: number;
  description: string;
  order_code: string;
  qr_image_url: string;
  checkout_url: string;
};

export type PayosPaymentStatus = {
  paid: boolean;
  state: "empty" | "pending" | "queued" | "processed" | "duplicate" | string;
  order_code?: string;
  amount?: number;
  coin?: number;
  tongnap?: number;
};

export type DepositHistoryItem = {
  id: number;
  ref_no: string;
  paid_at: string;
  amount: number;
  status: string;
  bank: string;
};

type ApiEnvelope<T> = { message?: string; data: T };

function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  return error instanceof Error ? error.message : fallback;
}

export async function createPayosPayment(amount: number) {
  try {
    const response = await httpClient.post<ApiEnvelope<PayosPayment>>(
      "/deposit/payos/payments",
      { amount },
    );
    return {
      message: response.data.message || "Tạo mã QR thanh toán thành công.",
      data: response.data.data,
    };
  } catch (error) {
    throw new Error(
      apiErrorMessage(error, "Không thể tạo mã QR thanh toán."),
    );
  }
}

export async function getPayosPaymentStatus(orderCode: string) {
  try {
    const response = await httpClient.get<ApiEnvelope<PayosPaymentStatus>>(
      "/deposit/payos/payments/" + encodeURIComponent(orderCode) + "/status",
    );
    return {
      message: response.data.message || "Đã kiểm tra trạng thái thanh toán.",
      data: response.data.data,
    };
  } catch (error) {
    throw new Error(
      apiErrorMessage(error, "Không thể kiểm tra trạng thái PayOS."),
    );
  }
}

export async function getDepositHistory() {
  try {
    const response = await httpClient.get<ApiEnvelope<DepositHistoryItem[]>>(
      "/deposit/payos/history",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Không thể tải lịch sử nạp tiền."));
  }
}
