import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PirateAuthShell } from "@/features/auth/components/AuthShell";
import {
  DEMO_LOGIN,
  PlayerLoginPanel,
} from "@/features/auth/components/LoginPanel";
import { PlayerRegisterPanel } from "@/features/auth/components/RegisterPanel";

function DemoAccessCard() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(value: string, field: string) {
    await navigator.clipboard.writeText(value);
    setCopied(field);
    toast.success("Đã sao chép");
    setTimeout(() => setCopied(null), 1500);
  }
  return (
    <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <KeyRound size={14} className="text-gold" />
        <span className="text-xs font-600 uppercase tracking-wider text-gold">
          Tài Khoản Demo
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {[
          ["Tên tài khoản", DEMO_LOGIN.username, "username"],
          ["Mật khẩu", DEMO_LOGIN.password, "password"],
        ].map(([label, value, key]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg bg-navy-light px-3 py-2"
          >
            <div className="min-w-0">
              <p className="mb-0.5 text-2xs text-muted-foreground">{label}</p>
              <p className="truncate font-mono text-sm font-600 text-foreground">
                {value}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copy(value, key)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-gold/10 hover:text-gold"
              aria-label={`Sao chép ${label}`}
            >
              {copied === key ? (
                <Check size={14} className="text-teal-accent" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-2xs leading-relaxed text-muted-foreground">
        Dùng tài khoản này để trải nghiệm demo. Không dùng thông tin thật.
      </p>
    </div>
  );
}

function PlayerAuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  return (
    <PirateAuthShell>
      <div className="w-full">
        <div className="mb-7 flex border-b border-navy-border">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 pb-3 text-sm font-600 transition-all ${tab === "login" ? "tab-active" : "tab-inactive"}`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`flex-1 pb-3 text-sm font-600 transition-all ${tab === "register" ? "tab-active" : "tab-inactive"}`}
          >
            Đăng Ký
          </button>
        </div>
        <div className="animate-fade-in">
          {tab === "login" ? (
            <PlayerLoginPanel onRegister={() => setTab("register")} />
          ) : (
            <PlayerRegisterPanel onLogin={() => setTab("login")} />
          )}
        </div>
        {tab === "login" && (
          <div className="mt-6">
            <DemoAccessCard />
          </div>
        )}
      </div>
    </PirateAuthShell>
  );
}

export default PlayerAuthPage;
