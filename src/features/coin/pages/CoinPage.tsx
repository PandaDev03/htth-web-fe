import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle,
  CircleDollarSign,
  Coins,
  Loader2,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  createCoinConversion,
  getCoinSummary,
} from "@/features/coin/api/coinApi";
import { CoinMilestonePanel } from "@/features/coin/components/CoinMilestonePanel";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { scrollToTop, formatDateTime } from "@/shared/utils/utils";
import { UserOutlined } from "@ant-design/icons";

const T = {
  eyebrow: "ĐỔI COIN",
  title: "Chuyển điểm donate sang game coin",
  intro:
    "Điểm donate sẽ được chuyển vào nhân vật game. Server game sẽ xử lý và cập nhật realtime.",
  wallet: "Số điểm donate khả dụng",
  input: "Nhập số điểm muốn đổi",
  submit: "Xác nhận đổi điểm",
  success: "Yêu cầu đã gửi thành công!",
  note: "Server game sẽ xử lý yêu cầu trong ít giây.",
  history: "Lịch sử đổi điểm",
  noHistory: "Chưa có giao dịch nào.",
};
const STATUS: Record<string, string> = {
  pending: "Chờ Admin duyệt",
  approved: "Đã duyệt, chờ server game",
  processing: "Đang xử lý",
  processed: "Hoàn tất",
  rejected: "Đã từ chối",
  failed: "Thất bại",
};

const fmt = (n: number) => n?.toLocaleString("vi-VN");
const coin = (n: number) => fmt(n) + " Coin";

function CoinExchangePage() {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const query = useQuery({
    queryKey: ["coin-conversion-summary"],
    queryFn: getCoinSummary,
  });
  const mutation = useMutation({
    mutationFn: createCoinConversion,
    onSuccess: (result) => {
      setSubmitted(true);
      toast.success(result.message || T.success);
      void query.refetch();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Không thể đổi Coin.",
      ),
  });
  useEffect(() => {
    scrollToTop({ behavior: "smooth" });
  }, []);
  const summary = query.data;
  const amount = Number.parseInt(input.replace(/\D/g, ""), 10) || 0;
  const config = summary?.config ?? {
    multiplier: 1,
    autoApprove: false,
    minAmount: 1,
    maxAmount: 0,
  };
  const available = summary?.wallet.availableCoin || 0;
  const gameAmount = config ? Math.floor(amount * config.multiplier) : 0;
  const valid = Boolean(
    config &&
    amount >= config.minAmount &&
    amount <= config.maxAmount &&
    amount <= available &&
    gameAmount > 0,
  );
  const change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\D/g, "");
    setInput(raw ? fmt(Number.parseInt(raw, 10)) : "");
    setSubmitted(false);
  };
  const choose = (n: number) => {
    setInput(fmt(n));
    setSubmitted(false);
  };
  const submit = () => {
    if (valid) mutation.mutate(amount);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-4 pb-16 pt-24">
        <div className="mx-auto max-w-2xl">
          <header className="mb-8">
            <div className="mb-1 flex items-center gap-2">
              <Coins size={20} className="text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                {T.eyebrow}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{T.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{T.intro}</p>
          </header>
          {query.isPending && (
            <div className="mb-5 flex items-center justify-center rounded-2xl bg-white p-12 text-sm text-gray-500">
              <Loader2 size={18} className="mr-2 animate-spin text-amber-500" />
              {"Đang tải thông tin ví..."}
            </div>
          )}
          {query.isError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {query.error instanceof Error
                ? query.error.message
                : "Không thể tải thông tin đổi Coin."}
            </div>
          )}
          {summary && (
            <>
              <section className="mb-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2 opacity-80">
                      <Wallet size={14} />
                      <span className="text-xs font-medium">
                        {"Số điểm donate khả dụng"}
                      </span>
                    </div>
                    <div className="text-3xl font-bold tracking-tight">
                      {fmt(summary.wallet.availableCoin)}
                      <span className="ml-2 text-lg font-semibold opacity-80">
                        Điểm
                      </span>
                    </div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <CircleDollarSign size={28} />
                  </div>
                </div>
              </section>
              <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-amber-500" />
                    <h2 className="text-sm font-bold text-gray-700">
                      {"Tỷ lệ chuyển đổi"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => void query.refetch()}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600"
                  >
                    <RefreshCw
                      size={13}
                      className={query.isFetching ? "animate-spin" : ""}
                    />
                    {"Làm mới"}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    {"x" + summary.config.multiplier + " game Coin"}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <UserOutlined size={12} />
                    {"Nhân vật: " + summary.player.name}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ["Tối thiểu", coin(summary.config.minAmount)],
                    ["Tối đa", coin(summary.config.maxAmount)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center"
                    >
                      <p className="mb-1 text-xs font-medium text-gray-500">
                        {label}
                      </p>
                      <p className="text-xs font-bold text-gray-700">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-gray-700">
                  {T.input}
                </h2>
                {submitted ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-800">
                        {T.success}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {coin(amount)}{" "}
                        <ArrowRight
                          className="mx-1 inline text-amber-500"
                          size={15}
                        />{" "}
                        {coin(gameAmount)}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">{T.note}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInput("");
                        setSubmitted(false);
                      }}
                      className="mt-2 text-sm font-semibold text-amber-600 underline underline-offset-2"
                    >
                      {"Đổi thêm"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {[summary.config.minAmount, 50_000, 100_000, 500_000]
                        .filter(
                          (n, i, a) => n <= available && a.indexOf(n) === i,
                        )
                        .map((n) => (
                          <button
                            type="button"
                            key={n}
                            onClick={() => choose(n)}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-amber-300 hover:text-amber-600"
                          >
                            {fmt(n)}
                          </button>
                        ))}
                    </div>
                    <div className="relative mb-3">
                      <CircleDollarSign
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={input}
                        onChange={change}
                        placeholder={"Nhập số điểm..."}
                        className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                    {amount > 0 && amount < config.minAmount && (
                      <p className="mb-3 text-xs text-red-500">
                        {"Tối thiểu " + coin(config.minAmount)}
                      </p>
                    )}
                    {amount > available && (
                      <p className="mb-3 text-xs text-red-500">
                        {"Vượt quá số dư ví khả dụng"}
                      </p>
                    )}
                    {amount > config.maxAmount && (
                      <p className="mb-3 text-xs text-red-500">
                        {"Tối đa " + coin(config.maxAmount) + " mỗi lần"}
                      </p>
                    )}
                    {valid && (
                      <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">{"Ví web"}</p>
                          <p className="text-base font-bold text-amber-700">
                            {coin(amount)}
                          </p>
                        </div>
                        <ArrowRight size={18} className="text-amber-400" />
                        <div className="text-center">
                          <p className="text-xs text-gray-500">{"Game Coin"}</p>
                          <p className="text-base font-bold text-green-600">
                            {coin(gameAmount)}
                          </p>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={submit}
                      disabled={!valid || mutation.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {mutation.isPending ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <>
                          <CircleDollarSign size={16} />
                          {T.submit}
                        </>
                      )}
                    </button>
                  </>
                )}
              </section>
              <CoinMilestonePanel
                milestone={summary.milestone}
                onClaimed={() => query.refetch()}
              />

              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-gray-700">
                  {T.history}
                </h2>
                {summary.history.length === 0 ? (
                  <p className="text-sm text-gray-400">{T.noHistory}</p>
                ) : (
                  <div className="space-y-2">
                    {summary.history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs"
                      >
                        <div>
                          <p className="font-bold text-gray-700">
                            {coin(item.webCoin)}{" "}
                            <ArrowRight
                              className="mx-1 inline text-amber-400"
                              size={12}
                            />{" "}
                            {coin(item.gameCoin)}
                          </p>
                          <p className="mt-1 text-gray-400">
                            {formatDateTime(item?.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 font-semibold text-amber-600">
                          {STATUS[item.status] || item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
export default CoinExchangePage;
