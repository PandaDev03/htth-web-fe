import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
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
      navigate(state?.from?.pathname ?? "/user-account", { replace: true });
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
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-5" noValidate>
      <div>
        <h2 className="mb-1 text-xl font-700 text-foreground">Đăng Nhập</h2>
        <p className="text-sm text-muted-foreground">
          Nhập thông tin tài khoản để tiếp tục
        </p>
      </div>

      {authError && (
        <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-light" />
          <p className="text-sm text-red-light">{authError}</p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-600 text-foreground">
          Tên Tài Khoản
        </label>
        <input
          type="text"
          placeholder="Nhập tên tài khoản..."
          autoComplete="username"
          className={`input-field ${errors.username ? "border-red-light" : ""}`}
          {...register("username", {
            required: "Vui lòng nhập tên tài khoản",
            minLength: { value: 4, message: "Tối thiểu 4 ký tự" },
            maxLength: { value: 20, message: "Tối đa 20 ký tự" },
            pattern: {
              value: /^[a-z0-9_]+$/,
              message: "Chỉ chấp nhận chữ thường, số và dấu gạch dưới",
            },
            setValueAs: (value: string) => value.trim().toLowerCase(),
          })}
        />
        {errors.username && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-red-light">
            <AlertCircle size={12} />
            {errors.username.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-600 text-foreground">Mật Khẩu</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu..."
            autoComplete="current-password"
            className={`input-field pr-10 ${errors.password ? "border-red-light" : ""}`}
            {...register("password", {
              required: "Vui lòng nhập mật khẩu",
              minLength: { value: 4, message: "Tối thiểu 4 ký tự" },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Hiện hoặc ẩn mật khẩu"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-red-light">
            <AlertCircle size={12} />
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="rememberMe"
          className="mt-0.5 h-4 w-4 accent-primary"
          {...register("rememberMe")}
        />
        <label htmlFor="rememberMe" className="cursor-pointer select-none text-sm text-muted-foreground">
          Ghi nhớ đăng nhập
          <span className="mt-0.5 block text-2xs text-muted-foreground/80">
            Chỉ lưu tên tài khoản, không lưu mật khẩu.
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-1 flex min-h-12 w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            <LogIn size={18} />
            Đăng Nhập
          </>
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <button type="button" onClick={onRegister} className="font-600 text-gold hover:text-gold-light">
          Đăng ký ngay
        </button>
      </p>
    </form>
  );
}
