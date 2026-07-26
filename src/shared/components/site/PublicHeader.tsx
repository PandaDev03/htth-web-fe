import { PirateBrandMark } from "@/shared/components/site/BrandMark";
import { ChevronRight, Download, LogIn, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const PUBLIC_NAV_ITEMS = [
  { label: "Trang Chủ", href: "/" },
  { label: "Tải Game", href: "/download-screen" },
  { label: "Đổi Coin", href: "/doi-coin" },
  { label: "Nạp Tiền", href: "/nap-tien" },
];

export function PublicTopbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={
          "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 " +
          (scrolled
            ? "border-gray-200 bg-white shadow-sm"
            : "border-gray-100 bg-white/95")
        }
      >
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex h-16 items-center justify-between">
            <Link to="/">
              <PirateBrandMark />
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
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
            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/sign-up-login-screen"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:border-amber-300 hover:text-amber-600"
              >
                <LogIn size={15} />
                Đăng Nhập
              </Link>
              <Link
                to="/download-screen"
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-600"
              >
                <Download size={15} />
                Tải Game
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
              aria-label="Mở menu"
            >
              <Menu size={22} />
            </button>
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
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 border-t border-gray-100 px-4 py-5">
          <Link
            to="/sign-up-login-screen"
            onClick={() => setMobileOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600"
          >
            <LogIn size={15} />
            Đăng Nhập
          </Link>
          <Link
            to="/download-screen"
            onClick={() => setMobileOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white"
          >
            <Download size={15} />
            Tải Game
          </Link>
        </div>
      </aside>
    </>
  );
}
