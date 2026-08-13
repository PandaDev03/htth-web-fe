import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  Clock3,
  Loader2,
  ReceiptText,
} from "lucide-react";

import {
  getDepositHistory,
  type DepositHistoryItem,
} from "@/features/deposit/api/payosApi";

const formatVnd = (amount: number) =>
  Number(amount || 0).toLocaleString("vi-VN") + " đ";

function formatPaidAt(value: string) {
  if (!value) return "—";

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function statusClass(status: string) {
  const successful = status.toLocaleLowerCase("vi-VN").includes("thành công");
  return successful
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

function PaymentStatus({ status }: { status: string }) {
  return (
    <span
      className={
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold " +
        statusClass(status)
      }
    >
      {status || "Đang xử lý"}
    </span>
  );
}

function MobileHistoryCard({ item }: { item: DepositHistoryItem }) {
  return (
    <article className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-gray-500">
            {item.ref_no || "#" + item.id}
          </p>
          <p className="mt-1 text-lg font-black text-amber-600">
            {formatVnd(item.amount)}
          </p>
        </div>
        <PaymentStatus status={item.status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-200 pt-3 text-xs">
        <div>
          <p className="text-gray-400">Ngân hàng</p>
          <p className="mt-1 font-semibold text-gray-700">
            {item.bank || "PayOS"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">Thời gian</p>
          <p className="mt-1 font-semibold text-gray-700">
            {formatPaidAt(item.paid_at)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function DepositHistoryTable() {
  const historyQuery = useQuery({
    queryKey: ["deposit-history"],
    queryFn: getDepositHistory,
  });

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <ReceiptText size={16} className="text-amber-500" />
            Lịch Sử Donate
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            50 giao dịch gần nhất của tài khoản
          </p>
        </div>
        <Banknote size={20} className="text-gray-300" />
      </div>

      {historyQuery.isPending ? (
        <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm font-medium text-gray-500">
          <Loader2 size={18} className="animate-spin text-amber-500" />
          Đang tải lịch sử...
        </div>
      ) : historyQuery.isError ? (
        <div className="m-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{historyQuery.error.message}</span>
        </div>
      ) : historyQuery.data.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-12 text-center">
          <Clock3 size={26} className="text-gray-300" />
          <p className="mt-3 text-sm font-semibold text-gray-600">
            Chưa có giao dịch Donate
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Giao dịch thành công sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-0">
          <div className="space-y-3 sm:hidden">
            {historyQuery.data.map((item) => (
              <MobileHistoryCard key={item.id} item={item} />
            ))}
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Mã giao dịch</th>
                  <th className="px-4 py-3 font-semibold">Số tiền</th>
                  <th className="px-4 py-3 font-semibold">Ngân hàng</th>
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyQuery.data.map((item) => (
                  <tr key={item.id} className="text-gray-600">
                    <td className="px-5 py-4 font-mono text-xs font-semibold">
                      {item.ref_no || "#" + item.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-amber-600">
                      {formatVnd(item.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-medium">
                      {item.bank || "PayOS"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs">
                      {formatPaidAt(item.paid_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <PaymentStatus status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
