import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";
import type { RewardIconItem } from "@/shared/types/reward";

export type CoinMilestoneReward = RewardIconItem & {
  quantity: number;
  name: string;
};

export type CoinMilestone = {
  season: {
    id: number;
    name: string;
    startAt: string;
    endAt: string;
  };
  totalExchanged: number;
  claimedTierIds: number[];
  nextMilestone: number | null;
  progressPercent: number;
  tiers: Array<{
    tierId: number;
    milestone: number;
    sort: number;
    claimed: boolean;
    claimable: boolean;
    rewards: CoinMilestoneReward[];
  }>;
};

export type CoinSummary = {
  wallet: {
    webCoin: number;
    reservedCoin: number;
    availableCoin: number;
  };
  player: {
    id: number;
    name: string;
    gameCoin: number;
  };
  config: {
    multiplier: number;
    autoApprove: boolean;
    minAmount: number;
    maxAmount: number;
  };
  milestone: CoinMilestone | null;
  history: Array<{
    id: number;
    webCoin: number;
    gameCoin: number;
    multiplier: number;
    status: string;
    createdAt: string;
    processedAt: string | null;
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
      webCoin: number;
      gameCoin: number;
      multiplier: number;
      status: string;
      availableCoin: number;
      playerName: string;
    }>>("/coin-conversion/requests", { amount });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể tạo yêu cầu đổi Coin."));
  }
}

export async function claimCoinMilestone(tierId: number) {
  try {
    const response = await httpClient.post<
      ApiEnvelope<{
        tierId: number;
        pendingGiftId: number;
        status: string;
      }>
    >(`/coin-conversion/milestones/${tierId}/claim`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể nhận mốc quà."));
  }
}
