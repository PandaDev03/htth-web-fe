import { useEffect } from "react";

import { useAppDispatch } from "@/app/store/hooks";
import { refreshAuthSession } from "@/features/auth/model/authThunks";
import { getStoredRefreshToken } from "@/features/auth/model/tokenStorage";

export function AuthSessionBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) return;

    const request = dispatch(refreshAuthSession(refreshToken));

    return () => {
      request.abort();
    };
  }, [dispatch]);

  return null;
}
