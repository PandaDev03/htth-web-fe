import type { Location } from "react-router-dom";

import { PATH } from "@/shared/config/path";

type AuthRedirectState = {
  from?: Pick<Location, "pathname" | "search" | "hash">;
};

export function getAuthRedirectPath(state: unknown): string {
  if (!state || typeof state !== "object") {
    return PATH.ACCOUNT;
  }

  const { from } = state as AuthRedirectState;
  const pathname = typeof from?.pathname === "string" ? from.pathname.trim() : "";

  if (!pathname || !pathname.startsWith("/") || pathname === PATH.AUTH) {
    return PATH.ACCOUNT;
  }

  return `${pathname}${from?.search ?? ""}${from?.hash ?? ""}`;
}
