import type { CSSProperties } from "react";
import { useState } from "react";

import { NikaSpinWheel } from "@/assets/images";
import type { NikaWheelReward } from "@/features/events/nika/api/nikaWheelApi";
import { RewardIcon } from "@/shared/components/RewardIcon";

type NikaWheelArenaProps = {
  rewards: NikaWheelReward[];
  activeRewardId: string | null;
  disabled: boolean;
  spinning: boolean;
  onSpin: (count: 1 | 5 | 10) => void;
};

const numberFormatter = new Intl.NumberFormat("vi-VN");

function paymentLabel(count: 1 | 5 | 10) {
  return `${count} Vé/${numberFormatter.format(count * 1_000)} Coin`;
}

export function NikaWheelArena({
  rewards,
  activeRewardId,
  disabled,
  spinning,
  onSpin,
}: NikaWheelArenaProps) {
  const [selectedCount, setSelectedCount] = useState<1 | 5 | 10>(1);

  return (
    <section aria-labelledby="nika-wheel-heading" className="nika-wheel-shell">
      <h2 id="nika-wheel-heading" className="sr-only">
        Vòng Quay Nika
      </h2>
      <div className="nika-wheel-stage" aria-label="Danh sách quà Vòng Quay Nika">
        <div className="nika-wheel-orbit" aria-hidden="true" />
        {rewards.map((reward, index) => {
          const angle = `${(index * 360) / rewards.length}deg`;
          const isActive = activeRewardId === reward.id;
          return (
            <div
              key={reward.id}
              className={`nika-wheel-prize ${isActive ? "is-active" : ""}`}
              style={{ "--nika-angle": angle } as CSSProperties}
              title={`${reward.name} x${numberFormatter.format(reward.quantity)}`}
            >
              <RewardIcon item={reward} className="nika-wheel-prize-icon" />
              <span className="nika-wheel-prize-name">{reward.name}</span>
              <span className="nika-wheel-prize-count">
                x{numberFormatter.format(reward.quantity)}
              </span>
            </div>
          );
        })}

        <button
          type="button"
          className={`nika-wheel-hub ${spinning ? "is-spinning" : ""}`}
          disabled={disabled}
          onClick={() => onSpin(selectedCount)}
          aria-label={`Quay ${selectedCount} lượt bằng ${paymentLabel(selectedCount)}`}
        >
          <img
            src={NikaSpinWheel}
            alt=""
            aria-hidden="true"
            className="nika-wheel-hub-image"
          />
        </button>
      </div>

      <div className="mx-auto mt-4 grid max-w-xl grid-cols-3 gap-2">
        {([1, 5, 10] as const).map((count) => (
          <button
            key={count}
            type="button"
            disabled={disabled}
            onClick={() => setSelectedCount(count)}
            aria-pressed={selectedCount === count}
            className={`min-h-[52px] rounded-lg border px-2 py-2 text-center shadow-sm transition hover:-translate-y-0.5 active:translate-y-px disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 motion-reduce:transition-none ${
              selectedCount === count
                ? "border-amber-600 bg-amber-600 text-white shadow-[0_8px_18px_rgba(180,83,9,0.18)]"
                : "border-amber-300 bg-white text-amber-800 hover:border-amber-400 hover:bg-amber-50"
            }`}
          >
            <strong className="block text-sm font-extrabold leading-4 sm:text-base">
              x{count}
            </strong>
            <span
              className={`mt-1 block whitespace-nowrap text-[0.55rem] font-bold sm:text-[0.65rem] ${
                selectedCount === count ? "text-amber-100" : "text-amber-600"
              }`}
            >
              {paymentLabel(count)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
