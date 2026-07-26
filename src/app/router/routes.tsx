import {
  DashboardOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { lazy } from "react";

import type { AppRoute } from "@/app/router/routeTypes";
import { AppShell } from "@/shared/components/layout/AppShell";

const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const UsersPage = lazy(() => import("@/features/users/pages/UsersPage"));

export const appRoutes: AppRoute[] = [
  {
    path: "/login",
    element: <LoginPage />,
    isPublic: true,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        title: "Dashboard",
        icon: <DashboardOutlined />,
        element: <DashboardPage />,
        allowedRoles: ["admin", "moderator", "user"],
        showInMenu: true,
      },
      {
        path: "users",
        title: "Nguoi dung",
        icon: <TeamOutlined />,
        element: <UsersPage />,
        allowedRoles: ["admin", "moderator"],
        showInMenu: true,
      },
    ],
  },
];
