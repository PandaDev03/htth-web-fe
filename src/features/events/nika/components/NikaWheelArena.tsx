import { Coins, Sparkles, Ticket } from "lucide-react";
import type { CSSProperties } from "react";

import type {
  NikaWallet,
  NikaWheelReward,
} from "@/features/events/nika/api/nikaWheelApi";
import { RewardIcon } from "@/shared/components/RewardIcon";

type NikaWheelArenaProps = {
  rewards: NikaWheelReward[];
  wallet: NikaWallet;
  activeRewardId: string | null;
  disabled: boolean;
  onSpin: (count: 1 | 5 | 10) => void;
};

const numberFormatter = new Intl.NumberFormat("vi-VN");

function paymentLabel(wallet: NikaWallet, count: 1 | 5 | 10) {
  const tickets = Math.min(wallet.nikaTickets, count);
  const coin = (count - tickets) * 1_000;
  if (tickets === count) return `${count} Vé`;
  if (tickets === 0) return `${numberFormatter.format(coin)} webCoin`;
  return `${tickets} Vé + ${numberFormatter.format(coin)} webCoin`;
}

export function NikaWheelArena({
  rewards,
  wallet,
  activeRewardId,
  disabled,
  onSpin,
}: NikaWheelArenaProps) {
  return (
    <section aria-labelledby="nika-wheel-heading" className="nika-wheel-shell">
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

        <div className="nika-wheel-hub">
          <span className="nika-wheel-sun" aria-hidden="true">
            <Sparkles size={32} strokeWidth={1.8} />
          </span>
          <h2 id="nika-wheel-heading">NIKA</h2>
          <p>Chạm vận may</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {([1, 5, 10] as const).map((count) => (
          <button
            key={count}
            type="button"
            disabled={disabled}
            onClick={() => onSpin(count)}
            className="group min-h-[76px] rounded-xl border border-amber-300 bg-amber-600 px-4 py-3 text-left text-white shadow-[0_10px_24px_rgba(180,83,9,0.16)] transition hover:-translate-y-0.5 hover:bg-amber-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            <span className="flex items-center justify-between gap-3">
              <strong className="text-xl font-extrabold">Quay X{count}</strong>
              {wallet.nikaTickets > 0 ? (
                <Ticket size={20} aria-hidden="true" />
              ) : (
                <Coins size={20} aria-hidden="true" />
              )}
            </span>
            <span className="mt-1 block text-xs font-semibold text-amber-100">
              {paymentLabel(wallet, count)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
