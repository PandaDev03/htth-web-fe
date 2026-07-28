import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  Gift,
  Medal,
  PackageOpen,
  PartyPopper,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import {
  getTopDepositRanking,
  getTopLevelRanking,
} from "@/features/ranking/api/rankingApi";
import { FireworksUpcomingNotice } from "@/features/ranking/components/FireworksUpcomingNotice";
import {
  RankingTabs,
  type RankingTabId,
} from "@/features/ranking/components/RankingTabs";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { env } from "@/shared/config/env";
import { scrollToTop } from "@/shared/utils/utils";

const rankingQueryKey = ["rankings", "top-deposits"] as const;
const levelRankingQueryKey = ["rankings", "top-levels"] as const;
const itemIconFamilyOffsets = {
  item4: 2000,
} as const;
const gameItemIconBaseUrl = env.gameItemIconBaseUrl.replace(/\/$/, "");

type DisplayRankingEntry = {
  rank: number;
  name: string;
  subtitle?: string;
  value: number;
};

type RewardItem = {
  name: string;
  quantity?: string;
  family?: keyof typeof itemIconFamilyOffsets;
  icon?: number;
  iconId?: number;
};

type RewardTier = {
  rankLabel: string;
  highlight?: "champion" | "runner" | "bronze";
  items: RewardItem[];
};

type RankingRewardSet = {
  title: string;
  description: string;
  period?: string;
  tiers: RewardTier[];
};

const rewardIcons = {
  petEgg: 252,
  darkFruit: 383,
  orangeChest12: 169,
  orangeChest13: 170,
  orangeChest14: 171,
  orangeChest15: 172,
  superGemChest: 127,
  costumeChest: 770,
  lv6GemChest: 768,
  demonFruitChest: 125,
  seaStone6: 182,
  auraCard: 787,
  title: 3002,
} as const;

const levelRankingRewards: RankingRewardSet = {
  title: "Phần thưởng Top Level",
  description: "Quà được trao theo thứ hạng nhân vật khi đường đua kết thúc.",
  tiers: [
    {
      rankLabel: "Top 1",
      highlight: "champion",
      items: [
        { quantity: "1", name: "Trứng Pet", icon: rewardIcons.petEgg },
        { quantity: "1", name: "Trái Bóng Tối", icon: rewardIcons.darkFruit },
        {
          quantity: "1",
          name: "Rương Cam +14 Cùng Hệ",
          icon: rewardIcons.orangeChest14,
        },
        {
          quantity: "1",
          name: "Rương đá siêu cấp ngẫu nhiên",
          icon: rewardIcons.superGemChest,
        },
      ],
    },
    {
      rankLabel: "Top 2",
      highlight: "runner",
      items: [
        { quantity: "1", name: "Trứng Pet", icon: rewardIcons.petEgg },
        {
          quantity: "1",
          name: "Rương Cam +13 Cùng Hệ",
          icon: rewardIcons.orangeChest13,
        },
        {
          quantity: "1",
          name: "Rương đá siêu cấp ngẫu nhiên",
          icon: rewardIcons.superGemChest,
        },
      ],
    },
    {
      rankLabel: "Top 3",
      highlight: "bronze",
      items: [
        { quantity: "1", name: "Trứng Pet", icon: rewardIcons.petEgg },
        {
          quantity: "1",
          name: "Rương Cam +12 Cùng Hệ",
          icon: rewardIcons.orangeChest12,
        },
        {
          quantity: "1",
          name: "Rương đá siêu cấp ngẫu nhiên",
          icon: rewardIcons.superGemChest,
        },
      ],
    },
    {
      rankLabel: "Top 4 đến Top 10",
      items: [
        { quantity: "1", name: "Trứng Pet", icon: rewardIcons.petEgg },
        {
          quantity: "1",
          name: "Rương ác quỷ tự chọn",
          icon: rewardIcons.demonFruitChest,
        },
        {
          quantity: "3",
          name: "Rương đá Lv6 ngẫu nhiên",
          icon: rewardIcons.lv6GemChest,
        },
      ],
    },
  ],
};

const depositRankingRewards: RankingRewardSet = {
  title: "Phần thưởng Top Nạp",
  description: "Tổng kết theo điểm tích nạp trong thời gian sự kiện.",
  period: "25/7 - 1/8",
  tiers: [
    {
      rankLabel: "Top 1",
      highlight: "champion",
      items: [
        {
          quantity: "1",
          name: "Rương thời trang tự chọn",
          icon: rewardIcons.costumeChest,
        },
        {
          quantity: "1",
          name: "Rương Cam +15 Cùng Hệ",
          icon: rewardIcons.orangeChest15,
        },
        {
          quantity: "1",
          name: "Rương đá thần tự chọn",
          icon: rewardIcons.superGemChest,
        },
        {
          quantity: "30",
          name: "Đá Hải Thạch cấp 6",
          icon: rewardIcons.seaStone6,
        },
        {
          quantity: "1",
          name: "Danh hiệu Tứ Hoàng",
          iconId: rewardIcons.title,
        },
        {
          quantity: "10",
          name: "Rương hào quang",
          icon: rewardIcons.auraCard,
        },
      ],
    },
    {
      rankLabel: "Top 2",
      highlight: "runner",
      items: [
        {
          quantity: "1",
          name: "Rương Cam +14 Cùng Hệ",
          icon: rewardIcons.orangeChest14,
        },
        {
          quantity: "1",
          name: "Rương đá siêu cấp tự chọn",
          icon: rewardIcons.superGemChest,
        },
        {
          quantity: "20",
          name: "Đá Hải Thạch cấp 6",
          icon: rewardIcons.seaStone6,
        },
        {
          quantity: "1",
          name: "Danh hiệu Tứ Hoàng",
          iconId: rewardIcons.title,
        },
        {
          quantity: "5",
          name: "Rương hào quang",
          icon: rewardIcons.auraCard,
        },
      ],
    },
    {
      rankLabel: "Top 3",
      highlight: "bronze",
      items: [
        {
          quantity: "1",
          name: "Rương Cam +13 Cùng Hệ",
          icon: rewardIcons.orangeChest13,
        },
        {
          quantity: "1",
          name: "Rương đá siêu cấp tự chọn",
          icon: rewardIcons.superGemChest,
        },
        {
          quantity: "20",
          name: "Đá Hải Thạch cấp 6",
          icon: rewardIcons.seaStone6,
        },
        {
          quantity: "1",
          name: "Danh hiệu Tứ Hoàng",
          iconId: rewardIcons.title,
        },
        {
          quantity: "3",
          name: "Rương hào quang",
          icon: rewardIcons.auraCard,
        },
      ],
    },
    {
      rankLabel: "Top 4 đến Top 10",
      items: [
        {
          quantity: "1",
          name: "Rương hào quang",
          icon: rewardIcons.auraCard,
        },
        {
          quantity: "10",
          name: "Đá Hải Thạch",
          icon: rewardIcons.seaStone6,
        },
        {
          quantity: "5",
          name: "Rương đá Lv6 ngẫu nhiên",
          icon: rewardIcons.lv6GemChest,
        },
        {
          quantity: "1",
          name: "Danh hiệu Top Server",
          iconId: rewardIcons.title,
        },
      ],
    },
  ],
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

function getRewardIconId(item: RewardItem) {
  if (typeof item.iconId === "number") return item.iconId;
  if (typeof item.icon !== "number") return undefined;

  return itemIconFamilyOffsets[item.family ?? "item4"] + item.icon;
}

function getRewardIconUrl(item: RewardItem) {
  const iconId = getRewardIconId(item);

  return iconId ? gameItemIconBaseUrl + "/" + iconId + ".png" : undefined;
}

function RewardIcon({ item }: { item: RewardItem }) {
  const iconUrl = getRewardIconUrl(item);

  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
      <PackageOpen size={20} aria-hidden="true" />
      {iconUrl && (
        <img
          src={iconUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain p-1.5"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
    </span>
  );
}

function RewardItemRow({ item }: { item: RewardItem }) {
  return (
    <li className="flex min-w-0 items-center gap-3">
      <RewardIcon item={item} />
      <span className="min-w-0 text-sm font-semibold leading-snug text-gray-700">
        {item.quantity && (
          <span className="mr-1 font-mono text-amber-600">{item.quantity}</span>
        )}
        {item.name}
      </span>
    </li>
  );
}

function RewardTierCard({ tier }: { tier: RewardTier }) {
  // const toneClass =
  //   tier.highlight === "champion"
  //     ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white shadow-[0_16px_40px_rgba(180,120,20,0.12)]"
  //     : tier.highlight === "runner"
  //       ? "border-slate-200 bg-white"
  //       : tier.highlight === "bronze"
  //         ? "border-orange-200 bg-orange-50/40"
  //         : "border-gray-200 bg-white";

  return (
    <article className={`rounded-2xl border p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-800 text-gray-800">{tier.rankLabel}</h3>
        <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-amber-600 shadow-sm">
          {tier.items.length} món
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {tier.items.map((item) => (
          <RewardItemRow key={tier.rankLabel + "-" + item.name} item={item} />
        ))}
      </ul>
    </article>
  );
}

function RankingRewards({ rewards }: { rewards: RankingRewardSet }) {
  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      <div className="grid gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <Gift size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-800 text-gray-800">{rewards.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
              {rewards.description}
            </p>
          </div>
        </div>
        {rewards.period && (
          <div className="w-fit rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-700">
            Thời gian: {rewards.period}
          </div>
        )}
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
          {getInitial(entry.name)}
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

function EmptyRanking({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-6 py-14 text-center">
      <Trophy size={36} className="mx-auto text-amber-400" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-bold text-gray-800">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
        {description}
      </p>
    </div>
  );
}

function RemainingRanking({
  entries,
  nameHeading,
  valueHeading,
}: {
  entries: DisplayRankingEntry[];
  nameHeading: string;
  valueHeading: string;
}) {
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
                {nameHeading}
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                {valueHeading}
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
  const tabParam = searchParams.get("tab");
  const activeTab: RankingTabId =
    tabParam === "level"
      ? "level"
      : tabParam === "phao-hoa"
        ? "fireworks"
        : "deposit";
  const depositRankingQuery = useQuery({
    queryKey: rankingQueryKey,
    queryFn: getTopDepositRanking,
    staleTime: 60_000,
    enabled: activeTab === "deposit",
  });
  const levelRankingQuery = useQuery({
    queryKey: levelRankingQueryKey,
    queryFn: getTopLevelRanking,
    staleTime: 60_000,
    enabled: activeTab === "level",
  });

  useEffect(() => {
    scrollToTop({ behavior: "smooth" });
  }, []);

  const showLevel = activeTab === "level";
  const showFireworks = activeTab === "fireworks";
  const rankingQuery = showLevel ? levelRankingQuery : depositRankingQuery;
  const entries: DisplayRankingEntry[] = showLevel
    ? (levelRankingQuery.data?.items ?? []).map((entry) => ({
        rank: entry.rank,
        name: entry.playerName,
        subtitle: entry.accountUsername,
        value: entry.level,
      }))
    : (depositRankingQuery.data?.items ?? []).map((entry) => ({
        rank: entry.rank,
        name: entry.username,
        value: entry.tongnap,
      }));
  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);
  const valueLabel = showLevel ? "Cấp độ" : "Điểm tích nạp";
  const nameHeading = showLevel ? "Nhân vật" : "Tài khoản";
  const currentRewards = showLevel
    ? levelRankingRewards
    : depositRankingRewards;

  const changeTab = (nextTab: RankingTabId) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextTab === "fireworks") {
      nextParams.set("tab", "phao-hoa");
    } else if (nextTab === "level") {
      nextParams.set("tab", "level");
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
                <Trophy size={15} aria-hidden="true" />
                Đua Top
              </div>
              <h1 className="text-3xl font-800 tracking-tight text-gray-800 sm:text-4xl">
                {showFireworks
                  ? "Bảng Xếp Hạng Pháo Hoa"
                  : showLevel
                    ? "Bảng Xếp Hạng Level"
                    : "Bảng Xếp Hạng Nạp"}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                {showFireworks
                  ? "Sự kiện mới đang được chuẩn bị và sẽ sớm mở bảng xếp hạng."
                  : showLevel
                    ? "Vinh danh những nhân vật có cấp độ cao nhất toàn máy chủ."
                    : "Vinh danh những thuyền trưởng có điểm tích nạp cao nhất toàn máy chủ"}
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                {showFireworks ? (
                  <PartyPopper size={22} aria-hidden="true" />
                ) : showLevel ? (
                  <TrendingUp size={22} aria-hidden="true" />
                ) : (
                  <Trophy size={22} aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="font-mono text-xl font-bold text-gray-800">
                  {showFireworks
                    ? "Sắp diễn ra"
                    : "Top " + (rankingQuery.data?.limit ?? 10)}
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
              id={`ranking-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`ranking-tab-${activeTab}`}
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

              <RankingRewards rewards={currentRewards} />

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
                <EmptyRanking
                  title={
                    showLevel
                      ? "Chưa có nhân vật trên bảng xếp hạng"
                      : "Chưa có thuyền trưởng trên bảng xếp hạng"
                  }
                  description={
                    showLevel
                      ? "Top Level sẽ hiển thị khi hệ thống ghi nhận cấp độ nhân vật đầu tiên."
                      : "Bảng Top Nạp sẽ hiển thị khi hệ thống ghi nhận điểm tích nạp đầu tiên."
                  }
                />
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
                  <RemainingRanking
                    entries={remaining}
                    nameHeading={nameHeading}
                    valueHeading={valueLabel}
                  />
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
