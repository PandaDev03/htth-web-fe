import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";

export type RankingEntry = {
  rank: number;
  username: string;
  tongnap: number;
};

export type DepositRanking = {
  category: "top-deposit";
  limit: number;
  updatedAt: string;
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
