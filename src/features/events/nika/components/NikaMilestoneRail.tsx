import { CheckCircle2, Gift, Loader2, LockKeyhole } from "lucide-react";
import type { CSSProperties } from "react";

import type { NikaMilestone } from "@/features/events/nika/api/nikaWheelApi";
import { RewardIcon } from "@/shared/components/RewardIcon";

type NikaMilestoneRailProps = {
  milestones: NikaMilestone[];
  totalSpins: number;
  claimingId: number | null;
  onClaim: (milestoneId: number) => void;
};

const numberFormatter = new Intl.NumberFormat("vi-VN");

function getProgressPercent(milestones: NikaMilestone[], totalSpins: number) {
  if (milestones.length === 0) return 0;
  if (milestones.length === 1) {
    return Math.min(100, (totalSpins / milestones[0].target) * 100);
  }

  const firstTarget = milestones[0].target;
  const lastTarget = milestones[milestones.length - 1].target;
  if (totalSpins <= firstTarget) return 0;
  if (totalSpins >= lastTarget) return 100;

  const nextIndex = milestones.findIndex(
    (milestone) => milestone.target > totalSpins,
  );
  const previousIndex = Math.max(0, nextIndex - 1);
  const previousTarget = milestones[previousIndex].target;
  const nextTarget = milestones[nextIndex].target;
  const segmentProgress =
    (totalSpins - previousTarget) / (nextTarget - previousTarget);

  return ((previousIndex + segmentProgress) / (milestones.length - 1)) * 100;
}

export function NikaMilestoneRail({
  milestones,
  totalSpins,
  claimingId,
  onClaim,
}: NikaMilestoneRailProps) {
  const orderedMilestones = [...milestones].sort(
    (left, right) => left.target - right.target,
  );
  const nextMilestone = orderedMilestones.find(
    (milestone) => milestone.target > totalSpins,
  );
  const reachedCount = orderedMilestones.filter(
    (milestone) => totalSpins >= milestone.target,
  ).length;
  const progressPercent = getProgressPercent(orderedMilestones, totalSpins);
  const milestoneCount = Math.max(orderedMilestones.length, 1);
  const trackInset = `${50 / milestoneCount}%`;
  const progressStyle = {
    width: `${progressPercent}%`,
  } satisfies CSSProperties;

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

      {orderedMilestones.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500">
          Chưa có mốc tích lũy cho sự kiện này.
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-white p-5 shadow-[0_12px_32px_rgba(120,53,15,0.06)] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500">
                  Tiến độ hiện tại
                </p>
                <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-slate-900">
                  {numberFormatter.format(totalSpins)}
                  <span className="ml-1.5 font-sans text-xs font-bold text-slate-400">
                    lượt quay
                  </span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-bold text-amber-700">
                  {reachedCount}/{orderedMilestones.length} mốc đã mở
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {nextMilestone
                    ? `Còn ${numberFormatter.format(nextMilestone.target - totalSpins)} lượt đến mốc ${numberFormatter.format(nextMilestone.target)}`
                    : "Đã hoàn thành toàn bộ mốc lượt quay"}
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto pb-2">
              <div
                className="relative w-full"
                style={{ minWidth: `${Math.max(640, milestoneCount * 104)}px` }}
              >
                <div
                  className="absolute top-[0.875rem] h-1 overflow-hidden rounded-full bg-slate-200"
                  style={{ left: trackInset, right: trackInset }}
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-amber-500 transition-[width] duration-300 motion-reduce:transition-none"
                    style={progressStyle}
                  />
                </div>

                <div
                  className="relative grid"
                  style={{
                    gridTemplateColumns: `repeat(${milestoneCount}, minmax(0, 1fr))`,
                  }}
                  role="progressbar"
                  aria-label="Tiến độ mốc tích lũy lượt quay"
                  aria-valuemin={0}
                  aria-valuemax={
                    orderedMilestones[orderedMilestones.length - 1].target
                  }
                  aria-valuenow={Math.min(
                    totalSpins,
                    orderedMilestones[orderedMilestones.length - 1].target,
                  )}
                >
                  {orderedMilestones.map((milestone) => {
                    const locked = totalSpins < milestone.target;
                    return (
                      <div
                        key={milestone.id}
                        className="flex min-w-0 flex-col items-center px-1 text-center"
                      >
                        <span
                          className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 bg-white ${
                            milestone.claimed
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : milestone.claimable
                                ? "border-amber-600 bg-amber-600 text-white ring-4 ring-amber-100"
                                : "border-slate-300 text-slate-400"
                          }`}
                          aria-hidden="true"
                        >
                          {milestone.claimed ? (
                            <CheckCircle2 size={16} />
                          ) : milestone.claimable ? (
                            <Gift size={15} />
                          ) : (
                            <LockKeyhole size={13} />
                          )}
                        </span>
                        <p
                          className={`mt-2 whitespace-nowrap text-xs font-extrabold tabular-nums ${
                            locked ? "text-slate-500" : "text-amber-700"
                          }`}
                        >
                          {numberFormatter.format(milestone.target)}
                        </p>
                        <p className="mt-0.5 text-[0.65rem] font-semibold text-slate-400">
                          lượt
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orderedMilestones.map((milestone) => {
              const claiming = claimingId === milestone.id;
              const locked = totalSpins < milestone.target;
              return (
                <article
                  key={milestone.id}
                  className={`flex h-full flex-col rounded-2xl border bg-white p-4 shadow-[0_10px_28px_rgba(120,53,15,0.05)] ${
                    milestone.claimed
                      ? "border-emerald-300"
                      : milestone.claimable
                        ? "border-amber-400 bg-amber-50/35"
                        : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-amber-700">
                        Mốc tích lũy
                      </p>
                      <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">
                        {numberFormatter.format(milestone.target)}
                        <span className="ml-1 text-xs font-bold text-slate-400">
                          lượt
                        </span>
                      </p>
                    </div>
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
                  </div>

                  <div className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
                    {milestone.rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex min-w-0 items-center gap-3 py-3"
                      >
                        <RewardIcon
                          item={reward}
                          className="h-11 w-11 shrink-0"
                        />
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

                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={() => onClaim(milestone.id)}
                      disabled={!milestone.claimable || claimingId !== null}
                      className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition active:translate-y-px disabled:cursor-not-allowed motion-reduce:transition-none ${
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
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
