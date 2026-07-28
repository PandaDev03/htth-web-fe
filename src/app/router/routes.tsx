import { lazy } from "react";

import type { AppRoute } from "@/app/router/routeTypes";
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

export const appRoutes: AppRoute[] = [
  { path: PATH.HOME, element: <PirateLandingPage />, isPublic: true },
  { path: PATH.DOWNLOAD, element: <GameDownloadPage />, isPublic: true },
  { path: PATH.RANKING, element: <RankingPage />, isPublic: true },
  {
    path: PATH.AUTH,
    element: <PlayerAuthPage />,
    isPublic: true,
  },
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
];
