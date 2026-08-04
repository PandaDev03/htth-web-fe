import { lazy } from "react";
import { Navigate } from "react-router-dom";

import type { AppRoute } from "@/app/router/routeTypes";
import { AppShell } from "@/shared/components/layout/AppShell";
import { PATH } from "@/shared/config/path";

const PirateLandingPage = lazy(() => import("@/features/home/pages/HomePage"));
const GameDownloadPage = lazy(
  () => import("@/features/download/pages/DownloadPage"),
);
const RankingPage = lazy(() => import("@/features/ranking/pages/RankingPage"));
const PlayerAuthPage = lazy(() => import("@/features/auth/pages/AuthPage"));
const PlayerAccountPage = lazy(
  () => import("@/features/account/pages/AccountPage"),
);
const CoinExchangePage = lazy(() => import("@/features/coin/pages/CoinPage"));
const WalletDepositPage = lazy(
  () => import("@/features/deposit/pages/DepositPage"),
);
const ArticlesPage = lazy(
  () => import("@/features/articles/pages/ArticlesPage"),
);
const ArticlePage = lazy(() => import("@/features/articles/pages/ArticlePage"));
const AdminDashboardPage = lazy(
  () => import("@/features/admin/pages/AdminDashboardPage"),
);
const AdminArticlesPage = lazy(
  () => import("@/features/admin/pages/AdminArticlesPage"),
);

export const appRoutes: AppRoute[] = [
  { path: PATH.HOME, element: <PirateLandingPage />, isPublic: true },
  { path: PATH.DOWNLOAD, element: <GameDownloadPage />, isPublic: true },
  { path: PATH.RANKING, element: <RankingPage />, isPublic: true },
  { path: PATH.ARTICLES, element: <ArticlesPage />, isPublic: true },
  { path: PATH.ARTICLE_DETAIL, element: <ArticlePage />, isPublic: true },
  { path: PATH.AUTH, element: <PlayerAuthPage />, isPublic: true },
  {
    path: PATH.ACCOUNT,
    element: <PlayerAccountPage />,
    allowedRoles: ["user", "moderator", "admin"],
  },
  {
    path: PATH.COIN_EXCHANGE,
    element: <CoinExchangePage />,
    allowedRoles: ["user", "moderator", "admin"],
  },
  {
    path: PATH.WALLET_DEPOSIT,
    element: <WalletDepositPage />,
    allowedRoles: ["user", "moderator", "admin"],
  },
  {
    path: PATH.ADMIN_ROOT,
    element: <AppShell />,
    allowedRoles: ["admin"],
    children: [
      { index: true, element: <Navigate to={PATH.ADMIN_DASHBOARD} replace /> },
      {
        path: "dashboard",
        title: "Dashboard",
        element: <AdminDashboardPage />,
        allowedRoles: ["admin"],
        showInMenu: true,
      },
      {
        path: "articles",
        title: "Bài viết",
        element: <AdminArticlesPage />,
        allowedRoles: ["admin"],
        showInMenu: true,
      },
    ],
  },
];
