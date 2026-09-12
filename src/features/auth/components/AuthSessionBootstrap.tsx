import { useEffect } from "react";

import { useAppDispatch } from "@/app/store/hooks";
import { refreshAuthSession } from "@/features/auth/model/authThunks";
import { getStoredAuthSession } from "@/features/auth/model/tokenStorage";

export function AuthSessionBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const refreshToken = getStoredAuthSession()?.refreshToken;

    if (!refreshToken) return;

    const request = dispatch(refreshAuthSession(refreshToken));

    return () => {
      request.abort();
    };
  }, [dispatch]);

  return null;
}
