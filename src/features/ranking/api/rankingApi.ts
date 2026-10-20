import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";
import type { RewardIconItem } from "@/shared/types/reward";
import type { ServerId } from "@/shared/types/server";

export type BuiltinRankingType =
  | "top-donates"
  | "top-levels"
  | "top-disciple-levels"
  | "top-pvp"
  | "top-fireworks"
  | "top-boss-hunt";

export type ConfiguredEventRankingType = `event:${string}`;
export type RankingType = BuiltinRankingType | ConfiguredEventRankingType;

export function isEventRankingType(
  value: string,
): value is ConfiguredEventRankingType {
  return value.length <= 70 && /^event:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export type RankingCatalogItem = {
  id: RankingType;
  label: string;
  status: string;
  eventId?: number;
  scoreIndex?: number;
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

export type RankingSeason = {
  id: number;
  name: string;
  startAt: string;
  endAt: string;
};

export type DepositRanking = BaseRanking & {
  category: "top-deposit";
  season?: RankingSeason | null;
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
  season: RankingSeason | null;
  rewards: RankingRewardSet | null;
  items: Array<
    AchievementRankingEntry & {
      level: number;
      rebirthLevel: number;
      experience: number;
    }
  >;
};

export type DiscipleLevelRanking = BaseRanking & {
  category: "top-disciple-level";
  season: RankingSeason | null;
  rewards: RankingRewardSet | null;
  items: Array<
    AchievementRankingEntry & {
      discipleId: string;
      ownerPlayerName: string;
      level: number;
      rebirthLevel: number;
      experience: string;
    }
  >;
};

export type PvpRanking = BaseRanking & {
  category: "top-pvp";
  items: Array<AchievementRankingEntry & { pvpPoints: number }>;
};

export type EventRanking = BaseRanking & {
  category: "top-fireworks" | "top-boss-hunt" | "top-event";
  eventId: number;
  scoreIndex: number;
  rankingCode?: string;
  season?: RankingSeason | null;
  rewards?: RankingRewardSet | null;
  items: Array<AchievementRankingEntry & { points: number }>;
};

export type RankingData =
  | DepositRanking
  | LevelRanking
  | DiscipleLevelRanking
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

export async function getRanking(serverId: ServerId, rankingType: RankingType) {
  try {
    const response = await httpClient.get<ApiEnvelope<RankingData>>(
      isEventRankingType(rankingType)
        ? `/rankings/events/${encodeURIComponent(rankingType.slice(6))}`
        : `/rankings/${rankingType}`,
      { params: { serverId } },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
