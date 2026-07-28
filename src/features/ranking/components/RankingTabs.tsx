import { PartyPopper, TrendingUp, Trophy } from "lucide-react";

export type RankingTabId = "deposit" | "level" | "fireworks";

const rankingTabs = [
  {
    id: "deposit" as const,
    label: "Top Nạp",
    status: "Hiện hành",
    icon: Trophy,
  },
  {
    id: "level" as const,
    label: "Top Level",
    status: "Hiện hành",
    icon: TrendingUp,
  },
  {
    id: "fireworks" as const,
    label: "Top Pháo Hoa",
    status: "Sắp diễn ra",
    icon: PartyPopper,
  },
];

export function RankingTabs({
  activeTab,
  onChange,
}: {
  activeTab: RankingTabId;
  onChange: (tab: RankingTabId) => void;
}) {
  return (
    <div className="relative mx-auto -mt-5 max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
        <div
          role="tablist"
          aria-label="Chọn bảng xếp hạng"
          className="flex min-w-max gap-1.5"
        >
          {rankingTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`ranking-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`ranking-panel-${tab.id}`}
                onClick={() => onChange(tab.id)}
                className={`flex min-w-[11rem] items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors active:scale-[0.98] ${
                  isActive
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isActive ? "bg-white/20" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span
                    className={`mt-0.5 block text-xs font-medium ${
                      isActive ? "text-amber-50" : "text-gray-400"
                    }`}
                  >
                    {tab.status}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
