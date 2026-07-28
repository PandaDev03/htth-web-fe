import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  Medal,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import {
  getTopDepositRanking,
  type RankingEntry,
} from "@/features/ranking/api/rankingApi";
import { FireworksUpcomingNotice } from "@/features/ranking/components/FireworksUpcomingNotice";
import {
  RankingTabs,
  type RankingTabId,
} from "@/features/ranking/components/RankingTabs";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { scrollToTop } from "@/shared/utils/utils";

const rankingQueryKey = ["rankings", "top-deposits"] as const;

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

function PodiumCard({ entry }: { entry: RankingEntry }) {
  const isChampion = entry.rank === 1;
  const placement =
    entry.rank === 1
      ? "md:col-start-2 md:row-start-1"
      : entry.rank === 2
        ? "md:col-start-1 md:row-start-1 md:mt-10"
        : "md:col-start-3 md:row-start-1 md:mt-10";

  return (
    <article
      className={`${placement} rounded-2xl border p-5 transition-transform duration-200 hover:-translate-y-1 ${
        isChampion
          ? "border-amber-300 bg-gradient-to-b from-amber-50 to-white shadow-[0_18px_45px_rgba(180,120,20,0.14)]"
          : "border-gray-200 bg-white shadow-sm"
      }`}
    >
      <div className="mb-5 flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-800 ${
            isChampion
              ? "bg-amber-500 text-white"
              : entry.rank === 2
                ? "bg-slate-200 text-slate-700"
                : "bg-orange-100 text-orange-700"
          }`}
          aria-hidden="true"
        >
          {getInitial(entry.username)}
        </div>
        <div
          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-mono text-sm font-bold ${
            isChampion
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          #{entry.rank}
        </div>
      </div>
      <div className="mb-4 flex items-center gap-2">
        {isChampion ? (
          <Crown size={18} className="text-amber-500" aria-hidden="true" />
        ) : (
          <Medal size={18} className="text-gray-400" aria-hidden="true" />
        )}
        <h2 className="min-w-0 truncate text-base font-bold text-gray-800">
          {entry.username}
        </h2>
      </div>
      <p className="font-mono text-2xl font-bold text-amber-600">
        {formatPoints(entry.tongnap)}
      </p>
      <p className="mt-1 text-xs font-medium text-gray-400">Điểm tích nạp</p>
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
            className="h-52 animate-pulse rounded-2xl border border-gray-200 bg-white p-5"
          >
            <div className="mb-8 h-12 w-12 rounded-xl bg-gray-100" />
            <div className="mb-3 h-5 w-32 rounded bg-gray-100" />
            <div className="h-8 w-40 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
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

function EmptyRanking() {
  return (
    <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-6 py-14 text-center">
      <Trophy size={36} className="mx-auto text-amber-400" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-bold text-gray-800">
        Chưa có thuyền trưởng trên bảng xếp hạng
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
        Bảng Top Nạp sẽ hiển thị khi hệ thống ghi nhận điểm tích nạp đầu tiên.
      </p>
    </div>
  );
}

function RemainingRanking({ entries }: { entries: RankingEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
        <h2 className="text-base font-bold text-gray-800">
          Các Hạng Tiếp Theo
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
                Tài khoản
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Điểm tích nạp
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
                      {getInitial(entry.username)}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {entry.username}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm font-bold text-amber-600">
                  {formatPoints(entry.tongnap)}
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
    searchParams.get("tab") === "phao-hoa" ? "fireworks" : "deposit";
  const rankingQuery = useQuery({
    queryKey: rankingQueryKey,
    queryFn: getTopDepositRanking,
    staleTime: 60_000,
    enabled: activeTab === "deposit",
  });

  useEffect(() => {
    scrollToTop({ behavior: "smooth" });
  }, []);

  const entries = rankingQuery.data?.items ?? [];
  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);
  const showFireworks = activeTab === "fireworks";

  const changeTab = (nextTab: RankingTabId) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextTab === "fireworks") {
      nextParams.set("tab", "phao-hoa");
    } else {
      nextParams.delete("tab");
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pb-16 pt-16">
        <section className="border-b border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50">
          <div className="mx-auto grid max-w-screen-xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600">
                <Sparkles size={15} aria-hidden="true" />
                Đua Top
              </div>
              <h1 className="text-3xl font-800 tracking-tight text-gray-800 sm:text-4xl">
                {showFireworks ? "Bảng Xếp Hạng Pháo Hoa" : "Bảng Xếp Hạng Nạp"}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                {showFireworks
                  ? "Sự kiện mới đang được chuẩn bị và sẽ sớm mở bảng xếp hạng."
                  : "Vinh danh những thuyền trưởng có điểm tích nạp cao nhất toàn máy chủ."}
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                {showFireworks ? (
                  <Sparkles size={22} aria-hidden="true" />
                ) : (
                  <Trophy size={22} aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="font-mono text-xl font-bold text-gray-800">
                  {showFireworks
                    ? "Sắp diễn ra"
                    : "Top " + (rankingQuery.data?.limit ?? 20)}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  {showFireworks ? "Chưa mở tính điểm" : "Xếp hạng hiện hành"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <RankingTabs activeTab={activeTab} onChange={changeTab} />

        <section className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
          {showFireworks ? (
            <FireworksUpcomingNotice />
          ) : (
            <div
              id="ranking-panel-deposit"
              role="tabpanel"
              aria-labelledby="ranking-tab-deposit"
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
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:border-amber-300 hover:text-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={15}
                    className={rankingQuery.isFetching ? "animate-spin" : ""}
                    aria-hidden="true"
                  />
                  Làm mới
                </button>
              </div>

              {rankingQuery.isLoading ? (
                <RankingSkeleton />
              ) : rankingQuery.isError ? (
                <div className="rounded-2xl border border-red-200 bg-white px-6 py-14 text-center shadow-sm">
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
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-600 active:scale-[0.98]"
                  >
                    <RefreshCw size={15} aria-hidden="true" />
                    Thử lại
                  </button>
                </div>
              ) : entries.length === 0 ? (
                <EmptyRanking />
              ) : (
                <div>
                  <div className="mb-8 grid gap-4 md:grid-cols-[1fr_1.1fr_1fr]">
                    {topThree.map((entry) => (
                      <PodiumCard key={entry.rank} entry={entry} />
                    ))}
                  </div>
                  <RemainingRanking entries={remaining} />
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default RankingPage;
