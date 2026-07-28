import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";

export type CoinSummary = {
  wallet: {
    web_coin: number;
    reserved_coin: number;
    available_coin: number;
  };
  player: {
    id: number;
    name: string;
    game_coin: number;
  };
  config: {
    multiplier: number;
    auto_approve: boolean;
    min_amount: number;
    max_amount: number;
  };
  history: Array<{
    id: number;
    web_coin: number;
    game_coin: number;
    multiplier: number;
    status: string;
    created_at: string;
    processed_at: string | null;
  }>;
};

type ApiEnvelope<T> = { message?: string; data: T };

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  return error instanceof Error ? error.message : fallback;
}

export async function getCoinSummary() {
  try {
    const response = await httpClient.get<ApiEnvelope<CoinSummary>>(
      "/coin-conversion/summary",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể tải thông tin đổi Coin."));
  }
}

export async function createCoinConversion(amount: number) {
  try {
    const response = await httpClient.post<ApiEnvelope<{
      id: number;
      web_coin: number;
      game_coin: number;
      multiplier: number;
      status: string;
      available_coin: number;
      player_name: string;
    }>>("/coin-conversion/requests", { amount });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể tạo yêu cầu đổi Coin."));
  }
}
