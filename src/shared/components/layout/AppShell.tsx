import { Breadcrumb, Button, Drawer, Layout, Menu } from "antd";
import {
  BookText,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu as MenuIcon,
  Shirt,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

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
    icon: <BookText size={18} />,
  },
  {
    key: PATH.ADMIN_FASHION_COMPOSER,
    label: "Ghép fashion",
    icon: <Shirt size={18} />,
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
    <div className="flex h-full flex-col">
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
        theme="light"
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
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const currentPage = useMemo(
    () =>
      ADMIN_MENU.find((item) => item.key === location.pathname)?.label ??
      "Dashboard",
    [location.pathname],
  );

  return (
    <Layout className="min-h-[100dvh] !bg-[#f4f6f9]">
      <Sider
        width={264}
        collapsedWidth={84}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        className="!sticky !top-0 hidden !h-[100dvh] !max-h-[100dvh] !min-h-[100dvh] overflow-hidden lg:block bg-white shadow-md"
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
          <div className="flex items-center gap-2">
            <Button
              type="text"
              onClick={() => setCollapsed((value) => !value)}
              icon={
                collapsed ? (
                  <ChevronRight size={19} />
                ) : (
                  <ChevronLeft size={19} />
                )
              }
              className="hidden !h-10 !w-10 !items-center !justify-center !rounded-xl !text-slate-600 hover:!bg-amber-50 hover:!text-amber-700 lg:inline-flex"
              aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            />
            <Button
              type="text"
              onClick={() => setMobileOpen(true)}
              icon={<MenuIcon size={19} />}
              className="!flex !h-10 !w-10 !items-center !justify-center !rounded-xl !text-slate-600 hover:!bg-amber-50 hover:!text-amber-700 lg:!hidden"
              aria-label="Mở menu quản trị"
            />
          </div>

          <UserMenu showIdentity />
        </Header>

        <Content className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <div className="mb-8 border-b border-slate-200 pb-6">
              <Breadcrumb
                items={[{ title: "Quản trị" }, { title: currentPage }]}
                className="mb-4 text-xs"
              />
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {currentPage}
              </h1>
            </div>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
