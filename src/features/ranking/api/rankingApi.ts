import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";
import type { RewardIconItem } from "@/shared/types/reward";
import type { ServerId } from "@/shared/types/server";

export type RankingType =
  | "top-donates"
  | "top-levels"
  | "top-pvp"
  | "top-fireworks"
  | "top-boss-hunt";

export type RankingCatalogItem = {
  id: RankingType;
  label: string;
  status: string;
};

export type RankingCatalog = {
  serverId: ServerId;
  displayName: string;
  items: RankingCatalogItem[];
};

export type RankingEntry = {
  rank: number;
  username: string;
  playerName?: string | null;
  tongnap: number;
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

type BaseRanking = {
  limit: number;
  updatedAt: string;
};

export type DepositRanking = BaseRanking & {
  category: "top-deposit";
  season?: {
    id: number;
    name: string;
    startAt: string;
    endAt: string;
  } | null;
  rewards?: RankingRewardSet | null;
  items: RankingEntry[];
};

export type AchievementRankingEntry = {
  rank: number;
  playerName: string;
  accountUsername: string;
};

export type LevelRanking = BaseRanking & {
  category: "top-level";
  items: Array<AchievementRankingEntry & { level: number }>;
};

export type PvpRanking = BaseRanking & {
  category: "top-pvp";
  items: Array<AchievementRankingEntry & { pvpPoints: number }>;
};

export type EventRanking = BaseRanking & {
  category: "top-fireworks" | "top-boss-hunt";
  eventId: 12;
  scoreIndex: 0 | 1;
  rewards?: RankingRewardSet;
  items: Array<AchievementRankingEntry & { points: number }>;
};

export type RankingData =
  | DepositRanking
  | LevelRanking
  | PvpRanking
  | EventRanking;

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

export async function getRankingCatalog(serverId: ServerId) {
  try {
    const response = await httpClient.get<ApiEnvelope<RankingCatalog>>(
      "/rankings/catalog",
      { params: { serverId } },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getRanking(
  serverId: ServerId,
  rankingType: RankingType,
) {
  try {
    const response = await httpClient.get<ApiEnvelope<RankingData>>(
      `/rankings/${rankingType}`,
      { params: { serverId } },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
