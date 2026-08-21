import { PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties, SyntheticEvent } from "react";

import type { RewardIconItem, RewardIconSource } from "@/shared/types/reward";

export type RewardIconProps = {
  item?: RewardIconItem | null;
  className?: string;
};

const firstFrameSources = new Set<RewardIconSource>(["item4"]);
const MAX_SPRITE_FRAMES = 64;
const SPRITE_FRAME_DURATION_MS = 150;

type RewardSpriteStyle = CSSProperties & {
  "--reward-icon-frame-count": number;
  "--reward-icon-animation-duration": string;
};

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const getRewardIconUrl = (item?: RewardIconItem | null) => {
  return item?.iconUrl || undefined;
};

const getSpriteFrameCount = (image: HTMLImageElement) => {
  const { naturalHeight, naturalWidth } = image;

  if (naturalWidth <= 0 || naturalHeight < naturalWidth * 2) {
    return 1;
  }

  const frameCount = Math.round(naturalHeight / naturalWidth);
  const isVerticalSprite =
    frameCount <= MAX_SPRITE_FRAMES &&
    Math.abs(naturalHeight - naturalWidth * frameCount) <= 1;

  return isVerticalSprite ? frameCount : 1;
};

export const RewardIcon = ({ item, className }: RewardIconProps) => {
  const iconUrl = getRewardIconUrl(item);
  const [hasImageError, setHasImageError] = useState(false);
  const [hasImageLoaded, setHasImageLoaded] = useState(false);
  const [frameCount, setFrameCount] = useState(1);
  const shouldCropFirstFrameByDefault = Boolean(
    item?.source && firstFrameSources.has(item.source),
  );
  const shouldShowImage = Boolean(iconUrl && !hasImageError);
  const shouldAnimateSprite = frameCount > 1;
  const shouldCropFrame =
    shouldCropFirstFrameByDefault || shouldAnimateSprite;
  const spriteStyle: RewardSpriteStyle | undefined = shouldAnimateSprite
    ? {
        "--reward-icon-frame-count": frameCount,
        "--reward-icon-animation-duration": `${frameCount * SPRITE_FRAME_DURATION_MS}ms`,
      }
    : undefined;

  useEffect(() => {
    setHasImageError(false);
    setHasImageLoaded(false);
    setFrameCount(1);
  }, [iconUrl]);

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    setFrameCount(getSpriteFrameCount(event.currentTarget));
    setHasImageLoaded(true);
  };

  return (
    <span
      className={cx(
        "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-100 bg-amber-50 text-amber-600",
        className,
      )}
      title={item?.description ?? item?.name ?? undefined}
    >
      {!shouldShowImage && <PackageOpen size={20} aria-hidden="true" />}
      {shouldShowImage ? (
        <span className="absolute inset-1.5 overflow-hidden" aria-hidden="true">
          <img
            src={iconUrl}
            alt=""
            loading="lazy"
            className={cx(
              "absolute left-0 top-0",
              shouldCropFrame
                ? "h-auto w-full max-w-none"
                : "h-full w-full object-contain",
              hasImageLoaded ? "opacity-100" : "opacity-0",
              shouldAnimateSprite ? "reward-icon-sprite" : undefined,
            )}
            style={spriteStyle}
            onLoad={handleImageLoad}
            onError={() => setHasImageError(true)}
          />
        </span>
      ) : null}
    </span>
  );
};
