import { Dropdown, Menu, type MenuProps } from "antd";
import { ChevronDown, LogIn, Menu as MenuIcon, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAppSelector } from "@/app/store/hooks";
import { PirateBrandMark } from "@/shared/components/site/BrandMark";
import { UserMenu } from "@/shared/components/site/UserMenu";
import { PATH } from "@/shared/config/path";

const wheelMenuItems = [
  { key: PATH.NIKA_WHEEL, label: "Vòng quay Nika" },
  { key: PATH.PET_WHEEL, label: "Vòng quay Pet" },
];

const WHEEL_MENU_KEY = "wheel";
const PUBLIC_NAV_ITEMS = [
  { label: "Trang Chủ", href: PATH.HOME },
  { label: "Bài viết", href: PATH.ARTICLES },
  { label: "Tải Game", href: PATH.DOWNLOAD },
  { label: "Đua Top", href: PATH.RANKING },
  { label: "Vòng quay", href: PATH.NIKA_WHEEL },
  { label: "Tích Điểm", href: PATH.WALLET_DEPOSIT },
  { label: "Đổi Coin", href: PATH.COIN_EXCHANGE },
];
const mobileNavItems: MenuProps["items"] = PUBLIC_NAV_ITEMS.map(({ href, label }) =>
  href === PATH.NIKA_WHEEL
    ? { key: WHEEL_MENU_KEY, label, children: wheelMenuItems }
    : { key: href, label },
);

function WheelNav({ label }: { label: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [openedBy, setOpenedBy] = useState<"pointer" | "keyboard" | null>(null);
  const open = openedBy !== null;
  const active = wheelMenuItems.some(({ key }) => key === pathname);
  const triggerClassName =
    "flex h-8 items-center gap-1.5 whitespace-nowrap text-sm transition-colors hover:text-amber-600 " +
    (active
      ? "font-semibold text-amber-600"
      : "font-medium text-gray-600");

  return (
    <Dropdown
      autoFocus={openedBy === "keyboard"}
      trigger={["hover"]}
      open={open}
      onOpenChange={(nextOpen) => setOpenedBy(nextOpen ? "pointer" : null)}
      menu={{
        items: wheelMenuItems,
        selectedKeys: active ? [pathname] : [],
        onClick: ({ key }) => {
          setOpenedBy(null);
          navigate(key);
        },
      }}
    >
      <Link
        to={PATH.NIKA_WHEEL}
        onClick={() => setOpenedBy(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpenedBy("keyboard");
          }
        }}
        className={triggerClassName}
        aria-current={pathname === PATH.NIKA_WHEEL ? "page" : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <ChevronDown size={15} aria-hidden="true" />
      </Link>
    </Dropdown>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { accessToken, serverId, user } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(accessToken && serverId && user);

  const isNavItemActive = (href: string) =>
    href === PATH.HOME
      ? pathname === PATH.HOME
      : pathname === href || pathname.startsWith(`${href}/`);
  const activeWheel = wheelMenuItems.find(({ key }) => isNavItemActive(key));
  const mobileSelectedKey =
    activeWheel?.key ?? PUBLIC_NAV_ITEMS.find(({ href }) => isNavItemActive(href))?.href;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex h-16 items-center justify-between">
            <Link to={PATH.HOME}>
              <PirateBrandMark />
            </Link>
            <nav className="hidden items-center gap-4 lg:flex xl:gap-6">
              {PUBLIC_NAV_ITEMS.map((item) => {
                if (item.href === PATH.NIKA_WHEEL) {
                  return <WheelNav key={item.href} label={item.label} />;
                }
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={
                      "flex items-center gap-1.5 text-sm transition-colors " +
                      (isNavItemActive(item.href)
                        ? "font-semibold text-amber-600 hover:text-amber-600"
                        : "font-medium text-gray-600 hover:text-amber-600")
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="hidden items-center lg:flex">
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
            <div className="flex items-center gap-2 lg:hidden">
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
                <MenuIcon size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Đóng menu"
        />
      )}
      <aside
        inert={!mobileOpen}
        className={
          "fixed right-0 top-0 z-50 h-full w-72 overflow-y-auto border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 lg:hidden " +
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
        <nav className="px-4 py-4">
          <Menu
            mode="inline"
            inlineIndent={16}
            items={mobileNavItems}
            selectedKeys={mobileSelectedKey ? [mobileSelectedKey] : []}
            defaultOpenKeys={activeWheel ? [WHEEL_MENU_KEY] : []}
            style={{ borderInlineEnd: 0 }}
            onClick={({ key }) => {
              setMobileOpen(false);
              navigate(key);
            }}
          />
        </nav>
      </aside>
    </>
  );
}
