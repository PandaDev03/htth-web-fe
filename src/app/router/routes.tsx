import { lazy } from 'react';
import type { AppRoute } from '@/app/router/routeTypes';

const PirateLandingPage = lazy(() => import('@/features/home/pages/HomePage'));
const GameDownloadPage = lazy(() => import('@/features/download/pages/DownloadPage'));
const PlayerAuthPage = lazy(() => import('@/features/auth/pages/AuthPage'));
const PlayerAccountPage = lazy(() => import('@/features/account/pages/AccountPage'));
const CoinExchangePage = lazy(() => import('@/features/coin/pages/CoinPage'));
const WalletDepositPage = lazy(() => import('@/features/deposit/pages/DepositPage'));

export const appRoutes: AppRoute[] = [
  { path: '/', element: <PirateLandingPage />, isPublic: true },
  { path: '/download-screen', element: <GameDownloadPage />, isPublic: true },
  { path: '/sign-up-login-screen', element: <PlayerAuthPage />, isPublic: true },
  { path: '/user-account', element: <PlayerAccountPage />, isPublic: true },
  { path: '/doi-coin', element: <CoinExchangePage />, isPublic: true },
  { path: '/nap-tien', element: <WalletDepositPage />, isPublic: true },
];
