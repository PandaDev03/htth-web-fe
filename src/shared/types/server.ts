export const SERVER_IDS = ["server1", "tan_binh"] as const;

export type ServerId = (typeof SERVER_IDS)[number];

export type GameServer = {
  id: ServerId;
  displayName: string;
  enabled: boolean;
};

export function isServerId(value: unknown): value is ServerId {
  return SERVER_IDS.includes(value as ServerId);
}
