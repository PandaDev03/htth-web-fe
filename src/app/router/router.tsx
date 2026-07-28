import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";

import { appRoutes } from "@/app/router/routes";
import type { AppRoute } from "@/app/router/routeTypes";
import { GuardedRoute } from "@/shared/components/GuardedRoute";
import { PageLoader } from "@/shared/components/PageLoader";
import { PATH } from "@/shared/config/path";

function toRouteObject(route: AppRoute): RouteObject {
  if (route.index) {
    return {
      index: true,
      element: (
        <PageLoader>
          <GuardedRoute route={route}>{route.element}</GuardedRoute>
        </PageLoader>
      ),
    };
  }

  return {
    path: route.path,
    element: (
      <PageLoader>
        <GuardedRoute route={route}>{route.element}</GuardedRoute>
      </PageLoader>
    ),
    children: route.children?.map(toRouteObject),
  };
}

export const router = createBrowserRouter([
  ...appRoutes.map(toRouteObject),
  {
    path: "*",
    element: <Navigate to={PATH.HOME} replace />,
  },
]);

