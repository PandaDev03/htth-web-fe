import { Flame, Sparkles, Target, UsersRound } from "lucide-react";

export type FireworksEventProgress = {
  current: number;
  target: number;
  participants: number;
  nextMilestone: number;
};

type FireworksEventPanelProps = {
  progress: FireworksEventProgress;
};

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function FireworksEventPanel({
  progress,
}: FireworksEventPanelProps) {
  const percentage = Math.min(
    100,
    Math.max(0, (progress.current / progress.target) * 100),
  );
  const remaining = Math.max(0, progress.target - progress.current);
  const nextMilestoneRemaining = Math.max(
    0,
    progress.nextMilestone - progress.current,
  );

  return (
    <section
      className="my-10 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white shadow-[0_16px_48px_rgba(146,64,14,0.08)]"
      aria-labelledby="fireworks-progress-heading"
    >
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                Sự kiện toàn server
              </p>
              <h2
                id="fireworks-progress-heading"
                className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl"
              >
                Cùng nhau thắp sáng Grand Line
              </h2>
            </div>
          </div>
          <span className="self-start rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-700">
            Bản xem trước UI
          </span>
        </div>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Flame size={16} className="text-amber-600" />
              Pháo đã đốt toàn server
            </p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 sm:text-4xl">
              {numberFormatter.format(progress.current)}
              <span className="ml-2 text-base font-semibold text-slate-400">
                / {numberFormatter.format(progress.target)}
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
          aria-label="Tiến độ đốt pháo toàn server"
          aria-valuemin={0}
          aria-valuemax={progress.target}
          aria-valuenow={progress.current}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-[width] duration-700"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Target size={15} className="shrink-0 text-amber-600" />
          Còn {numberFormatter.format(nextMilestoneRemaining)} pháo để chạm mốc
          {" "}
          {numberFormatter.format(progress.nextMilestone)}.
        </p>
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
            {numberFormatter.format(remaining)} pháo
          </p>
        </div>
        <div className="border-t border-amber-100 px-5 py-4 sm:border-t-0 sm:px-7">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <UsersRound size={13} /> Hải tặc tham gia
          </p>
          <p className="mt-1 font-extrabold tabular-nums text-slate-800">
            {numberFormatter.format(progress.participants)}
          </p>
        </div>
      </div>
    </section>
  );
}
