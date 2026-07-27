import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Coins,
  Info,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { scrollToTop } from "@/shared/utils/utils";

const USER_COIN_BALANCE = 12_500;
const EXCHANGE_RATE = { coinPer1k: 10_000, minCoins: 1_000, maxCoins: 50_000 };
const COIN_PRESETS = [1_000, 5_000, 10_000, 20_000, 50_000];

const formatVnd = (amount: number) => amount.toLocaleString("vi-VN") + " ₫";
const formatCoin = (amount: number) => amount.toLocaleString("vi-VN") + " Coin";

async function simulateExchangeRequest() {
  await new Promise((resolve) => window.setTimeout(resolve, 1200));
}

function CoinExchangePage() {
  const [coinInput, setCoinInput] = useState("");

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [submitted, setSubmitted] = useState(false);

  const refreshMutation = useMutation({
    mutationFn: simulateExchangeRequest,
    onSuccess: () => setLastUpdated(new Date()),
  });

  const exchangeMutation = useMutation({
    mutationFn: simulateExchangeRequest,
    onSuccess: () => setSubmitted(true),
  });

  const coinAmount = Number.parseInt(coinInput.replace(/\D/g, ""), 10) || 0;
  const vndAmount = Math.floor((coinAmount / 1000) * EXCHANGE_RATE.coinPer1k);
  const valid =
    coinAmount >= EXCHANGE_RATE.minCoins &&
    coinAmount <= EXCHANGE_RATE.maxCoins &&
    coinAmount <= USER_COIN_BALANCE;

  useEffect(() => {
    scrollToTop({ behavior: "smooth" });
  }, []);

  const choose = (amount: number) => {
    setCoinInput(amount.toLocaleString("vi-VN"));
    setSubmitted(false);
  };

  const change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\D/g, "");
    setCoinInput(raw ? Number.parseInt(raw, 10).toLocaleString("vi-VN") : "");
    setSubmitted(false);
  };

  const submit = () => {
    if (!valid) return;
    exchangeMutation.mutate();
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
                Đổi Coin
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Quy Đổi Coin</h1>
            <p className="mt-1 text-sm text-gray-500">
              Chuyển đổi coin tích lũy thành tiền mặt theo tỷ giá hiện hành
            </p>
          </header>
          <section className="mb-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 opacity-80">
                  <Wallet size={14} />
                  <span className="text-xs font-medium">
                    Số dư coin hiện tại
                  </span>
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  {USER_COIN_BALANCE.toLocaleString("vi-VN")}
                  <span className="ml-2 text-lg font-semibold opacity-80">
                    Coin
                  </span>
                </div>
                <div className="mt-1 text-xs opacity-70">
                  ≈{" "}
                  {formatVnd(
                    Math.floor(
                      (USER_COIN_BALANCE / 1000) * EXCHANGE_RATE.coinPer1k,
                    ),
                  )}{" "}
                  tối đa
                </div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <Coins size={28} />
              </div>
            </div>
          </section>
          <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-500" />
                <h2 className="text-sm font-bold text-gray-700">
                  Tỷ Giá Hiện Hành
                </h2>
              </div>
              <button
                type="button"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={refreshMutation.isPending ? "animate-spin" : ""}
                />
                Làm mới
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                <TrendingUp size={13} />
                1,000 Coin = {formatVnd(EXCHANGE_RATE.coinPer1k)}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={12} />
                {refreshMutation.isPending
                  ? "Đang cập nhật..."
                  : `Cập nhật lúc ${lastUpdated.toLocaleTimeString("vi-VN")}`}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ["Tỷ giá", `${formatVnd(EXCHANGE_RATE.coinPer1k)} / 1K Coin`],
                ["Tối thiểu", formatCoin(EXCHANGE_RATE.minCoins)],
                ["Tối đa", formatCoin(EXCHANGE_RATE.maxCoins)],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`rounded-xl border p-3 text-center ${index === 0 ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50"}`}
                >
                  <p
                    className={`mb-1 text-xs font-medium ${index === 0 ? "text-amber-600" : "text-gray-500"}`}
                  >
                    {label}
                  </p>
                  <p
                    className={`text-xs font-bold ${index === 0 ? "text-amber-700" : "text-gray-700"}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-gray-700">
              Nhập Số Coin Muốn Đổi
            </h2>
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-gray-800">
                    Yêu cầu đã gửi thành công!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Đã đổi{" "}
                    <span className="font-semibold text-amber-600">
                      {formatCoin(coinAmount)}
                    </span>{" "}
                    →{" "}
                    <span className="font-semibold text-green-600">
                      {formatVnd(vndAmount)}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Vui lòng chờ Admin xét duyệt trong 24h
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCoinInput("");
                    setSubmitted(false);
                  }}
                  className="mt-2 text-sm font-semibold text-amber-600 underline underline-offset-2"
                >
                  Đổi thêm
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
                  {COIN_PRESETS.map((amount) => (
                    <button
                      type="button"
                      key={amount}
                      onClick={() => choose(amount)}
                      disabled={amount > USER_COIN_BALANCE}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${coinAmount === amount ? "border-amber-500 bg-amber-500 text-white" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-amber-300 hover:text-amber-600"}`}
                    >
                      {amount.toLocaleString("vi-VN")}
                    </button>
                  ))}
                </div>
                <div className="relative mb-3">
                  <Coins
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={coinInput}
                    onChange={change}
                    placeholder="Nhập số coin..."
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                {coinAmount > 0 && coinAmount < EXCHANGE_RATE.minCoins && (
                  <p className="mb-3 flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle size={13} />
                    Tối thiểu {formatCoin(EXCHANGE_RATE.minCoins)}
                  </p>
                )}
                {coinAmount > USER_COIN_BALANCE && (
                  <p className="mb-3 flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle size={13} />
                    Vượt quá số dư hiện tại
                  </p>
                )}
                {coinAmount > EXCHANGE_RATE.maxCoins && (
                  <p className="mb-3 flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle size={13} />
                    Tối đa {formatCoin(EXCHANGE_RATE.maxCoins)} mỗi lần đổi
                  </p>
                )}
                {valid && (
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Coin đổi</p>
                      <p className="text-base font-bold text-amber-700">
                        {coinAmount.toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <ArrowRight size={18} className="text-amber-400" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Nhận được</p>
                      <p className="text-base font-bold text-green-600">
                        {formatVnd(vndAmount)}
                      </p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={submit}
                  disabled={!valid || exchangeMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exchangeMutation.isPending ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Coins size={16} />
                      Xác Nhận Đổi Coin
                    </>
                  )}
                </button>
              </>
            )}
          </section>
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <Info size={15} className="mt-0.5 shrink-0 text-blue-400" />
            <p className="text-xs leading-relaxed text-blue-600">
              Yêu cầu đổi coin sẽ được Admin xét duyệt trong vòng{" "}
              <strong>24 giờ</strong>. Tiền sẽ được chuyển qua phương thức thanh
              toán đã đăng ký. Tỷ giá có thể thay đổi, nhấn{" "}
              <strong>Làm mới</strong> để cập nhật tỷ giá mới nhất.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CoinExchangePage;
