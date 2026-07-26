import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import type { AppRoute } from "@/app/router/routeTypes";
import { useAppSelector } from "@/app/store/hooks";
import { hasAllowedRole } from "@/shared/lib/access";

type GuardedRouteProps = {
  route: AppRoute;
  children: ReactNode;
};

export function GuardedRoute({ route, children }: GuardedRouteProps) {
  const location = useLocation();
  const { accessToken, user } = useAppSelector((state) => state.auth);

  if (route.isPublic) {
    return children;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasAllowedRole(user?.role, route.allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
