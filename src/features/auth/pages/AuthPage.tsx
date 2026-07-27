import { useState } from "react";
import { Navigate } from "react-router-dom";

import { useAppSelector } from "@/app/store/hooks";
import { PirateAuthShell } from "@/features/auth/components/AuthShell";
import { PlayerLoginPanel } from "@/features/auth/components/LoginPanel";
import { PlayerRegisterPanel } from "@/features/auth/components/RegisterPanel";
import { PATH } from "@/shared/config/path";

type AuthMode = "login" | "register";

function PlayerAuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  if (accessToken) {
    return <Navigate to={PATH.ACCOUNT} replace />;
  }

  return (
    <PirateAuthShell>
      <div key={mode} className="animate-fade-in motion-reduce:animate-none">
        {mode === "login" ? (
          <PlayerLoginPanel onRegister={() => setMode("register")} />
        ) : (
          <PlayerRegisterPanel onLogin={() => setMode("login")} />
        )}
      </div>
    </PirateAuthShell>
  );
}

export default PlayerAuthPage;
