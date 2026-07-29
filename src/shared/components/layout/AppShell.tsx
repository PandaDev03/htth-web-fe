import { Drawer, Layout, Menu, Tooltip } from "antd";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu as MenuIcon,
  Newspaper,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAppSelector } from "@/app/store/hooks";
import { PirateBrandMark } from "@/shared/components/site/BrandMark";
import { UserMenu } from "@/shared/components/site/UserMenu";
import { PATH } from "@/shared/config/path";

const { Header, Content, Sider } = Layout;

const ADMIN_MENU = [
  {
    key: PATH.ADMIN_DASHBOARD,
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    key: PATH.ADMIN_ARTICLES,
    label: "Bài viết",
    icon: <Newspaper size={18} />,
  },
];

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex h-full flex-col bg-[#111827]">
      <Link
        to={PATH.HOME}
        onClick={onNavigate}
        className={`flex h-20 shrink-0 items-center border-b border-white/10 transition-all ${collapsed ? "justify-center px-2" : "px-5"}`}
        aria-label="Về trang chủ"
      >
        <PirateBrandMark size={36} showText={!collapsed} dark />
      </Link>

      {!collapsed && (
        <div className="px-5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Quản trị hệ thống
        </div>
      )}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[pathname]}
        items={ADMIN_MENU}
        inlineCollapsed={collapsed}
        onClick={({ key }) => {
          navigate(key);
          onNavigate?.();
        }}
        className="border-0 !bg-transparent px-3 [&_.ant-menu-item]:!my-1 [&_.ant-menu-item]:!h-11 [&_.ant-menu-item]:!rounded-xl [&_.ant-menu-item-selected]:!bg-amber-500 [&_.ant-menu-item-selected]:!text-white"
      />

      {!collapsed && (
        <div className="mt-auto border-t border-white/10 px-5 py-5">
          <p className="text-xs font-semibold text-slate-300">
            Hải tặc vui vẻ Admin
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Không gian vận hành dành riêng cho quản trị viên.
          </p>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const currentPage = useMemo(
    () =>
      ADMIN_MENU.find((item) => item.key === location.pathname)?.label ??
      "Quản trị",
    [location.pathname],
  );

  return (
    <Layout className="min-h-[100dvh] !bg-[#f4f6f9]">
      <Sider
        width={264}
        collapsedWidth={84}
        collapsed={collapsed}
        trigger={null}
        className="!sticky !top-0 hidden !h-[100dvh] !max-h-[100dvh] !min-h-[100dvh] overflow-hidden lg:block"
      >
        <SidebarContent collapsed={collapsed} />
      </Sider>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="left"
        width={280}
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        <SidebarContent
          collapsed={false}
          onNavigate={() => setMobileOpen(false)}
        />
      </Drawer>

      <Layout className="min-w-0 !bg-[#f4f6f9]">
        <Header className="!sticky !top-0 !z-40 flex !h-16 items-center justify-between border-b border-slate-200/90 !bg-white/95 !px-4 !leading-normal shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur sm:!px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 lg:hidden"
              aria-label="Mở menu quản trị"
            >
              <MenuIcon size={19} />
            </button>
            <Tooltip title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}>
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 lg:flex"
                aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
              >
                {collapsed ? (
                  <ChevronRight size={18} />
                ) : (
                  <ChevronLeft size={18} />
                )}
              </button>
            </Tooltip>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {currentPage}
              </p>
              <p className="hidden text-xs text-slate-400 sm:block">
                Khu vực quản trị
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-xs font-bold text-slate-800">
                {user?.username ?? "Admin"}
              </p>
              <p className="text-[11px] text-slate-400">Quản trị viên</p>
            </div>
            <UserMenu compact />
          </div>
        </Header>

        <Content className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
