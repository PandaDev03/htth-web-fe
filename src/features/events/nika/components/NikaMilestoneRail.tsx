import { CheckCircle2, Gift, Loader2, LockKeyhole } from "lucide-react";

import type { NikaMilestone } from "@/features/events/nika/api/nikaWheelApi";
import { RewardIcon } from "@/shared/components/RewardIcon";

type NikaMilestoneRailProps = {
  milestones: NikaMilestone[];
  totalSpins: number;
  claimingId: number | null;
  onClaim: (milestoneId: number) => void;
};

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function NikaMilestoneRail({
  milestones,
  totalSpins,
  claimingId,
  onClaim,
}: NikaMilestoneRailProps) {
  return (
    <section aria-labelledby="nika-milestones-heading" className="mt-16">
      <div className="max-w-2xl">
        <h2
          id="nika-milestones-heading"
          className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
        >
          Quà tích lũy lượt quay
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Mỗi lượt dùng Vé hoặc webCoin đều được cộng vào tiến trình.
        </p>
      </div>

      <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {milestones.map((milestone) => {
          const claiming = claimingId === milestone.id;
          const locked = totalSpins < milestone.target;
          return (
            <article
              key={milestone.id}
              className="min-w-[250px] snap-start rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(120,53,15,0.06)] sm:min-w-[280px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-amber-700">Mốc quay</p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                    {numberFormatter.format(milestone.target)}
                  </p>
                </div>
                {milestone.claimed ? (
                  <CheckCircle2 className="text-emerald-600" size={21} />
                ) : locked ? (
                  <LockKeyhole className="text-slate-400" size={20} />
                ) : (
                  <Gift className="text-amber-700" size={21} />
                )}
              </div>

              <div className="mt-4 space-y-2">
                {milestone.rewards.map((reward) => (
                  <div key={reward.id} className="flex items-center gap-3">
                    <RewardIcon item={reward} className="h-11 w-11" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-bold leading-5 text-slate-700">
                        {reward.name}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">
                        x{numberFormatter.format(reward.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onClaim(milestone.id)}
                disabled={!milestone.claimable || claimingId !== null}
                className={`mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition active:translate-y-px disabled:cursor-not-allowed motion-reduce:transition-none ${
                  milestone.claimed
                    ? "bg-emerald-50 text-emerald-700"
                    : milestone.claimable
                      ? "bg-amber-700 text-white hover:bg-amber-800"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {claiming ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : milestone.claimed ? (
                  <CheckCircle2 size={16} />
                ) : locked ? (
                  <LockKeyhole size={15} />
                ) : (
                  <Gift size={16} />
                )}
                {claiming
                  ? "Đang nhận"
                  : milestone.claimed
                    ? "Đã nhận"
                    : locked
                      ? `Còn ${numberFormatter.format(milestone.target - totalSpins)} lượt`
                      : "Nhận quà"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
