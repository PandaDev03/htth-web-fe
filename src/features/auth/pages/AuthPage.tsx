import { Navigate, useLocation, useSearchParams } from "react-router-dom";

import { useAppSelector } from "@/app/store/hooks";
import { PirateAuthShell } from "@/features/auth/components/AuthShell";
import { PlayerLoginPanel } from "@/features/auth/components/LoginPanel";
import { PlayerRegisterPanel } from "@/features/auth/components/RegisterPanel";
import { getAuthRedirectPath } from "@/features/auth/lib/authRedirect";

type AuthMode = "login" | "register";

function PlayerAuthPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const redirectTo = getAuthRedirectPath(location.state);
  const mode: AuthMode =
    searchParams.get("mode") === "register" ? "register" : "login";
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  function setMode(nextMode: AuthMode) {
    setSearchParams(nextMode === "register" ? { mode: "register" } : {}, {
      replace: true,
    });
  }

  if (accessToken) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <PirateAuthShell>
      <div key={mode} className="animate-fade-in motion-reduce:animate-none">
        {mode === "login" ? (
          <PlayerLoginPanel
            onRegister={() => setMode("register")}
            redirectTo={redirectTo}
          />
        ) : (
          <PlayerRegisterPanel
            onLogin={() => setMode("login")}
            redirectTo={redirectTo}
          />
        )}
      </div>
    </PirateAuthShell>
  );
}

export default PlayerAuthPage;
