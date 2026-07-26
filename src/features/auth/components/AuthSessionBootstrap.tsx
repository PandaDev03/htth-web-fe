import { useEffect } from "react";

import { useAppDispatch } from "@/app/store/hooks";
import { refreshSession } from "@/features/auth/api/authApi";
import { logout, setCredentials } from "@/features/auth/model/authSlice";
import { getStoredRefreshToken } from "@/features/auth/model/tokenStorage";

export function AuthSessionBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) return;

    let cancelled = false;

    refreshSession(refreshToken)
      .then((session) => {
        if (!cancelled) {
          dispatch(setCredentials(session));
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch(logout());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
}
