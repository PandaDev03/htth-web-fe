import { Gift, Loader2, PackageOpen } from "lucide-react";

import type { NikaReward } from "@/features/events/nika/api/nikaWheelApi";
import { RewardIcon } from "@/shared/components/RewardIcon";

type NikaRewardInventoryProps = {
  items: NikaReward[];
  totalQuantity: number;
  isClaiming: boolean;
  onClaimAll: () => void;
};

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function NikaRewardInventory({
  items,
  totalQuantity,
  isClaiming,
  onClaimAll,
}: NikaRewardInventoryProps) {
  return (
    <section className="mt-10" aria-labelledby="nika-inventory-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2
            id="nika-inventory-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
          >
            Kho quà vòng quay
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Quà được giữ tại đây sau mỗi lượt quay. Nhận một lần để tránh nhiều GiftBox liên tiếp.
          </p>
        </div>
        <button
          type="button"
          onClick={onClaimAll}
          disabled={items.length === 0 || isClaiming}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-700 px-5 text-sm font-bold text-white transition hover:bg-amber-800 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 motion-reduce:transition-none"
        >
          {isClaiming ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Gift size={17} />
          )}
          {isClaiming ? "Đang tạo GiftBox" : "Nhận tất cả"}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 grid min-h-48 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
          <div>
            <PackageOpen className="mx-auto text-slate-400" size={32} />
            <p className="mt-3 font-bold text-slate-700">Kho quà đang trống</p>
            <p className="mt-1 text-sm text-slate-500">
              Phần thưởng mới sẽ xuất hiện sau khi quay.
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-5 text-xs font-semibold text-slate-500">
            {items.length} loại quà, tổng số lượng {numberFormatter.format(totalQuantity)}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white p-3 shadow-[0_10px_24px_rgba(120,53,15,0.05)]"
              >
                <RewardIcon item={item} className="h-14 w-14" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-extrabold leading-5 text-slate-800">
                    {item.name}
                  </p>
                  <p className="mt-1 font-mono text-xs font-bold text-amber-700">
                    x{numberFormatter.format(item.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
