import { AlertCircle, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAppDispatch } from "@/app/store/hooks";
import { registerAccount } from "@/features/auth/api/authApi";
import { setCredentials } from "@/features/auth/model/authSlice";

interface RegisterFields {
  username: string;
  password: string;
}

interface RegisterPanelProps {
  onLogin: () => void;
}

export function PlayerRegisterPanel({ onLogin }: RegisterPanelProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFields>({ defaultValues: { username: "", password: "" } });

  async function submit(data: RegisterFields) {
    setAuthError(null);
    setLoading(true);

    try {
      const session = await registerAccount({
        username: data.username.trim().toLowerCase(),
        password: data.password,
      });
      dispatch(setCredentials(session));
      toast.success("Đăng ký thành công! Tài khoản đã được tạo.");
      navigate("/user-account", { replace: true });
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
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-5" noValidate>
      <div>
        <h2 className="mb-1 text-xl font-700 text-foreground">Đăng Ký</h2>
        <p className="text-sm text-muted-foreground">
          Tạo tài khoản mới để bắt đầu hành trình
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
          Tên Tài Khoản <span className="text-red-light">*</span>
        </label>
        <p className="mb-1.5 text-xs text-muted-foreground">
          4-20 ký tự, chỉ chữ thường, số và dấu gạch dưới
        </p>
        <input
          type="text"
          placeholder="Ví dụ: pirate_hunter99"
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
        <label className="mb-1.5 block text-sm font-600 text-foreground">
          Mật Khẩu <span className="text-red-light">*</span>
        </label>
        <p className="mb-1.5 text-xs text-muted-foreground">
          Mật khẩu dùng để đăng nhập game và website
        </p>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu..."
            autoComplete="new-password"
            className={`input-field pr-10 ${errors.password ? "border-red-light" : ""}`}
            {...register("password", {
              required: "Vui lòng nhập mật khẩu",
              minLength: { value: 4, message: "Tối thiểu 4 ký tự" },
              maxLength: { value: 32, message: "Tối đa 32 ký tự" },
              pattern: {
                value: /^[a-zA-Z0-9@.]+$/,
                message: "Mật khẩu chỉ gồm chữ, số, @ hoặc dấu chấm",
              },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="text-red-light">*</span>Các trường bắt buộc phải điền
      </p>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary flex min-h-12 w-full items-center justify-center gap-2 py-3 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            <UserPlus size={18} />
            Tạo Tài Khoản
          </>
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <button type="button" onClick={onLogin} className="font-600 text-gold hover:text-gold-light">
          Đăng nhập ngay
        </button>
      </p>
    </form>
  );
}
