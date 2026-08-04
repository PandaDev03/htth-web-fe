export type RewardIconSource =
  | "currency"
  | "item4"
  | "item7"
  | "fashiontemplate"
  | "pet_template"
  | "danhhieu";

export type RewardIconItem = {
  source?: RewardIconSource | null;
  sourceId?: number | null;
  itemId?: number | null;
  name?: string | null;
  quantity?: string | number | null;
  description?: string | null;
  iconUrl?: string | null;
};

const rewardIconSources = new Set<RewardIconSource>([
  "currency",
  "item4",
  "item7",
  "fashiontemplate",
  "pet_template",
  "danhhieu",
]);

export function isRewardIconSource(value: unknown): value is RewardIconSource {
  return typeof value === "string" && rewardIconSources.has(value as RewardIconSource);
}
