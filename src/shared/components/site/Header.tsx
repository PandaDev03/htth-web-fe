import { ChevronRight, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAppSelector } from "@/app/store/hooks";
import { PirateBrandMark } from "@/shared/components/site/BrandMark";
import { UserMenu } from "@/shared/components/site/UserMenu";
import { PATH } from "@/shared/config/path";

export function Header() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(accessToken && user);

  const PUBLIC_NAV_ITEMS = [
    { label: "Trang Chủ", href: PATH.HOME },
    { label: "Tải Game", href: PATH.DOWNLOAD },
    { label: "Đua Top", href: PATH.RANKING },
    { label: "Đổi Coin", href: PATH.COIN_EXCHANGE },
    { label: "Nạp Tiền", href: PATH.WALLET_DEPOSIT },
  ];

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm"
      >
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex h-16 items-center justify-between">
            <Link to={PATH.HOME}>
              <PirateBrandMark />
            </Link>
            <nav className="hidden items-center gap-4 md:flex lg:gap-6">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={
                    "flex items-center gap-1.5 text-sm transition-colors " +
                    (pathname === item.href
                      ? "font-semibold text-amber-600"
                      : "font-medium text-gray-600 hover:text-amber-600")
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="hidden items-center md:flex">
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <Link
                  to={PATH.AUTH}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:border-amber-300 hover:text-amber-600"
                >
                  <LogIn size={15} />
                  Đăng Nhập
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2 md:hidden">
              {isAuthenticated ? (
                <UserMenu compact />
              ) : (
                <Link
                  to={PATH.AUTH}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600"
                  aria-label="Đăng nhập"
                >
                  <LogIn size={18} />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Mở menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Đóng menu"
        />
      )}
      <aside
        className={
          "fixed right-0 top-0 z-50 h-full w-72 border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 md:hidden " +
          (mobileOpen ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <PirateBrandMark size={32} />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-4">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={
                "flex items-center gap-3 rounded-lg px-3 py-3 " +
                (pathname === item.href
                  ? "bg-amber-50 text-amber-600"
                  : "text-gray-600 hover:bg-gray-50")
              }
            >
              <span className="text-sm font-medium">{item.label}</span>
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
