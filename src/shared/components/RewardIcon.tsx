import { PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";

import type { RewardIconItem, RewardIconSource } from "@/shared/types/reward";

export type RewardIconProps = {
  item?: RewardIconItem | null;
  className?: string;
};

const firstFrameSources = new Set<RewardIconSource>(["item4"]);

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const getRewardIconUrl = (item?: RewardIconItem | null) => {
  return item?.iconUrl || undefined;
};

export const RewardIcon = ({ item, className }: RewardIconProps) => {
  const iconUrl = getRewardIconUrl(item);
  const [hasImageError, setHasImageError] = useState(false);
  const shouldCropFirstFrame = Boolean(
    item?.source && firstFrameSources.has(item.source),
  );
  const shouldShowImage = Boolean(iconUrl && !hasImageError);

  useEffect(() => {
    setHasImageError(false);
  }, [iconUrl]);

  return (
    <span
      className={cx(
        "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-100 bg-amber-50 text-amber-600",
        className,
      )}
      title={item?.description ?? item?.name ?? undefined}
    >
      {!shouldShowImage && <PackageOpen size={20} aria-hidden="true" />}
      {shouldShowImage && shouldCropFirstFrame ? (
        <img
          src={iconUrl}
          alt=""
          loading="lazy"
          className="absolute left-1.5 top-1.5 h-auto w-[calc(100%_-_0.75rem)] max-w-none"
          onError={() => setHasImageError(true)}
        />
      ) : shouldShowImage ? (
        <img
          src={iconUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain p-1.5"
          onError={() => setHasImageError(true)}
        />
      ) : null}
    </span>
  );
};
