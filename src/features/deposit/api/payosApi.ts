import { env } from "@/shared/config/env";

type LegacyApiEnvelope<T> = {
  status?: boolean;
  message?: string;
  data?: T;
};

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

const CREATE_PAYOS_PAYMENT_PATH = "/Api/Client/User/CreatePayOSPayment.php";
const PAYOS_PAYMENT_STATUS_PATH = "/Api/Client/User/PayOSPaymentStatus.php";

function legacyUrl(path: string) {
  const baseUrl = env.legacyApiBaseUrl.replace(/\/$/, "");
  return baseUrl ? baseUrl + path : path;
}

async function postForm<T>(path: string, payload: Record<string, string>) {
  const response = await fetch(legacyUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "include",
    body: new URLSearchParams(payload).toString(),
  });

  const result = (await response.json()) as LegacyApiEnvelope<T>;

  if (!response.ok || !result.status || !result.data) {
    throw new Error(result.message || "Không thể kết nối cổng thanh toán PayOS.");
  }

  return {
    message: result.message || "Thao tác thành công.",
    data: result.data,
  };
}

export async function createPayosPayment(amount: number) {
  return postForm<PayosPayment>(CREATE_PAYOS_PAYMENT_PATH, {
    amount: String(amount),
  });
}

export async function getPayosPaymentStatus(orderCode: string) {
  return postForm<PayosPaymentStatus>(PAYOS_PAYMENT_STATUS_PATH, {
    order_code: orderCode,
  });
}
