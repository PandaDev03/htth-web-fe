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
      message: response.data.message || "T\\u1ea1o m\\u00e3 QR thanh to\\u00e1n th\\u00e0nh c\\u00f4ng.",
      data: response.data.data,
    };
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Kh\\u00f4ng th\\u1ec3 t\\u1ea1o m\\u00e3 QR thanh to\\u00e1n."));
  }
}

export async function getPayosPaymentStatus(orderCode: string) {
  try {
    const response = await httpClient.get<ApiEnvelope<PayosPaymentStatus>>(
      "/deposit/payos/payments/" + encodeURIComponent(orderCode) + "/status",
    );
    return {
      message: response.data.message || "\\u0110\\u00e3 ki\\u1ec3m tra tr\\u1ea1ng th\\u00e1i thanh to\\u00e1n.",
      data: response.data.data,
    };
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Kh\\u00f4ng th\\u1ec3 ki\\u1ec3m tra tr\\u1ea1ng th\\u00e1i PayOS."));
  }
}