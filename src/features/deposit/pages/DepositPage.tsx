import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App as AntdApp } from "antd";
import {
  Banknote,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { refreshSession } from "@/features/auth/api/authApi";
import { setCredentials } from "@/features/auth/model/authSlice";
import { PATH } from "@/shared/config/path";

import {
  createPayosPayment,
  getPayosPaymentStatus,
  type PayosPayment,
} from "@/features/deposit/api/payosApi";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { scrollToTop } from "@/shared/utils/utils";

const DEPOSIT_PRESETS = [
  50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
  10_000_000,
];

const MIN_DEPOSIT_AMOUNT = 1_000;
const MAX_DEPOSIT_AMOUNT = 2_000_000_000;
const QR_CREATE_DEBOUNCE_MS = 900;
const PAYMENT_STATUS_DELAY_MS = 3_000;
const MAX_STATUS_ATTEMPTS = 100;

const formatNumber = (amount: number) => amount.toLocaleString("vi-VN");
const formatVnd = (amount: number) => formatNumber(amount) + " đ";

function parseAmount(value: string) {
  return Number.parseInt(value.replace(/\D/g, ""), 10) || 0;
}

function formatAmountInput(value: string) {
  const amount = parseAmount(value);
  return amount > 0 ? formatNumber(amount) : "";
}

const DepositPageHeader = () => {
  return (
    <header className="mb-6">
      <div className="mb-1 flex items-center gap-2">
        <CreditCard size={20} className="text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
          Nạp Tiền
        </span>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Nạp Coin PayOS</h1>
      <p className="mt-1 text-sm text-gray-500">
        Chọn hoặc nhập số tiền cần nạp, hệ thống sẽ tự tạo QR thanh toán PayOS.
      </p>
    </header>
  );
};

function WalletDepositPage() {
  const dispatch = useAppDispatch();
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const queryClient = useQueryClient();
  const { modal } = AntdApp.useApp();
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);
  const statusAttemptsRef = useRef(0);
  const activeOrderCodeRef = useRef("");
  const handledOrderCodeRef = useRef("");
  const bankSuccessOrderCodeRef = useRef("");
  const generatedAmountRef = useRef<number | null>(null);

  const [amountInput, setAmountInput] = useState("");
  const [payment, setPayment] = useState<PayosPayment | null>(null);
  const [paymentState, setPaymentState] = useState("Chưa tạo mã");
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const amount = parseAmount(amountInput);
  const canCreateQr =
    amount >= MIN_DEPOSIT_AMOUNT && amount <= MAX_DEPOSIT_AMOUNT;
  const isSameGeneratedAmount =
    generatedAmountRef.current === amount && Boolean(payment);

  useEffect(() => {
    scrollToTop({ behavior: "smooth" });
  }, []);

  const createPaymentMutation = useMutation({
    mutationFn: createPayosPayment,
    onSuccess: (result, nextAmount) => {
      generatedAmountRef.current = Number(result.data.amount || nextAmount);
      activeOrderCodeRef.current = result.data.order_code || "";
      handledOrderCodeRef.current = "";
      bankSuccessOrderCodeRef.current = "";
      statusAttemptsRef.current = 0;

      setPayment(result.data);
      setPaymentState("Đang chờ thanh toán");
      setStatusText("Quét QR hoặc mở cổng PayOS để thanh toán.");

      toast.success(result.message || "Tạo mã QR thanh toán thành công.");
      scrollToQr();
      schedulePaymentStatusCheck(PAYMENT_STATUS_DELAY_MS);
    },
    onError: (requestError) => {
      setPayment(null);
      generatedAmountRef.current = null;
      activeOrderCodeRef.current = "";
      clearStatusTimer();

      setPaymentState("Chưa tạo mã");
      setStatusText("");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tạo mã QR thanh toán.",
      );
    },
  });

  const paymentStatusMutation = useMutation({
    mutationFn: ({ orderCode }: { orderCode: string; silent: boolean }) =>
      getPayosPaymentStatus(orderCode),
    onMutate: ({ silent }) => {
      if (!silent) statusAttemptsRef.current += 1;
    },
    onSuccess: (result, { orderCode }) => {
      if (orderCode !== activeOrderCodeRef.current) return;

      const data = result.data;

      if (data.state === "queued") {
        if (bankSuccessOrderCodeRef.current !== orderCode) {
          bankSuccessOrderCodeRef.current = orderCode;
          showPaymentReceivedModal(
            result.message ||
              "PayOS đã xác nhận thanh toán thành công. Hệ thống đang cập nhật ví web.",
          );
          clearPaymentAfterBankSuccess();
        }

        setPaymentState("Đang cộng Coin");
        setStatusText(
          result.message || "Đã thanh toán, server game đang cộng Coin vào ví.",
        );
        schedulePaymentStatusCheck(1_500);
        return;
      }

      if (data.paid) {
        if (handledOrderCodeRef.current === orderCode) return;
        handledOrderCodeRef.current = orderCode;

        if (bankSuccessOrderCodeRef.current !== orderCode) {
          bankSuccessOrderCodeRef.current = orderCode;
          showPaymentReceivedModal(
            "PayOS đã xác nhận thanh toán thành công. Hệ thống đang cập nhật ví web.",
          );
        }

        void queryClient.invalidateQueries({ queryKey: ["deposit-history"] });
        void queryClient.invalidateQueries({
          queryKey: ["coin-conversion-summary"],
        });
        void refreshAccountSnapshot();
        resetDeposit();
        return;
      }

      if (data.state !== "empty") {
        setPaymentState("Đang chờ thanh toán");
        setStatusText("Đang chờ thanh toán...");
        schedulePaymentStatusCheck(PAYMENT_STATUS_DELAY_MS);
      }
    },
    onError: (requestError, { orderCode, silent }) => {
      if (orderCode !== activeOrderCodeRef.current) return;

      if (!silent) {
        setStatusText(
          requestError instanceof Error
            ? requestError.message
            : "Chưa kiểm tra được trạng thái thanh toán.",
        );
        schedulePaymentStatusCheck(5_000);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      if (statusTimerRef.current) {
        window.clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  function scrollToQr() {
    window.setTimeout(() => {
      qrContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function clearStatusTimer() {
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }

  function clearDebounceTimer() {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }

  function resetQrIfAmountChanged(nextAmount: number) {
    if (
      generatedAmountRef.current &&
      generatedAmountRef.current !== nextAmount
    ) {
      generatedAmountRef.current = null;
      activeOrderCodeRef.current = "";
      setPayment(null);
      setPaymentState("Chưa tạo mã");
      setStatusText("");
      clearStatusTimer();
    }
  }

  async function copy(value: string, key: string) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      toast.warning("Chưa thể sao chép tự động.");
    }
  }

  function checkPaymentStatus(
    orderCode = activeOrderCodeRef.current,
    silent = false,
  ) {
    if (!orderCode) return;
    paymentStatusMutation.mutate({ orderCode, silent });
  }

  function schedulePaymentStatusCheck(delay = PAYMENT_STATUS_DELAY_MS) {
    clearStatusTimer();

    if (!activeOrderCodeRef.current) return;

    if (statusAttemptsRef.current >= MAX_STATUS_ATTEMPTS) {
      setPaymentState("Đang chờ thanh toán");
      setStatusText(
        "Hệ thống vẫn đang chờ thanh toán. Bạn có thể giữ QR này hoặc tạo lại mã mới.",
      );
      return;
    }

    statusTimerRef.current = window.setTimeout(() => {
      checkPaymentStatus(activeOrderCodeRef.current, false);
    }, delay);
  }

  function showPaymentReceivedModal(message: string) {
    window.setTimeout(() => {
      modal.success({
        centered: true,
        title: "Thanh toán thành công",
        content: message,
        okText: "OK",
      });
    }, 0);
  }

  function clearPaymentAfterBankSuccess() {
    setAmountInput("");
    setPayment(null);
    setError("");
    setCopied(null);
    generatedAmountRef.current = null;
    clearDebounceTimer();
  }

  function generatePayosQr(nextAmount = amount, force = false) {
    if (nextAmount < MIN_DEPOSIT_AMOUNT) {
      setError(nextAmount > 0 ? "Số tiền nạp tối thiểu là 1.000 đ." : "");
      return;
    }

    if (nextAmount > MAX_DEPOSIT_AMOUNT) {
      setError("Số tiền nạp tối đa là 2.000.000.000 đ.");
      return;
    }

    if (!force && generatedAmountRef.current === nextAmount && payment) {
      scrollToQr();
      return;
    }

    setError("");
    setStatusText("Đang tạo mã QR...");
    setPaymentState("Đang tạo QR");
    createPaymentMutation.mutate(nextAmount);
  }

  function scheduleGenerateQr(nextAmount: number) {
    clearDebounceTimer();

    if (nextAmount < MIN_DEPOSIT_AMOUNT || nextAmount > MAX_DEPOSIT_AMOUNT) {
      return;
    }

    setStatusText("Đang chuẩn bị mã QR...");
    debounceTimerRef.current = window.setTimeout(() => {
      generatePayosQr(nextAmount);
    }, QR_CREATE_DEBOUNCE_MS);
  }

  function changeAmount(event: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatAmountInput(event.target.value);
    const nextAmount = parseAmount(formatted);
    setAmountInput(formatted);
    setError("");
    resetQrIfAmountChanged(nextAmount);
    scheduleGenerateQr(nextAmount);
  }

  function choosePreset(value: number) {
    setAmountInput(formatNumber(value));
    setError("");
    resetQrIfAmountChanged(value);
    scheduleGenerateQr(value);
  }

  async function refreshAccountSnapshot() {
    if (!refreshToken) return;

    try {
      const session = await refreshSession(refreshToken);
      dispatch(setCredentials(session));
      toast.success("Ví web đã được cộng Coin thành công.");
    } catch {
      toast.warning(
        "Chưa thể làm mới số dư ví. Vui lòng tải lại trang tài khoản.",
      );
    }
  }

  function resetDeposit() {
    setAmountInput("");
    setPayment(null);
    setError("");
    setStatusText("");
    setCopied(null);
    setPaymentState("Chưa tạo mã");
    generatedAmountRef.current = null;
    activeOrderCodeRef.current = "";
    statusAttemptsRef.current = 0;
    clearDebounceTimer();
    clearStatusTimer();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-4 pb-16 pt-24">
        <div className="mx-auto max-w-5xl">
          <DepositPageHeader />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Banknote size={16} className="text-amber-500" />
                  Chọn hoặc nhập số tiền cần nạp
                </h2>
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                  PayOS QR
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Gói nạp Coin</p>
                    <p className="text-xs text-gray-500">
                      Coin được cộng sau khi PayOS xác nhận giao dịch thành
                      công.
                    </p>
                  </div>
                </div>
              </div>

              <label className="mb-1.5 mt-5 block text-xs font-semibold text-gray-600">
                Số tiền muốn nạp
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9.,]*"
                  value={amountInput}
                  onChange={changeAmount}
                  placeholder="Nhập số tiền..."
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-14 text-sm font-semibold text-gray-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  VND
                </span>
              </div>
              <p className="mt-2 min-h-5 text-xs text-gray-400">
                Tối thiểu {formatVnd(MIN_DEPOSIT_AMOUNT)}. QR sẽ tự tạo sau khi
                bạn chọn hoặc nhập số tiền hợp lệ.
              </p>

              <div className="mt-5">
                <p className="mb-3 text-sm font-bold text-gray-700">
                  Chọn mệnh giá
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {DEPOSIT_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => choosePreset(preset)}
                      className={
                        "rounded-xl border p-3 text-left transition-all active:translate-y-px " +
                        (amount === preset
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:border-amber-200 hover:text-amber-600")
                      }
                    >
                      <span className="block text-sm font-black leading-tight">
                        {formatVnd(preset)}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-gray-400">
                        {formatNumber(preset)} Coin
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-sm">
                  <span className="font-semibold text-gray-500">Gói nạp</span>
                  <span className="font-bold text-gray-800">
                    {amount > 0 ? formatVnd(amount) : "Chưa chọn"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-3 text-sm">
                  <span className="font-semibold text-gray-500">
                    Phương thức
                  </span>
                  <span className="font-bold text-gray-800">PayOS QR</span>
                </div>
                <div className="flex items-center justify-between py-3 text-sm">
                  <span className="font-semibold text-gray-500">
                    Trạng thái
                  </span>
                  <span className="font-bold text-amber-600">
                    {paymentState}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-sm font-semibold text-gray-500">
                    Tổng thanh toán
                  </span>
                  <span className="text-xl font-black text-amber-600">
                    {amount > 0 ? formatVnd(amount) : "0 đ"}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              {statusText && !error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <Clock size={16} className="mt-0.5 shrink-0" />
                  <span>{statusText}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => generatePayosQr(amount, true)}
                disabled={!canCreateQr || createPaymentMutation.isPending}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 font-bold text-white transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 active:translate-y-px"
              >
                {createPaymentMutation.isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang tạo QR...
                  </>
                ) : isSameGeneratedAmount ? (
                  <>
                    <RefreshCw size={18} />
                    Tạo lại QR
                  </>
                ) : (
                  <>
                    <QrCode size={18} />
                    Tạo QR
                  </>
                )}
              </button>
            </section>

            <section
              ref={qrContainerRef}
              className="scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <QrCode size={16} className="text-amber-500" />
                  QR thanh toán
                </h2>
                <span
                  className={
                    "rounded-full border px-3 py-1 text-xs font-bold " +
                    (payment
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-teal-200 bg-teal-50 text-teal-700")
                  }
                >
                  {payment ? paymentState : "Sẵn sàng"}
                </span>
              </div>

              {!payment ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white text-amber-500">
                    <QrCode size={30} />
                  </div>
                  <h3 className="mb-1 text-base font-bold text-gray-800">
                    Mã thanh toán sẽ hiển thị tại đây
                  </h3>
                  <p className="max-w-xs text-sm leading-relaxed text-gray-500">
                    Chọn mệnh giá hoặc nhập số tiền để hệ thống tự tạo QR PayOS
                    cho tài khoản của bạn.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center">
                  <div className="mb-4 flex min-h-[292px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-4">
                    {payment.qr_image_url ? (
                      <img
                        src={payment.qr_image_url}
                        alt="QR PayOS nạp Coin"
                        className="w-full max-w-[280px] rounded-xl"
                      />
                    ) : (
                      <div className="flex h-64 w-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
                        Chưa nhận được ảnh QR từ PayOS
                      </div>
                    )}
                  </div>

                  <div className="mb-4 grid gap-2 text-left">
                    {[
                      [
                        "Số tiền",
                        formatVnd(payment.amount || amount),
                        "amount",
                      ],
                      ["Nội dung", payment.description, "description"],
                      ["Mã đơn", payment.order_code, "order"],
                    ].map(([label, value, key]) => (
                      <div
                        key={key}
                        className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 max-sm:grid-cols-1"
                      >
                        <span className="text-xs font-bold text-gray-400">
                          {label}
                        </span>
                        <span className="min-w-0 break-words text-sm font-bold text-gray-800">
                          {value}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copy(String(value), String(key))}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition-all hover:border-amber-200 hover:text-amber-600 active:translate-y-px max-sm:w-full"
                        >
                          {copied === key ? "Đã chép" : <Copy size={13} />}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href={payment.checkout_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white transition-all hover:bg-amber-600 active:translate-y-px"
                    >
                      Mở cổng thanh toán
                      <ExternalLink size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        checkPaymentStatus(payment.order_code, false)
                      }
                      disabled={paymentStatusMutation.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-300 py-3 text-sm font-bold text-amber-600 transition-all hover:bg-amber-50 disabled:opacity-60 active:translate-y-px"
                    >
                      {paymentStatusMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                      Kiểm tra thanh toán
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <CheckCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-600"
                />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Lưu ý khi thanh toán
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
                    Vui lòng giữ nguyên nội dung chuyển khoản do PayOS tạo. Sau
                    khi giao dịch thành công, hệ thống sẽ tự xác nhận và cộng
                    Coin.
                  </p>
                </div>
              </div>

              {payment && (
                <button
                  type="button"
                  onClick={resetDeposit}
                  className="mt-4 w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50 active:translate-y-px"
                >
                  Nạp thêm giao dịch khác
                </button>
              )}
            </section>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              to={PATH.ACCOUNT}
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700"
            >
              <Wallet size={16} />
              Xem ví của tôi
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default WalletDepositPage;
