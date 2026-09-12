import { httpClient } from "@/shared/api/httpClient";
import { isServerId, type GameServer } from "@/shared/types/server";

export async function getGameServers() {
  const { data } = await httpClient.get<unknown>("/servers");

  if (!Array.isArray(data)) {
    throw new Error("Danh sách server không hợp lệ.");
  }

  return data.filter(isGameServer);
}

function isGameServer(value: unknown): value is GameServer {
  if (!value || typeof value !== "object") return false;

  const server = value as Partial<GameServer>;
  return (
    isServerId(server.id) &&
    typeof server.displayName === "string" &&
    server.displayName.trim().length > 0 &&
    typeof server.enabled === "boolean"
  );
}
