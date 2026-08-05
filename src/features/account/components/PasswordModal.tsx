import { useMutation } from "@tanstack/react-query";
import { Input } from "antd";
import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { changeAccountPassword } from "@/features/account/api/accountApi";
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
    return "Chỉ chấp nhận chữ thường và số";
  }

  return null;
}

export function AccountPasswordModal({ title, onClose }: PasswordModalProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const [saved, setSaved] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: changeAccountPassword,
    onSuccess: (result) => {
      setSaved(true);
      toast.success(result.message || "Đổi mật khẩu thành công.");
      window.setTimeout(onClose, 1200);
    },
  });

  const nextPasswordError = getPasswordError(next);
  const confirmError =
    confirm.length > 0 && next !== confirm
      ? "Mật khẩu xác nhận không khớp"
      : null;
  const requestError =
    changePasswordMutation.error instanceof Error
      ? changePasswordMutation.error.message
      : null;
  const canSave = Boolean(
    current &&
      next &&
      confirm &&
      !nextPasswordError &&
      !confirmError &&
      !changePasswordMutation.isPending,
  );

  const resetRequestError = () => {
    if (changePasswordMutation.isError) {
      changePasswordMutation.reset();
    }
  };

  const save = () => {
    if (!canSave) return;

    changePasswordMutation.mutate({
      currentPassword: current,
      newPassword: next,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="animate-slide-up w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={changePasswordMutation.isPending}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
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
            {requestError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-red-700"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed">{requestError}</p>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Mật khẩu hiện tại
              </label>
              <Input.Password
                value={current}
                onChange={(event) => {
                  setCurrent(event.target.value);
                  resetRequestError();
                }}
                placeholder="Nhập mật khẩu hiện tại..."
                autoComplete="current-password"
                disabled={changePasswordMutation.isPending}
                className="!h-[42px] !rounded-lg !border-gray-200 !px-3 !text-sm !text-gray-800 !shadow-none hover:!border-amber-300 focus-within:!border-amber-400 focus-within:!shadow-[0_0_0_2px_rgb(254_243_199)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Mật khẩu mới
              </label>
              <Input.Password
                value={next}
                onChange={(event) => {
                  setNext(event.target.value);
                  resetRequestError();
                }}
                placeholder="Nhập mật khẩu mới..."
                autoComplete="new-password"
                aria-describedby="account-next-password-hint"
                aria-invalid={Boolean(nextPasswordError)}
                status={nextPasswordError ? "error" : undefined}
                disabled={changePasswordMutation.isPending}
                className={[
                  "!h-[42px] !rounded-lg !px-3 !text-sm !text-gray-800 !shadow-none",
                  nextPasswordError
                    ? "focus-within:!shadow-[0_0_0_2px_rgb(254_226_226)]"
                    : "!border-gray-200 hover:!border-amber-300 focus-within:!border-amber-400 focus-within:!shadow-[0_0_0_2px_rgb(254_243_199)]",
                ].join(" ")}
              />
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
              <Input.Password
                value={confirm}
                onChange={(event) => {
                  setConfirm(event.target.value);
                  resetRequestError();
                }}
                placeholder="Nhập lại mật khẩu mới..."
                autoComplete="new-password"
                aria-invalid={Boolean(confirmError)}
                status={confirmError ? "error" : undefined}
                disabled={changePasswordMutation.isPending}
                className={[
                  "!h-[42px] !rounded-lg !px-3 !text-sm !text-gray-800 !shadow-none",
                  confirmError
                    ? "focus-within:!shadow-[0_0_0_2px_rgb(254_226_226)]"
                    : "!border-gray-200 hover:!border-amber-300 focus-within:!border-amber-400 focus-within:!shadow-[0_0_0_2px_rgb(254_243_199)]",
                ].join(" ")}
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
                disabled={changePasswordMutation.isPending}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!canSave}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu
                  </span>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
