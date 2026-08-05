import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  Flame,
  Gift,
  Medal,
  RefreshCw,
  ShieldAlert,
  Swords,
  Trophy,
} from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import {
  getTopBossHuntRanking,
  getTopDepositRanking,
  getTopFireworksRanking,
  type RankingRewardSet,
  type RankingRewardTier,
} from "@/features/ranking/api/rankingApi";
import {
  RankingTabs,
  type RankingTabId,
} from "@/features/ranking/components/RankingTabs";
import { RewardIcon } from "@/shared/components/RewardIcon";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { scrollToTop } from "@/shared/utils/utils";

const fireworksRankingQueryKey = ["rankings", "top-fireworks"] as const;
const bossHuntRankingQueryKey = ["rankings", "top-boss-hunt"] as const;
const topDepositRankingQueryKey = ["rankings", "top-deposits"] as const;

type DisplayRankingEntry = {
  rank: number;
  name: string;
  subtitle?: string;
  value: number;
};

function formatPoints(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatUpdatedAt(value?: string) {
  if (!value) return "Chưa cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  }).format(new Date(value));
}

function getInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || "P";
}

function RewardTierCard({ tier }: { tier: RankingRewardTier }) {
  return (
    <article className="rounded-lg border p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-800 text-gray-800">{tier.rankLabel}</h3>
        <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-amber-600 shadow-sm">
          {tier.items.length} món
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {tier.items.map((item, index) => (
          <li
            key={[
              tier.rankLabel,
              item.source ?? "reward",
              item.itemId ?? item.name,
              index,
            ].join("-")}
            className="flex min-w-0 items-center gap-3"
            title={item.description ?? item.name}
          >
            <RewardIcon item={item} />
            <span className="min-w-0 text-sm font-semibold leading-snug text-gray-700">
              {item.quantity && (
                <span className="mr-1 font-mono text-amber-600">
                  {item.quantity}
                </span>
              )}
              {item.name}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function RankingRewards({ rewards }: { rewards: RankingRewardSet }) {
  return (
    <section className="mb-8 overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 px-5 py-5 sm:px-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
          <Gift size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-800 text-gray-800">{rewards.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
            {rewards.description}
          </p>
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        {rewards.tiers.map((tier) => (
          <RewardTierCard key={tier.rankLabel} tier={tier} />
        ))}
      </div>
    </section>
  );
}

function PodiumCard({
  entry,
  valueLabel,
}: {
  entry: DisplayRankingEntry;
  valueLabel: string;
}) {
  const isChampion = entry.rank === 1;
  const placement =
    entry.rank === 1
      ? "md:col-start-2 md:row-start-1"
      : entry.rank === 2
        ? "md:col-start-1 md:row-start-1 md:mt-10"
        : "md:col-start-3 md:row-start-1 md:mt-10";

  return (
    <article
      className={
        placement +
        " rounded-lg border p-5 transition-transform duration-200 hover:-translate-y-1 " +
        (isChampion
          ? "border-amber-300 bg-amber-50 shadow-[0_18px_45px_rgba(180,120,20,0.14)]"
          : "border-gray-200 bg-white shadow-sm")
      }
    >
      <div className="mb-5 flex items-start justify-between">
        <div
          className={
            "flex h-12 w-12 items-center justify-center rounded-lg text-lg font-800 " +
            (isChampion
              ? "bg-amber-500 text-white"
              : entry.rank === 2
                ? "bg-slate-200 text-slate-700"
                : "bg-orange-100 text-orange-700")
          }
          aria-hidden="true"
        >
          {getInitial(entry.name)}
        </div>
        <div
          className={
            "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-mono text-sm font-bold " +
            (isChampion
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-600")
          }
        >
          #{entry.rank}
        </div>
      </div>
      <div className="mb-4 flex items-start gap-2">
        {isChampion ? (
          <Crown size={18} className="text-amber-500" aria-hidden="true" />
        ) : (
          <Medal size={18} className="text-gray-400" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-gray-800">
            {entry.name}
          </h2>
          {entry.subtitle && (
            <p className="mt-0.5 truncate text-xs text-gray-400">
              Tài khoản: {entry.subtitle}
            </p>
          )}
        </div>
      </div>
      <p className="font-mono text-2xl font-bold text-amber-600">
        {formatPoints(entry.value)}
      </p>
      <p className="mt-1 text-xs font-medium text-gray-400">{valueLabel}</p>
    </article>
  );
}

function RankingSkeleton() {
  return (
    <div aria-label="Đang tải bảng xếp hạng" aria-busy="true">
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-52 animate-pulse rounded-lg border border-gray-200 bg-white p-5"
          >
            <div className="mb-8 h-12 w-12 rounded-lg bg-gray-100" />
            <div className="mb-3 h-5 w-32 rounded bg-gray-100" />
            <div className="h-8 w-40 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="grid grid-cols-[3.5rem_1fr_7rem] items-center gap-3 border-b border-gray-100 px-4 py-4 last:border-0"
          >
            <div className="h-5 w-7 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
            <div className="ml-auto h-5 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RemainingRanking({ entries }: { entries: DisplayRankingEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
        <h2 className="text-base font-bold text-gray-800">
          Các hạng tiếp theo
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
            <tr>
              <th scope="col" className="w-24 px-6 py-3">
                Hạng
              </th>
              <th scope="col" className="px-6 py-3">
                Nhân vật
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Điểm
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <tr
                key={entry.rank}
                className="transition-colors hover:bg-amber-50/50"
              >
                <td className="px-6 py-4 font-mono text-sm font-bold text-gray-500">
                  #{entry.rank}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600">
                      {getInitial(entry.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-gray-700">
                        {entry.name}
                      </span>
                      {entry.subtitle && (
                        <span className="mt-0.5 block truncate text-xs text-gray-400">
                          Tài khoản: {entry.subtitle}
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm font-bold text-amber-600">
                  {formatPoints(entry.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RankingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: RankingTabId =
    searchParams.get("tab") === "san-boss"
      ? "boss"
      : searchParams.get("tab") === "top-nap"
        ? "deposit"
        : "fireworks";
  const showBossHunt = activeTab === "boss";
  const showDeposit = activeTab === "deposit";
  const topDepositRankingQuery = useQuery({
    queryKey: topDepositRankingQueryKey,
    queryFn: getTopDepositRanking,
    staleTime: 60_000,
    enabled: showDeposit,
  });
  const fireworksRankingQuery = useQuery({
    queryKey: fireworksRankingQueryKey,
    queryFn: getTopFireworksRanking,
    staleTime: 60_000,
    enabled: !showBossHunt && !showDeposit,
  });
  const bossHuntRankingQuery = useQuery({
    queryKey: bossHuntRankingQueryKey,
    queryFn: getTopBossHuntRanking,
    staleTime: 60_000,
    enabled: showBossHunt,
  });

  useEffect(() => {
    scrollToTop({ behavior: "smooth" });
  }, []);

  const rankingQuery = showDeposit
    ? topDepositRankingQuery
    : showBossHunt
      ? bossHuntRankingQuery
      : fireworksRankingQuery;
  const depositEntries: DisplayRankingEntry[] = (
    topDepositRankingQuery.data?.items ?? []
  ).map((entry) => ({
    rank: entry.rank,
    name: entry.playerName || entry.username,
    subtitle: entry.playerName ? entry.username : undefined,
    value: entry.tongnap,
  }));
  const eventItems = showBossHunt
    ? bossHuntRankingQuery.data?.items
    : fireworksRankingQuery.data?.items;
  const eventEntries: DisplayRankingEntry[] = (eventItems ?? []).map(
    (entry) => ({
      rank: entry.rank,
      name: entry.playerName,
      subtitle: entry.accountUsername,
      value: entry.points,
    }),
  );
  const entries = showDeposit ? depositEntries : eventEntries;
  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);
  const currentRewards = rankingQuery.data?.rewards;
  const pageTitle = showDeposit
    ? "Top Nạp"
    : showBossHunt
      ? "Top Săn Boss"
      : "Top Đốt Pháo";
  const pageDescription = showDeposit
    ? "Vinh danh thuyền trưởng có tổng nạp mùa hiện tại cao nhất."
    : showBossHunt
      ? "Vinh danh những thuyền trưởng hạ gục nhiều boss Lân Sư Vũ nhất."
      : "Vinh danh những thuyền trưởng có điểm Đốt pháo cao nhất event Pháo hoa.";
  const valueLabel = showDeposit
    ? "Coin nạp"
    : showBossHunt
      ? "Điểm săn boss"
      : "Điểm Đốt pháo";
  const contextLabel = showDeposit
    ? topDepositRankingQuery.data?.season?.name || "Theo mùa"
    : "Event 12";

  const changeTab = (nextTab: RankingTabId) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextTab === "boss") {
      nextParams.set("tab", "san-boss");
    } else if (nextTab === "deposit") {
      nextParams.set("tab", "top-nap");
    } else {
      nextParams.delete("tab");
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pb-16 pt-16">
        <section className="border-b border-amber-100 bg-amber-50">
          <div className="mx-auto grid max-w-screen-xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600">
                <Trophy size={15} aria-hidden="true" />
                {contextLabel}
              </div>
              <h1 className="text-3xl font-800 tracking-tight text-gray-800 sm:text-4xl">
                {pageTitle}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                {pageDescription}
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-amber-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                {showBossHunt ? (
                  <Swords size={22} aria-hidden="true" />
                ) : (
                  <Flame size={22} aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="font-mono text-xl font-bold text-gray-800">
                  Top {rankingQuery.data?.limit ?? 10}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  Xếp hạng hiện hành
                </p>
              </div>
            </div>
          </div>
        </section>

        <RankingTabs activeTab={activeTab} onChange={changeTab} />

        <section className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
          <div
            id={"ranking-panel-" + activeTab}
            role="tabpanel"
            aria-labelledby={"ranking-tab-" + activeTab}
          >
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Xếp hạng hiện tại
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Cập nhật lúc {formatUpdatedAt(rankingQuery.data?.updatedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void rankingQuery.refetch()}
                disabled={rankingQuery.isFetching}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:border-amber-300 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={rankingQuery.isFetching ? "animate-spin" : ""}
                  aria-hidden="true"
                />
                Làm mới
              </button>
            </div>

            {currentRewards && <RankingRewards rewards={currentRewards} />}

            {rankingQuery.isLoading ? (
              <RankingSkeleton />
            ) : rankingQuery.isError ? (
              <div className="rounded-lg border border-red-200 bg-white px-6 py-14 text-center shadow-sm">
                <ShieldAlert
                  size={36}
                  className="mx-auto text-red-400"
                  aria-hidden="true"
                />
                <h2 className="mt-4 text-lg font-bold text-gray-800">
                  Không thể tải bảng xếp hạng
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  {rankingQuery.error instanceof Error
                    ? rankingQuery.error.message
                    : "Vui lòng kiểm tra kết nối và thử lại."}
                </p>
                <button
                  type="button"
                  onClick={() => void rankingQuery.refetch()}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600"
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  Thử lại
                </button>
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-6 py-14 text-center">
                <Trophy
                  size={36}
                  className="mx-auto text-amber-400"
                  aria-hidden="true"
                />
                <h2 className="mt-4 text-lg font-bold text-gray-800">
                  Chưa có nhân vật trên bảng xếp hạng
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                  {showBossHunt
                    ? "Bảng Top Săn Boss sẽ hiển thị khi có điểm hạ gục Lân Sư Vũ đầu tiên."
                    : showDeposit
                      ? "Bảng Top Nạp sẽ hiển thị khi có giao dịch nạp trong mùa hiện tại."
                      : "Bảng Top Đốt Pháo sẽ hiển thị khi có điểm Đốt pháo đầu tiên."}
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-8 grid gap-4 md:grid-cols-[1fr_1.1fr_1fr]">
                  {topThree.map((entry) => (
                    <PodiumCard
                      key={entry.rank}
                      entry={entry}
                      valueLabel={valueLabel}
                    />
                  ))}
                </div>
                <RemainingRanking entries={remaining} />
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default RankingPage;
