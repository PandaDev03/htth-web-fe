import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "antd";
import {
  AlertCircle,
  ArrowLeft,
  Coins,
  Gift,
  Loader2,
  RefreshCw,
  Ticket,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  claimNikaInventory,
  claimNikaMilestone,
  getNikaWheelState,
  spinNikaWheel,
  type NikaRarity,
  type NikaSpinResult,
  type NikaWheelReward,
} from "@/features/events/nika/api/nikaWheelApi";
import { NikaMilestoneRail } from "@/features/events/nika/components/NikaMilestoneRail";
import { NikaRewardInventory } from "@/features/events/nika/components/NikaRewardInventory";
import { NikaWheelArena } from "@/features/events/nika/components/NikaWheelArena";
import "@/features/events/nika/nika-wheel.css";
import { RewardIcon } from "@/shared/components/RewardIcon";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { PATH } from "@/shared/config/path";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const probabilityFormatter = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const rarityContent: Record<
  NikaRarity,
  { label: string; className: string }
> = {
  very_rare: {
    label: "Rất hiếm",
    className: "border-amber-400 bg-amber-50 text-amber-900",
  },
  rare: {
    label: "Hiếm",
    className: "border-amber-300 bg-white text-amber-800",
  },
  uncommon: {
    label: "Trung bình",
    className: "border-slate-300 bg-white text-slate-700",
  },
  common: {
    label: "Phổ biến",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

type SpinResponse = NikaSpinResult & { message: string };

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function WalletSummary({
  tickets,
  availableCoin,
  totalSpins,
}: {
  tickets: number;
  availableCoin: number;
  totalSpins: number;
}) {
  return (
    <div className="grid overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_14px_34px_rgba(120,53,15,0.07)] sm:grid-cols-3">
      <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800">
          <Ticket size={19} />
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-500">Vé Quay Nika</p>
          <p className="font-mono text-xl font-bold tabular-nums text-slate-900">
            {numberFormatter.format(tickets)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-4 sm:border-l sm:border-t-0 sm:px-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800">
          <Coins size={19} />
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-500">webCoin khả dụng</p>
          <p className="font-mono text-xl font-bold tabular-nums text-slate-900">
            {numberFormatter.format(availableCoin)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-4 sm:border-l sm:border-t-0 sm:px-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800">
          <Trophy size={19} />
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-500">Lượt tích lũy</p>
          <p className="font-mono text-xl font-bold tabular-nums text-slate-900">
            {numberFormatter.format(totalSpins)}
          </p>
        </div>
      </div>
    </div>
  );
}

function RewardPool({ rewards }: { rewards: NikaWheelReward[] }) {
  const rarityOrder: NikaRarity[] = [
    "very_rare",
    "rare",
    "uncommon",
    "common",
  ];

  return (
    <details className="mt-12 rounded-2xl border border-slate-200 bg-white p-5 open:shadow-[0_16px_38px_rgba(120,53,15,0.06)] sm:p-7">
      <summary className="cursor-pointer text-lg font-extrabold text-slate-900 marker:text-amber-600">
        Xem toàn bộ phần thưởng và tỷ lệ
      </summary>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Tỷ lệ đã được chuẩn hóa từ tổng trọng số {rewards.reduce((sum, reward) => sum + reward.weight, 0)} và giữ nguyên tương quan độ hiếm.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {rarityOrder.map((rarity) => {
          const items = rewards.filter((reward) => reward.rarity === rarity);
          const content = rarityContent[rarity];
          return (
            <section key={rarity} aria-label={content.label}>
              <h3 className="text-sm font-extrabold text-slate-800">
                {content.label}
              </h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {items.map((reward) => (
                  <div
                    key={reward.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${content.className}`}
                  >
                    <RewardIcon item={reward} className="h-11 w-11" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-bold leading-5">
                        {reward.name}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold opacity-75">
                        x{numberFormatter.format(reward.quantity)} | {probabilityFormatter.format(reward.probabilityPercent)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </details>
  );
}

function NikaWheelPage() {
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();
  const [activeRewardId, setActiveRewardId] = useState<string | null>(null);
  const [mixedCount, setMixedCount] = useState<1 | 5 | 10 | null>(null);
  const [latestSpin, setLatestSpin] = useState<SpinResponse | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeRewardTab, setActiveRewardTab] = useState<
    "inventory" | "milestones"
  >("inventory");
  const timers = useRef<number[]>([]);

  const wheelQuery = useQuery({
    queryKey: ["nika-wheel"],
    queryFn: getNikaWheelState,
  });

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    },
    [],
  );

  function wait(duration: number) {
    return new Promise<void>((resolve) => {
      const timer = window.setTimeout(resolve, duration);
      timers.current.push(timer);
    });
  }

  async function animateToReward(results: SpinResponse["results"]) {
    const rewards = wheelQuery.data?.rewards ?? [];
    const target = results[results.length - 1];
    const targetIndex = rewards.findIndex((reward) => reward.id === target?.id);
    if (!target || targetIndex < 0) return;

    if (reducedMotion) {
      setActiveRewardId(target.id);
      return;
    }

    setIsAnimating(true);
    const totalSteps = rewards.length * 2 + targetIndex + 1;
    for (let step = 0; step < totalSteps; step += 1) {
      setActiveRewardId(rewards[step % rewards.length].id);
      const remaining = totalSteps - step;
      await wait(remaining < 8 ? 105 : 42);
    }
    setIsAnimating(false);
  }

  const spinMutation = useMutation({
    mutationFn: ({
      count,
      confirmMixedPayment,
    }: {
      count: 1 | 5 | 10;
      confirmMixedPayment: boolean;
    }) => spinNikaWheel(count, confirmMixedPayment),
  });

  const claimMutation = useMutation({
    mutationFn: claimNikaMilestone,
    onSuccess: async (result) => {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: ["nika-wheel"] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Không thể nhận mốc quà.",
      ),
  });

  const inventoryClaimMutation = useMutation({
    mutationFn: claimNikaInventory,
    onSuccess: async (result) => {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: ["nika-wheel"] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Không thể nhận Kho quà.",
      ),
  });

  async function executeSpin(
    count: 1 | 5 | 10,
    confirmMixedPayment: boolean,
  ) {
    try {
      const result = await spinMutation.mutateAsync({
        count,
        confirmMixedPayment,
      });
      await animateToReward(result.results);
      setLatestSpin(result);
      setActiveRewardTab("inventory");
      setResultOpen(true);
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: ["nika-wheel"] });
    } catch (error) {
      setIsAnimating(false);
      if (
        !confirmMixedPayment &&
        error instanceof Error &&
        error.message.includes("Vé Quay Nika")
      ) {
        await wheelQuery.refetch();
        setMixedCount(count);
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Không thể thực hiện lượt quay.",
      );
    }
  }

  function requestSpin(count: 1 | 5 | 10) {
    const wallet = wheelQuery.data?.wallet;
    if (!wallet) return;
    if (wallet.tickets > 0 && wallet.tickets < count) {
      setMixedCount(count);
      return;
    }
    void executeSpin(count, false);
  }

  const state = wheelQuery.data;
  const wheelBusy = spinMutation.isPending || isAnimating;
  const mixedTickets = mixedCount
    ? Math.min(state?.wallet.tickets ?? 0, mixedCount)
    : 0;
  const mixedCoin = mixedCount ? (mixedCount - mixedTickets) * 1_000 : 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50">
      <Header />
      <main className="flex-1 px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            to={PATH.ARTICLES}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-amber-700 motion-reduce:transition-none"
          >
            <ArrowLeft size={16} /> Về trang Bài viết
          </Link>

          <header className="mt-8 grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Sự kiện đặc biệt
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Vòng Quay Nika
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">
                Dùng Vé Quay Nika hoặc webCoin để nhận quà và mở khóa mốc tích lũy.
              </p>
            </div>
            {state && (
              <WalletSummary
                tickets={state.wallet.tickets}
                availableCoin={state.wallet.availableWebCoin}
                totalSpins={state.progress.totalSpins}
              />
            )}
          </header>

          {wheelQuery.isLoading && (
            <div className="mt-10 animate-pulse rounded-2xl border border-amber-100 bg-white p-6">
              <div className="mx-auto aspect-square max-w-[680px] rounded-full bg-amber-50" />
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-[76px] rounded-xl bg-slate-100" />
                ))}
              </div>
            </div>
          )}

          {wheelQuery.isError && (
            <div className="mt-10 flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
              <AlertCircle size={34} className="text-red-500" />
              <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                Không thể tải sự kiện
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                {wheelQuery.error instanceof Error
                  ? wheelQuery.error.message
                  : "Dữ liệu Vòng Quay Nika chưa sẵn sàng."}
              </p>
              <button
                type="button"
                onClick={() => void wheelQuery.refetch()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-800 active:translate-y-px motion-reduce:transition-none"
              >
                <RefreshCw size={15} /> Thử lại
              </button>
            </div>
          )}

          {state && (
            <>
              {!state.player && (
                <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  <AlertCircle size={19} className="mt-0.5 shrink-0" />
                  <p>
                    Tài khoản chưa có nhân vật game. Hãy tạo nhân vật trước khi quay và nhận quà.
                  </p>
                </div>
              )}

              <div className="mt-10">
                <NikaWheelArena
                  rewards={state.rewards}
                  wallet={state.wallet}
                  activeRewardId={activeRewardId}
                  disabled={wheelBusy || !state.player}
                  onSpin={requestSpin}
                />
              </div>

              <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
                Ưu tiên dùng Vé. Khi thiếu Vé, hệ thống sẽ hỏi trước khi dùng webCoin cho lượt còn thiếu.
              </p>

              <section id="nika-reward-tabs" className="mt-14">
                <div
                  role="tablist"
                  aria-label="Quà Vòng Quay Nika"
                  className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeRewardTab === "inventory"}
                    onClick={() => setActiveRewardTab("inventory")}
                    className={`min-h-10 rounded-lg px-4 text-sm font-bold transition motion-reduce:transition-none ${
                      activeRewardTab === "inventory"
                        ? "bg-amber-700 text-white"
                        : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"
                    }`}
                  >
                    Kho quà ({state.inventory.distinctItems})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeRewardTab === "milestones"}
                    onClick={() => setActiveRewardTab("milestones")}
                    className={`min-h-10 rounded-lg px-4 text-sm font-bold transition motion-reduce:transition-none ${
                      activeRewardTab === "milestones"
                        ? "bg-amber-700 text-white"
                        : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"
                    }`}
                  >
                    Mốc tích lũy
                  </button>
                </div>

                {activeRewardTab === "inventory" ? (
                  <div role="tabpanel">
                    <NikaRewardInventory
                      items={state.inventory.items}
                      totalQuantity={state.inventory.totalQuantity}
                      isClaiming={inventoryClaimMutation.isPending}
                      onClaimAll={() => inventoryClaimMutation.mutate()}
                    />
                  </div>
                ) : (
                  <div role="tabpanel">
                    <NikaMilestoneRail
                      milestones={state.milestones}
                      totalSpins={state.progress.totalSpins}
                      claimingId={
                        claimMutation.isPending
                          ? (claimMutation.variables ?? null)
                          : null
                      }
                      onClaim={(milestoneId) =>
                        claimMutation.mutate(milestoneId)
                      }
                    />
                  </div>
                )}
              </section>

              <RewardPool rewards={state.rewards} />
            </>
          )}
        </div>
      </main>
      <Footer />

      <Modal
        open={mixedCount !== null}
        title="Kết hợp Vé và webCoin"
        okText="Xác nhận quay"
        cancelText="Quay lại"
        centered
        confirmLoading={spinMutation.isPending}
        onCancel={() => setMixedCount(null)}
        onOk={() => {
          if (!mixedCount) return;
          const count = mixedCount;
          setMixedCount(null);
          void executeSpin(count, true);
        }}
      >
        <p className="leading-7 text-slate-600">
          Bạn hiện có {mixedTickets}/{mixedCount ?? 0} Vé Quay Nika. Hệ thống sẽ dùng {mixedTickets} Vé và {numberFormatter.format(mixedCoin)} webCoin cho lượt còn thiếu. Tiếp tục quay?
        </p>
      </Modal>

      <Modal
        open={resultOpen}
        title={`Kết quả ${latestSpin?.results.length ?? 0} lượt quay`}
        footer={null}
        centered
        width={720}
        onCancel={() => setResultOpen(false)}
      >
        {latestSpin && (
          <>
            <div className="grid max-h-[55vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {latestSpin.results.map((reward, index) => (
                <div
                  key={`${latestSpin.requestId}:${index}`}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${rarityContent[reward.rarity].className}`}
                >
                  <RewardIcon item={reward} className="h-12 w-12" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold opacity-70">
                      {rarityContent[reward.rarity].label}
                    </p>
                    <p className="line-clamp-2 text-sm font-extrabold leading-5">
                      {reward.name}
                    </p>
                    <p className="text-xs font-bold opacity-75">
                      x{numberFormatter.format(reward.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <Gift size={18} className="mt-0.5 shrink-0" />
              <p>
                Quà đã được lưu vào Kho quà. GiftBox chỉ được tạo khi bạn bấm Nhận tất cả.
              </p>
            </div>
          </>
        )}
      </Modal>

      {wheelBusy && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 mx-auto flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl">
          <Loader2 size={16} className="animate-spin" />
          {spinMutation.isPending ? "Đang xác nhận lượt quay" : "Vòng quay đang chạy"}
        </div>
      )}
    </div>
  );
}

export default NikaWheelPage;
