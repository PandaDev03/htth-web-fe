import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";
import type { RewardIconItem, RewardIconSource } from "@/shared/types/reward";

export type WheelType = "nika" | "pet";
export type WheelRarity = "very_rare" | "rare" | "uncommon" | "common";

export type WheelRewardItem = RewardIconItem & {
  id: string;
  source: RewardIconSource;
  sourceId: number | null;
  itemId: number | null;
  name: string;
  quantity: number;
  description: string | null;
  iconUrl: string | null;
};

export type WheelReward = WheelRewardItem & {
  rarity: WheelRarity;
  weight: number;
  probabilityPercent: number;
};

export type WheelMilestone = {
  id: number;
  target: number;
  claimed: boolean;
  claimable: boolean;
  rewards: WheelRewardItem[];
};

export type WheelWallet = {
  tickets: number;
  webCoin: number;
  reservedCoin: number;
  availableWebCoin: number;
};

export type WheelState = {
  event: {
    slug: string;
    name: string;
    coinPerSpin: number;
    spinCounts: readonly [1, 5, 10];
    totalWeight: number;
  };
  player: { id: number; name: string } | null;
  wallet: WheelWallet;
  progress: {
    totalSpins: number;
    claimedMilestoneIds: number[];
  };
  inventory: {
    items: WheelRewardItem[];
    distinctItems: number;
    totalQuantity: number;
  };
  rewards: WheelReward[];
  milestones: WheelMilestone[];
};

export type WheelSpinResult = {
  requestId: string;
  historyId: number;
  payment: {
    ticketsSpent: number;
    coinSpent: number;
  };
  wallet: WheelWallet;
  progress: {
    totalSpins: number;
  };
  inventoryAdded: number;
  results: Array<WheelRewardItem & { rarity: WheelRarity }>;
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

export async function claimWheelInventory(wheel: WheelType) {
  try {
    const { data } = await httpClient.post<
      ApiEnvelope<{
        claimId: string;
        pendingGiftId: number;
        items: WheelRewardItem[];
      }>
    >(`/events/${wheel}-wheel/inventory/claim`);
    return {
      ...data.data,
      message: data.message ?? "Đã nhận toàn bộ Kho quà.",
    };
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể nhận Kho quà."));
  }
}

export async function getWheelState(wheel: WheelType) {
  try {
    const { data } = await httpClient.get<ApiEnvelope<WheelState>>(
      `/events/${wheel}-wheel`,
    );
    return data.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể tải dữ liệu vòng quay."));
  }
}

export async function spinWheel(
  wheel: WheelType,
  count: 1 | 5 | 10,
  confirmMixedPayment = false,
) {
  try {
    const { data } = await httpClient.post<ApiEnvelope<WheelSpinResult>>(
      `/events/${wheel}-wheel/spin`,
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

export async function claimWheelMilestone(wheel: WheelType, milestoneId: number) {
  try {
    const { data } = await httpClient.post<
      ApiEnvelope<{
        milestoneId: number;
        pendingGiftId: number | null;
        ticketsReceived: number;
        wallet: WheelWallet;
      }>
    >(`/events/${wheel}-wheel/milestones/${milestoneId}/claim`);
    return {
      ...data.data,
      message: data.message ?? "Đã nhận mốc quà.",
    };
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể nhận mốc quà."));
  }
}
