import { PublicFooter } from "@/shared/components/site/PublicFooter";
import { PublicTopbar } from "@/shared/components/site/PublicHeader";
import {
  ArrowLeft,
  Banknote,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import DepositProgress, { DepositStep } from "../components/DepositProgress";

const DEPOSIT_PRESETS = [
  { value: 50_000, bonus: 0 },
  { value: 100_000, bonus: 0 },
  { value: 200_000, bonus: 5 },
  { value: 500_000, bonus: 10 },
  { value: 1_000_000, bonus: 15 },
  { value: 2_000_000, bonus: 20 },
];

const PAYMENT_OPTIONS = [
  {
    id: "atm",
    label: "Thẻ ATM Nội Địa",
    description: "Napas, Visa Debit",
    icon: <CreditCard size={20} className="text-blue-600" />,
    bg: "bg-blue-50",
  },
  {
    id: "bank",
    label: "Chuyển Khoản Ngân Hàng",
    description: "Vietcombank, MB, Techcombank...",
    icon: <Building2 size={20} className="text-emerald-600" />,
    bg: "bg-emerald-50",
  },
  {
    id: "momo",
    label: "Ví Điện Tử",
    description: "MoMo, ZaloPay, VNPay",
    icon: <Smartphone size={20} className="text-pink-600" />,
    bg: "bg-pink-50",
  },
];

const formatVnd = (amount: number) => amount.toLocaleString("vi-VN") + " ₫";

const DepositPageHeader = () => {
  return (
    <header className="mb-6">
      <div className="mb-1 flex items-center gap-2">
        <CreditCard size={20} className="text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
          Nạp Tiền
        </span>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Nạp Tiền ATM</h1>
      <p className="mt-1 text-sm text-gray-500">
        Nạp tiền vào ví để nhận Coin và tham gia trò chơi
      </p>
    </header>
  );
};

function WalletDepositPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<DepositStep>("select");
  const [copied, setCopied] = useState<string | null>(null);
  const [txId] = useState(() => "NAP" + Date.now().toString().slice(-8));
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const [note, setNote] = useState("");
  const [method, setMethod] = useState("atm");
  const [customAmount, setCustomAmount] = useState("");

  const amount =
    selectedAmount ??
    (Number.parseInt(customAmount.replace(/\D/g, ""), 10) || 0);

  const bonusPercent =
    DEPOSIT_PRESETS.find((item) => item.value === selectedAmount)?.bonus ?? 0;

  const bonus = Math.floor((amount * bonusPercent) / 100);
  const total = amount + bonus;

  function changeCustom(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, "");
    setCustomAmount(
      raw ? Number.parseInt(raw, 10).toLocaleString("vi-VN") : "",
    );
    setSelectedAmount(null);
  }

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  async function confirm() {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setStep("success");
  }

  if (step === "select")
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <PublicTopbar />
        <main className="flex-1 px-4 pb-16 pt-24">
          <div className="mx-auto max-w-2xl">
            <DepositPageHeader />
            <DepositProgress current="select" />
            <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Banknote size={16} className="text-amber-500" />
                Chọn Mệnh Giá Nạp
              </h2>
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {DEPOSIT_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.value}
                    onClick={() => {
                      setSelectedAmount(preset.value);
                      setCustomAmount("");
                    }}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all ${selectedAmount === preset.value ? "border-amber-500 bg-amber-50" : "border-gray-100 bg-gray-50 hover:border-amber-200"}`}
                  >
                    {preset.bonus > 0 && (
                      <span className="absolute -right-2 -top-2 rounded-full bg-green-500 px-1.5 py-0.5 text-2xs font-bold text-white">
                        +{preset.bonus}%
                      </span>
                    )}
                    <p className="text-sm font-bold text-gray-800">
                      {formatVnd(preset.value)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {preset.value.toLocaleString("vi-VN")} Coin{" "}
                      {preset.bonus > 0 && (
                        <span className="font-semibold text-green-600">
                          +
                          {Math.floor(
                            (preset.value * preset.bonus) / 100,
                          ).toLocaleString("vi-VN")}{" "}
                          bonus
                        </span>
                      )}
                    </p>
                  </button>
                ))}
              </div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Hoặc nhập số tiền khác (tối thiểu 10,000 ₫)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customAmount}
                  onChange={changeCustom}
                  placeholder="Nhập số tiền..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  VND
                </span>
              </div>
            </section>
            {amount >= 10_000 && (
              <div className="mb-5 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div>
                  <p className="text-xs font-medium text-amber-700">
                    Bạn sẽ nhận được
                  </p>
                  <p className="text-lg font-bold text-amber-800">
                    {total.toLocaleString("vi-VN")} Coin
                  </p>
                  {bonus > 0 && (
                    <p className="text-xs font-semibold text-green-600">
                      Bao gồm +{bonus.toLocaleString("vi-VN")} Coin bonus
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Số tiền nạp</p>
                  <p className="text-base font-bold text-gray-800">
                    {formatVnd(amount)}
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setStep("details")}
              disabled={amount < 10_000}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              Tiếp Theo
              <ChevronRight size={18} />
            </button>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  if (step === "details")
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <PublicTopbar />
        <main className="flex-1 px-4 pb-16 pt-24">
          <div className="mx-auto max-w-2xl">
            <DepositPageHeader />
            <DepositProgress current="details" />
            <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
                <CreditCard size={16} className="text-amber-500" />
                Phương Thức Thanh Toán
              </h2>
              <div className="flex flex-col gap-3">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => setMethod(option.id)}
                    className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${method === option.id ? "border-amber-500 bg-amber-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${option.bg}`}
                    >
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {option.description}
                      </p>
                    </div>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${method === option.id ? "border-amber-500 bg-amber-500" : "border-gray-300"}`}
                    >
                      {method === option.id && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            {method === "bank" && (
              <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Building2 size={16} className="text-emerald-500" />
                  Thông Tin Chuyển Khoản
                </h2>
                <div className="space-y-3">
                  {[
                    ["Ngân hàng", "Vietcombank", "bank"],
                    ["Số tài khoản", "1234567890", "account"],
                    ["Chủ tài khoản", "NGUYEN VAN A", "owner"],
                    ["Chi nhánh", "Chi nhánh TP.HCM", "branch"],
                    ["Nội dung CK", `NAP ${txId}`, "note"],
                  ].map(([label, value, key]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0"
                    >
                      <span className="text-xs text-gray-500">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {value}
                        </span>
                        <button
                          type="button"
                          onClick={() => copy(value, key)}
                          className="rounded-md p-1 hover:bg-gray-100"
                        >
                          {copied === key ? (
                            <CheckCircle size={13} className="text-green-500" />
                          ) : (
                            <Copy size={13} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <label className="mb-3 block text-sm font-bold text-gray-700">
                Ghi Chú Giao Dịch{" "}
                <span className="font-normal text-gray-400">(tùy chọn)</span>
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Nhập ghi chú nếu cần..."
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </section>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("select")}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                <ArrowLeft size={16} />
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 font-bold text-white hover:bg-amber-600"
              >
                Xem Xác Nhận
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  if (step === "confirm") {
    const selected = PAYMENT_OPTIONS.find((option) => option.id === method)!;
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <PublicTopbar />
        <main className="flex-1 px-4 pb-16 pt-24">
          <div className="mx-auto max-w-2xl">
            <DepositPageHeader />
            <DepositProgress current="confirm" />
            <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-700">
                <ShieldCheck size={16} className="text-amber-500" />
                Xác Nhận Giao Dịch
              </h2>
              <div className="space-y-3">
                {[
                  ["Mã giao dịch", txId],
                  ["Số tiền nạp", formatVnd(amount)],
                  ["Coin nhận được", `${amount.toLocaleString("vi-VN")} Coin`],
                  ...(bonus
                    ? [["Coin bonus", `+${bonus.toLocaleString("vi-VN")} Coin`]]
                    : []),
                  ["Tổng Coin", `${total.toLocaleString("vi-VN")} Coin`],
                  ["Phương thức", selected.label],
                  ...(note ? [["Ghi chú", note]] : []),
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-gray-50 py-2.5 last:border-0"
                  >
                    <span className="text-sm text-gray-500">{label}</span>
                    <span
                      className={`text-sm font-semibold ${label === "Số tiền nạp" ? "text-base text-amber-600" : label === "Coin bonus" ? "text-green-600" : "text-gray-800"}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <Clock size={16} className="mt-0.5 shrink-0 text-blue-500" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Thời gian xử lý
                </p>
                <p className="mt-0.5 text-xs text-blue-600">
                  Giao dịch sẽ được xử lý trong vòng <strong>5-15 phút</strong>.
                  Nếu sau 30 phút chưa nhận được coin, vui lòng liên hệ hỗ trợ.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("details")}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3.5 text-sm font-semibold text-gray-600"
              >
                <ArrowLeft size={16} />
                Quay lại
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 font-bold text-white disabled:bg-amber-300"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Xác Nhận Nạp Tiền
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PublicTopbar />
      <main className="flex-1 px-4 pb-16 pt-24">
        <div className="mx-auto max-w-2xl">
          <section className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              Yêu Cầu Đã Gửi!
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Giao dịch{" "}
              <span className="font-semibold text-gray-700">{txId}</span> đang
              được xử lý. Coin sẽ được cộng vào ví trong vòng 5-15 phút.
            </p>
            <div className="mb-6 space-y-2 rounded-xl bg-gray-50 p-4 text-left">
              {[
                ["Số tiền nạp", formatVnd(amount)],
                ["Coin nhận được", `${total.toLocaleString("vi-VN")} Coin`],
                [
                  "Phương thức",
                  PAYMENT_OPTIONS.find((option) => option.id === method)
                    ?.label ?? "ATM",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-bold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setStep("select");
                  setSelectedAmount(null);
                  setCustomAmount("");
                  setMethod("atm");
                  setNote("");
                }}
                className="flex-1 rounded-xl border border-amber-300 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50"
              >
                Nạp Thêm
              </button>
              <Link
                to="/user-account"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600"
              >
                <Wallet size={16} />
                Xem Ví Của Tôi
              </Link>
            </div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

export default WalletDepositPage;
