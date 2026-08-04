import {
  BarChart3,
  CheckCircle2,
  Flag,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import type { ArticleProgress } from "@/features/articles/api/articleApi";
import { RewardIcon } from "@/shared/components/RewardIcon";

type ArticleProgressPanelProps = {
  progress: ArticleProgress;
};

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function ArticleProgressPanel({ progress }: ArticleProgressPanelProps) {
  const unit = progress.unit?.trim() || "lượt";
  const safeTarget = Math.max(1, progress.target);
  const safeCurrent = Math.min(progress.current, safeTarget);
  const percentage = Math.min(
    100,
    Math.max(0, (safeCurrent / safeTarget) * 100),
  );
  const remaining = Math.max(0, progress.target - progress.current);
  const nextMilestoneRemaining = progress.nextMilestone
    ? Math.max(0, progress.nextMilestone - progress.current)
    : null;
  const reachedMilestones = progress.milestones.filter(
    (milestone) => milestone.reached,
  ).length;

  return (
    <section
      className="my-10 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white shadow-[0_16px_48px_rgba(146,64,14,0.08)]"
      aria-labelledby="article-progress-heading"
    >
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                Tiến trình sự kiện
              </p>
              <h2
                id="article-progress-heading"
                className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl"
              >
                {progress.title || "Cùng nhau hoàn thành mục tiêu"}
              </h2>
            </div>
          </div>
          <span className="self-start rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-700">
            {progress.statusLabel || "Đang diễn ra"}
          </span>
        </div>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <BarChart3 size={16} className="text-amber-600" />
              {progress.currentLabel || "Đã hoàn thành"}
            </p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 sm:text-4xl">
              {numberFormatter.format(progress.current)}
              <span className="ml-2 text-base font-semibold text-slate-400">
                / {numberFormatter.format(progress.target)} {unit}
              </span>
            </p>
          </div>
          <p className="text-sm font-bold tabular-nums text-amber-700">
            {percentage.toFixed(1).replace(".", ",")}% hoàn thành
          </p>
        </div>

        <div
          className="mt-5 h-3 overflow-hidden rounded-full bg-amber-100 ring-1 ring-inset ring-amber-200"
          role="progressbar"
          aria-label="Tiến độ sự kiện"
          aria-valuemin={0}
          aria-valuemax={progress.target}
          aria-valuenow={safeCurrent}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-[width] duration-700"
            style={{ width: percentage + "%" }}
          />
        </div>

        {nextMilestoneRemaining !== null && progress.nextMilestone !== null && (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Target size={15} className="shrink-0 text-amber-600" />
            Còn {numberFormatter.format(nextMilestoneRemaining)} {unit} để
            chạm mốc {numberFormatter.format(progress.nextMilestone)}.
          </p>
        )}

        {progress.milestones.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Flag size={16} className="text-amber-600" /> Mốc tiến trình
              </p>
              <p className="text-xs font-semibold text-slate-400">
                {reachedMilestones}/{progress.milestones.length} mốc đã đạt
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {progress.milestones.map((milestone, index) => (
                <div
                  key={milestone.target}
                  className={[
                    "rounded-xl border px-3 py-3",
                    milestone.reached
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide">
                      Mốc {index + 1}
                    </span>
                    {milestone.reached && <CheckCircle2 size={15} />}
                  </div>
                  <p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">
                    {numberFormatter.format(milestone.target)}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold">
                    {milestone.reached ? "Đã đạt" : "Chưa đạt"}
                  </p>

                  {milestone.rewards.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {milestone.rewards.map((reward) => (
                        <div
                          key={reward.source + ":" + String(reward.itemId)}
                          className="flex items-center gap-2 rounded-lg border border-amber-100 bg-white px-2 py-1.5"
                          title={reward.description ?? reward.name ?? undefined}
                        >
                          <RewardIcon item={reward} className="h-10 w-10" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-700">
                              {reward.name ?? "Vật phẩm"}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500">
                              x{numberFormatter.format(reward.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid border-t border-amber-100 bg-white/70 sm:grid-cols-3 sm:divide-x sm:divide-amber-100">
        <div className="px-5 py-4 sm:px-7">
          <p className="text-xs font-semibold text-slate-400">Đã hoàn thành</p>
          <p className="mt-1 font-extrabold tabular-nums text-slate-800">
            {percentage.toFixed(1).replace(".", ",")}%
          </p>
        </div>
        <div className="border-t border-amber-100 px-5 py-4 sm:border-t-0 sm:px-7">
          <p className="text-xs font-semibold text-slate-400">Còn lại</p>
          <p className="mt-1 font-extrabold tabular-nums text-slate-800">
            {numberFormatter.format(remaining)} {unit}
          </p>
        </div>
        <div className="border-t border-amber-100 px-5 py-4 sm:border-t-0 sm:px-7">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <UsersRound size={13} /> Người tham gia
          </p>
          <p className="mt-1 font-extrabold tabular-nums text-slate-800">
            {numberFormatter.format(progress.participants)}
          </p>
        </div>
      </div>
    </section>
  );
}
