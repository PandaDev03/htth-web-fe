import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";
import type { RewardIconItem } from "@/shared/types/reward";

export type RankingEntry = {
  rank: number;
  username: string;
  playerName?: string | null;
  tongnap: number;
};

export type DepositRanking = {
  category: "top-deposit";
  limit: number;
  season?: {
    id: number;
    name: string;
    startAt: string;
    endAt: string;
  } | null;
  updatedAt: string;
  rewards?: RankingRewardSet | null;
  items: RankingEntry[];
};

export type LevelRankingEntry = {
  rank: number;
  playerName: string;
  accountUsername: string;
  level: number;
};

export type LevelRanking = {
  category: "top-level";
  limit: number;
  updatedAt: string;
  items: LevelRankingEntry[];
};

export type EventRankingEntry = {
  rank: number;
  playerName: string;
  accountUsername: string;
  points: number;
};

export type RankingRewardItem = RewardIconItem & {
  name: string;
  quantity?: string;
};

export type RankingRewardTier = {
  rankLabel: string;
  highlight?: "champion" | "runner" | "bronze";
  items: RankingRewardItem[];
};

export type RankingRewardSet = {
  title: string;
  description: string;
  tiers: RankingRewardTier[];
};

export type EventRanking = {
  category: "top-fireworks" | "top-boss-hunt";
  eventId: 12;
  scoreIndex: 0 | 1;
  limit: number;
  updatedAt: string;
  rewards?: RankingRewardSet;
  items: EventRankingEntry[];
};

type ApiEnvelope<T> = { data: T };

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }

  return error instanceof Error
    ? error.message
    : "Không thể tải bảng xếp hạng.";
}

export async function getTopDepositRanking() {
  try {
    const response = await httpClient.get<ApiEnvelope<DepositRanking>>(
      "/rankings/top-deposits",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTopLevelRanking() {
  try {
    const response = await httpClient.get<ApiEnvelope<LevelRanking>>(
      "/rankings/top-levels",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

async function getEventRanking(path: string) {
  try {
    const response = await httpClient.get<ApiEnvelope<EventRanking>>(path);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export function getTopFireworksRanking() {
  return getEventRanking("/rankings/top-fireworks");
}

export function getTopBossHuntRanking() {
  return getEventRanking("/rankings/top-boss-hunt");
}
