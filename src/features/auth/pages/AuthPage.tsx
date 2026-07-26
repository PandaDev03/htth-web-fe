import { Navigate } from "react-router-dom";
import { useState } from "react";

import { useAppSelector } from "@/app/store/hooks";
import { PirateAuthShell } from "@/features/auth/components/AuthShell";
import { PlayerLoginPanel } from "@/features/auth/components/LoginPanel";
import { PlayerRegisterPanel } from "@/features/auth/components/RegisterPanel";

function PlayerAuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  if (accessToken) {
    return <Navigate to="/user-account" replace />;
  }

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
      </div>
    </PirateAuthShell>
  );
}

export default PlayerAuthPage;
