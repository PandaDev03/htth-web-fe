import { httpClient } from "@/shared/api/httpClient";
import type { GameServer } from "@/shared/types/server";

export async function getGameServers() {
  const { data } = await httpClient.get<GameServer[]>("/servers");
  return data;
}

