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

      <div className="mt-6 space-y-3">
        {milestones.map((milestone) => {
          const claiming = claimingId === milestone.id;
          const locked = totalSpins < milestone.target;
          return (
            <article
              key={milestone.id}
              className={`grid gap-4 rounded-2xl border border-l-4 bg-white p-4 shadow-[0_10px_28px_rgba(120,53,15,0.05)] sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center sm:gap-5 lg:grid-cols-[10rem_minmax(0,1fr)_11rem] lg:px-5 ${
                milestone.claimed
                  ? "border-emerald-200 border-l-emerald-500"
                  : milestone.claimable
                    ? "border-amber-200 border-l-amber-500 bg-amber-50/35"
                    : "border-slate-200 border-l-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                    milestone.claimed
                      ? "bg-emerald-50 text-emerald-600"
                      : milestone.claimable
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-400"
                  }`}
                  aria-hidden="true"
                >
                  {milestone.claimed ? (
                    <CheckCircle2 size={20} />
                  ) : locked ? (
                    <LockKeyhole size={18} />
                  ) : (
                    <Gift size={20} />
                  )}
                </span>
                <div>
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-amber-700">
                    Mốc tích lũy
                  </p>
                  <p className="mt-0.5 text-xl font-extrabold tabular-nums text-slate-900">
                    {numberFormatter.format(milestone.target)}
                    <span className="ml-1 text-xs font-bold text-slate-400">
                      lượt
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {milestone.rewards.map((reward) => (
                  <div key={reward.id} className="flex min-w-0 items-center gap-3">
                    <RewardIcon item={reward} className="h-10 w-10 shrink-0" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-bold leading-4 text-slate-700">
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
                className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition active:translate-y-px disabled:cursor-not-allowed motion-reduce:transition-none sm:col-start-2 sm:w-auto sm:justify-self-start lg:col-start-auto lg:w-full lg:justify-self-stretch ${
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
