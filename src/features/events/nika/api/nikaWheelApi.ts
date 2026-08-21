import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";
import type { RewardIconItem, RewardIconSource } from "@/shared/types/reward";

export type NikaRarity = "very_rare" | "rare" | "uncommon" | "common";

export type NikaReward = RewardIconItem & {
  id: string;
  source: RewardIconSource;
  sourceId: number | null;
  itemId: number | null;
  name: string;
  quantity: number;
  description: string | null;
  iconUrl: string | null;
};

export type NikaWheelReward = NikaReward & {
  rarity: NikaRarity;
  weight: number;
  probabilityPercent: number;
};

export type NikaMilestone = {
  id: number;
  target: number;
  claimed: boolean;
  claimable: boolean;
  rewards: NikaReward[];
};

export type NikaWallet = {
  tickets: number;
  webCoin: number;
  reservedCoin: number;
  availableWebCoin: number;
};

export type NikaWheelState = {
  event: {
    slug: string;
    name: string;
    coinPerSpin: number;
    spinCounts: readonly [1, 5, 10];
    totalWeight: number;
  };
  player: { id: number; name: string } | null;
  wallet: NikaWallet;
  progress: {
    totalSpins: number;
    claimedMilestoneIds: number[];
  };
  inventory: {
    items: NikaReward[];
    distinctItems: number;
    totalQuantity: number;
  };
  rewards: NikaWheelReward[];
  milestones: NikaMilestone[];
};

export type NikaSpinResult = {
  requestId: string;
  historyId: number;
  payment: {
    ticketsSpent: number;
    coinSpent: number;
  };
  wallet: NikaWallet;
  progress: {
    totalSpins: number;
  };
  inventoryAdded: number;
  results: Array<NikaReward & { rarity: NikaRarity }>;
};

type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

type ApiErrorBody = {
  message?: string | string[];
};

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (message) return message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function claimNikaInventory() {
  try {
    const { data } = await httpClient.post<
      ApiEnvelope<{
        claimId: string;
        pendingGiftId: number;
        items: NikaReward[];
      }>
    >("/events/nika-wheel/inventory/claim");
    return {
      ...data.data,
      message: data.message ?? "Đã nhận toàn bộ Kho quà.",
    };
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể nhận Kho quà."));
  }
}

export async function getNikaWheelState() {
  try {
    const { data } = await httpClient.get<ApiEnvelope<NikaWheelState>>(
      "/events/nika-wheel",
    );
    return data.data;
  } catch (error) {
    throw new Error(
      errorMessage(error, "Không thể tải dữ liệu Vòng Quay Nika."),
    );
  }
}

export async function spinNikaWheel(
  count: 1 | 5 | 10,
  confirmMixedPayment = false,
) {
  try {
    const { data } = await httpClient.post<ApiEnvelope<NikaSpinResult>>(
      "/events/nika-wheel/spin",
      { count, confirmMixedPayment },
    );
    return {
      ...data.data,
      message: data.message ?? "Quay thành công.",
    };
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể thực hiện lượt quay."));
  }
}

export async function claimNikaMilestone(milestoneId: number) {
  try {
    const { data } = await httpClient.post<
      ApiEnvelope<{
        milestoneId: number;
        pendingGiftId: number | null;
        ticketsReceived: number;
        wallet: NikaWallet;
      }>
    >(`/events/nika-wheel/milestones/${milestoneId}/claim`);
    return {
      ...data.data,
      message: data.message ?? "Đã nhận mốc quà.",
    };
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể nhận mốc quà."));
  }
}
