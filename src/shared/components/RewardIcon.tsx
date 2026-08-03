import { RankingRewardItem } from "@/features/ranking/api/rankingApi";
import { PackageOpen } from "lucide-react";

const getRewardIconUrl = (item: RankingRewardItem) => {
  return item.iconUrl || undefined;
};

export const RewardIcon = ({ item }: { item: RankingRewardItem }) => {
  const iconUrl = getRewardIconUrl(item);
  const shouldCropFirstFrame = item.source === "item4";

  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-100 bg-amber-50 text-amber-600">
      {iconUrl && shouldCropFirstFrame ? (
        <span
          aria-hidden="true"
          className="absolute inset-1.5 bg-top bg-no-repeat"
          style={{
            backgroundImage: `url("${iconUrl}")`,
            backgroundSize: "100% auto",
          }}
        />
      ) : iconUrl ? (
        <img
          src={iconUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain p-1.5"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : (
        <PackageOpen size={20} aria-hidden="true" />
      )}
    </span>
  );
};
