import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  Gift,
  Loader2,
  LockKeyhole,
  Package,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  claimCoinMilestone,
  type CoinMilestone,
  type CoinMilestoneReward,
} from "@/features/coin/api/coinApi";

type CoinMilestonePanelProps = {
  milestone: CoinMilestone | null;
  onClaimed: () => Promise<unknown>;
};

const formatNumber = (value: number) => value.toLocaleString("vi-VN");

function RewardIcon({ reward }: { reward: CoinMilestoneReward }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-amber-50 text-amber-600">
      {reward.icon_url && !failed ? (
        <img
          src={reward.icon_url}
          alt={reward.name}
          className="h-full w-full object-contain p-1"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Package size={18} aria-hidden="true" />
      )}
    </div>
  );
}

export function CoinMilestonePanel({
  milestone,
  onClaimed,
}: CoinMilestonePanelProps) {
  const mutation = useMutation({
    mutationFn: claimCoinMilestone,
    onSuccess: async (result) => {
      toast.success(result.message || "Đã gửi yêu cầu nhận quà.");
      await onClaimed();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Không thể nhận mốc quà.",
      ),
  });

  if (!milestone) {
    return (
      <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <Gift size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-700">
              Tích lũy Đổi Coin
            </h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Hiện chưa có mùa tích lũy đang diễn ra.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const nextTarget = milestone.next_milestone;
  const allCompleted = nextTarget === null;

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
      <div className="border-b border-amber-100 bg-amber-50/70 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Trophy size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="break-words text-sm font-bold text-gray-800">
                {milestone.season.name || "Tích lũy Đổi Coin"}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Clock3 size={13} aria-hidden="true" />
                Đến {new Date(milestone.season.end_at).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[11px] font-medium text-gray-500">Đã đổi</p>
            <p className="mt-0.5 text-lg font-extrabold text-amber-700">
              {formatNumber(milestone.total_exchanged)}
              <span className="ml-1 text-xs font-semibold">Coin</span>
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-medium text-gray-500">
            <span>{allCompleted ? "Đã hoàn thành mọi mốc" : "Mốc tiếp theo"}</span>
            <span>
              {allCompleted
                ? "100%"
                : `${formatNumber(milestone.total_exchanged)} / ${formatNumber(nextTarget ?? 0)} Coin`}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-amber-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={allCompleted ? 100 : milestone.progress_percent}
          >
            <div
              className="h-full rounded-full bg-amber-500 transition-[width] duration-300"
              style={{
                width: `${allCompleted ? 100 : milestone.progress_percent}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-5">
          {milestone.tiers.map((tier) => {
            const claiming =
              mutation.isPending && mutation.variables === tier.tier_id;
            return (
              <div
                key={tier.tier_id}
                className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Mốc quà</p>
                    <p className="mt-0.5 text-base font-extrabold text-gray-800">
                      {formatNumber(tier.milestone)} Coin
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => mutation.mutate(tier.tier_id)}
                    disabled={!tier.claimable || mutation.isPending}
                    className={
                      "flex min-w-24 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition active:scale-[0.98] disabled:cursor-not-allowed " +
                      (tier.claimed
                        ? "bg-green-50 text-green-700"
                        : tier.claimable
                          ? "bg-amber-700 text-white hover:bg-amber-800"
                          : "bg-gray-100 text-gray-500")
                    }
                  >
                    {claiming ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : tier.claimed ? (
                      <CheckCircle2 size={14} aria-hidden="true" />
                    ) : tier.claimable ? (
                      <Gift size={14} aria-hidden="true" />
                    ) : (
                      <LockKeyhole size={14} aria-hidden="true" />
                    )}
                    {claiming
                      ? "Đang nhận"
                      : tier.claimed
                        ? "Đã nhận"
                        : tier.claimable
                          ? "Nhận quà"
                          : "Chưa đạt"}
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {tier.rewards.map((reward, rewardIndex) => (
                    <div
                      key={`${reward.item_type}:${reward.item_id}:${rewardIndex}`}
                      className="flex min-w-0 items-center gap-2.5"
                    >
                      <RewardIcon reward={reward} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-700">
                          {reward.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          Số lượng: {formatNumber(reward.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
