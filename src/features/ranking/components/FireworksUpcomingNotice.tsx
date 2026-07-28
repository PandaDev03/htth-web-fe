import { BellRing, CalendarClock, PartyPopper } from "lucide-react";

export function FireworksUpcomingNotice() {
  return (
    <section
      id="ranking-panel-fireworks"
      role="tabpanel"
      aria-labelledby="ranking-tab-fireworks"
      className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm"
    >
      <div className="grid gap-6 px-6 py-10 sm:px-10 md:grid-cols-[auto_1fr] md:items-start md:py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-[0_12px_30px_rgba(180,120,20,0.18)]">
          <PartyPopper size={30} aria-hidden="true" />
        </div>
        <div className="max-w-2xl">
          <span className="inline-flex rounded-lg border border-amber-200 bg-white px-3 py-1 text-xs font-bold text-amber-700">
            Sự kiện sắp diễn ra
          </span>
          <h2 className="mt-4 text-2xl font-800 tracking-tight text-gray-800 sm:text-3xl">
            Đường đua Pháo Hoa chưa khai màn
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
            Bảng xếp hạng chỉ ghi nhận khi sự kiện Pháo Hoa chính thức mở. Thời
            gian và thể lệ sẽ được công bố tại đây.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-white/80 p-4">
              <CalendarClock
                size={18}
                className="mt-0.5 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <p className="text-sm font-medium leading-relaxed text-gray-600">
                Hiện hệ thống chưa bắt đầu ghi nhận điểm Pháo Hoa.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-white/80 p-4">
              <BellRing
                size={18}
                className="mt-0.5 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <p className="text-sm font-medium leading-relaxed text-gray-600">
                Theo dõi thông báo để không bỏ lỡ thời điểm sự kiện bắt đầu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
