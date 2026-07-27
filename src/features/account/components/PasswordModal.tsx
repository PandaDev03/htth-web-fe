import { AlertCircle, CheckCircle, Eye, EyeOff, XCircle } from "lucide-react";
import { useState } from "react";

import {
  GAME_ACCOUNT_MAX_LENGTH,
  GAME_ACCOUNT_MIN_LENGTH,
  GAME_ACCOUNT_PASSWORD_HINT,
  GAME_ACCOUNT_PASSWORD_PATTERN,
} from "@/features/auth/model/accountRules";

interface PasswordModalProps {
  title: string;
  onClose: () => void;
}

function getPasswordError(value: string) {
  if (!value) return null;

  if (value.length < GAME_ACCOUNT_MIN_LENGTH) {
    return "Tối thiểu 6 ký tự";
  }

  if (value.length > GAME_ACCOUNT_MAX_LENGTH) {
    return "Tối đa 30 ký tự";
  }

  if (!GAME_ACCOUNT_PASSWORD_PATTERN.test(value)) {
    return "Chỉ chấp nhận chữ cái và số";
  }

  return null;
}

export function AccountPasswordModal({ title, onClose }: PasswordModalProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saved, setSaved] = useState(false);

  const nextPasswordError = getPasswordError(next);
  const confirmError = confirm && next !== confirm ? "Mật khẩu xác nhận không khớp" : null;
  const canSave = Boolean(current && next && confirm && !nextPasswordError && !confirmError);

  const save = () => {
    if (!canSave) return;

    setSaved(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="animate-slide-up w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle size={20} />
          </button>
        </div>
        {saved ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle size={40} className="text-green-500" />
            <p className="text-sm font-semibold text-gray-700">
              Đã cập nhật thành công!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={current}
                  onChange={(event) => setCurrent(event.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm text-gray-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showNext ? "text" : "password"}
                  value={next}
                  onChange={(event) => setNext(event.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  aria-describedby="account-next-password-hint"
                  aria-invalid={Boolean(nextPasswordError)}
                  className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 ${
                    nextPasswordError
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-gray-200 focus:border-amber-400 focus:ring-amber-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNext((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {nextPasswordError ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle size={12} />
                  {nextPasswordError}
                </p>
              ) : (
                <p
                  id="account-next-password-hint"
                  className="mt-1.5 text-xs leading-relaxed text-gray-500"
                >
                  {GAME_ACCOUNT_PASSWORD_HINT}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                aria-invalid={Boolean(confirmError)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 ${
                  confirmError
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-amber-400 focus:ring-amber-100"
                }`}
              />
              {confirmError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle size={12} />
                  {confirmError}
                </p>
              )}
            </div>
            <div className="mt-1 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!canSave}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
