import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAppDispatch } from "@/app/store/hooks";
import { registerAccount } from "@/features/auth/api/authApi";
import {
  GAME_ACCOUNT_MAX_LENGTH,
  GAME_ACCOUNT_MIN_LENGTH,
  GAME_ACCOUNT_PASSWORD_HINT,
  GAME_ACCOUNT_PASSWORD_PATTERN,
  GAME_ACCOUNT_USERNAME_HINT,
  GAME_ACCOUNT_USERNAME_PATTERN,
} from "@/features/auth/model/accountRules";
import { setCredentials } from "@/features/auth/model/authSlice";

interface RegisterFields {
  username: string;
  password: string;
}

interface RegisterPanelProps {
  onLogin: () => void;
  redirectTo: string;
}

const inputClassName =
  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50/90 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100 motion-reduce:transition-none";

const normalizeUsername = (value: string) => value.trim().toLowerCase();

function getInputClassName(hasError: boolean, hasTrailingAction = false) {
  return [
    inputClassName,
    hasTrailingAction ? "pr-12" : "",
    hasError ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function PlayerRegisterPanel({ onLogin, redirectTo }: RegisterPanelProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFields>({
    defaultValues: { username: "", password: "" },
  });

  async function submit(data: RegisterFields) {
    setAuthError(null);
    setLoading(true);

    try {
      const session = await registerAccount({
        username: data.username.trim().toLowerCase(),
        password: data.password,
      });

      dispatch(setCredentials(session));
      toast.success(
        "Đăng ký tài khoản thành công! Tài khoản đã sẵn sàng để vào game.",
      );

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Không thể tạo tài khoản, vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <header className="mb-1 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-700 shadow-[0_10px_26px_rgba(217,119,6,0.14)]">
          <UserPlus size={24} strokeWidth={1.8} />
        </span>
        <h1 className="text-2xl font-800 tracking-tight text-gray-900">
          Tạo tài khoản mới
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
          Một tài khoản dùng chung cho website và game
        </p>
      </header>

      {authError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-red-700"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">{authError}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="register-username"
          className="block text-sm font-600 text-gray-700"
        >
          Tên tài khoản
        </label>
        <div className="relative">
          <UserRound
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            id="register-username"
            type="text"
            placeholder="Ví dụ: haitac.vuive"
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            aria-describedby="register-username-hint"
            aria-invalid={Boolean(errors.username)}
            className={getInputClassName(Boolean(errors.username))}
            {...register("username", {
              required: "Vui lòng nhập tên tài khoản",
              minLength: {
                value: GAME_ACCOUNT_MIN_LENGTH,
                message: "Tối thiểu 6 ký tự",
              },
              maxLength: {
                value: GAME_ACCOUNT_MAX_LENGTH,
                message: "Tối đa 30 ký tự",
              },
              pattern: {
                value: GAME_ACCOUNT_USERNAME_PATTERN,
                message: "Chỉ chấp nhận chữ cái và số",
              },
              setValueAs: normalizeUsername,
            })}
          />
        </div>
        {errors.username ? (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={12} />
            {errors.username.message}
          </p>
        ) : (
          <p
            id="register-username-hint"
            className="text-xs leading-relaxed text-gray-500"
          >
            {GAME_ACCOUNT_USERNAME_HINT}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="register-password"
          className="block text-sm font-600 text-gray-700"
        >
          Mật khẩu
        </label>
        <div className="relative">
          <KeyRound
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu"
            autoComplete="new-password"
            aria-describedby="register-password-hint"
            aria-invalid={Boolean(errors.password)}
            className={getInputClassName(Boolean(errors.password), true)}
            {...register("password", {
              required: "Vui lòng nhập mật khẩu",
              minLength: {
                value: GAME_ACCOUNT_MIN_LENGTH,
                message: "Tối thiểu 6 ký tự",
              },
              maxLength: {
                value: GAME_ACCOUNT_MAX_LENGTH,
                message: "Tối đa 30 ký tự",
              },
              pattern: {
                value: GAME_ACCOUNT_PASSWORD_PATTERN,
                message: "Chỉ chấp nhận chữ cái và số",
              },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 motion-reduce:transition-none"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password ? (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={12} />
            {errors.password.message}
          </p>
        ) : (
          <p
            id="register-password-hint"
            className="text-xs leading-relaxed text-gray-500"
          >
            {GAME_ACCOUNT_PASSWORD_HINT}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-700 text-white shadow-[0_10px_24px_rgba(17,24,39,0.18)] transition hover:-translate-y-0.5 hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
      >
        {loading ? (
          <>
            <Loader2
              size={18}
              className="animate-spin motion-reduce:animate-none"
            />
            Đang tạo tài khoản
          </>
        ) : (
          "Tạo tài khoản"
        )}
      </button>

      <p className="pt-1 text-center text-sm text-gray-500">
        Đã có tài khoản?{" "}
        <button
          type="button"
          onClick={onLogin}
          className="font-700 text-amber-700 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Đăng nhập
        </button>
      </p>
    </form>
  );
}
