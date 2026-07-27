import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogIn,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAppDispatch } from "@/app/store/hooks";
import { login } from "@/features/auth/api/authApi";
import { setCredentials } from "@/features/auth/model/authSlice";
import {
  clearRememberedUsername,
  getRememberedUsername,
  setRememberedUsername,
} from "@/features/auth/model/tokenStorage";
import { PATH } from "@/shared/config/path";

interface LoginFields {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface LoginPanelProps {
  onRegister: () => void;
}

type LocationState = {
  from?: {
    pathname?: string;
  };
};

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

export function PlayerLoginPanel({ onRegister }: LoginPanelProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const rememberedUsername = getRememberedUsername();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    defaultValues: {
      username: rememberedUsername,
      password: "",
      rememberMe: Boolean(rememberedUsername),
    },
  });

  async function submit(data: LoginFields) {
    setAuthError(null);
    setLoading(true);

    try {
      const username = data.username.trim().toLowerCase();
      const session = await login({ username, password: data.password });
      dispatch(setCredentials(session));

      if (data.rememberMe) {
        setRememberedUsername(username);
      } else {
        clearRememberedUsername();
      }

      toast.success("Đăng nhập thành công! Chào mừng trở lại.");
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? PATH.ACCOUNT, { replace: true });
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Thông tin đăng nhập không đúng.",
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
          <LogIn size={24} strokeWidth={1.8} />
        </span>
        <h1 className="text-2xl font-800 tracking-tight text-gray-900">
          Chào mừng trở lại
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
          Đăng nhập để tiếp tục hành trình hải tặc của bạn
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
          htmlFor="login-username"
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
            id="login-username"
            type="text"
            placeholder="Nhập tên tài khoản"
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            aria-invalid={Boolean(errors.username)}
            className={getInputClassName(Boolean(errors.username))}
            {...register("username", {
              required: "Vui lòng nhập tên tài khoản",
              maxLength: { value: 255, message: "Tên tài khoản không hợp lệ" },
              setValueAs: normalizeUsername,
            })}
          />
        </div>
        {errors.username && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={12} />
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
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
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            className={getInputClassName(Boolean(errors.password), true)}
            {...register("password", {
              required: "Vui lòng nhập mật khẩu",
              maxLength: { value: 255, message: "Mật khẩu không hợp lệ" },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 motion-reduce:transition-none"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={12} />
            {errors.password.message}
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-600">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-amber-600"
          {...register("rememberMe")}
        />
        <span className="font-600 text-gray-700">Ghi nhớ đăng nhập</span>
      </label>

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
            Đang đăng nhập
          </>
        ) : (
          "Đăng nhập"
        )}
      </button>

      <p className="pt-1 text-center text-sm text-gray-500">
        Chưa có tài khoản?{" "}
        <button
          type="button"
          onClick={onRegister}
          className="font-700 text-amber-700 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Đăng ký ngay
        </button>
      </p>
    </form>
  );
}
