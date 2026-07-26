import { LogoutOutlined } from "@ant-design/icons";
import { Button, Layout, Menu, Typography } from "antd";
import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { appRoutes } from "@/app/router/routes";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { logout } from "@/features/auth/model/authSlice";
import { hasAllowedRole } from "@/shared/lib/access";

const { Header, Content, Sider } = Layout;

export function AppShell() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const menuItems = useMemo(() => {
    const protectedRoot = appRoutes.find((route) => route.path === "/");

    return protectedRoot?.children
      ?.filter((route) => route.showInMenu && hasAllowedRole(user?.role, route.allowedRoles))
      .map((route) => ({
        key: route.index ? "/" : `/${route.path ?? ""}`,
        icon: route.icon,
        label: route.title,
      }));
  }, [user?.role]);

  const selectedKey = location.pathname === "/" ? "/" : `/${location.pathname.split("/")[1]}`;

  return (
    <Layout className="min-h-screen">
      <Sider breakpoint="lg" collapsedWidth={0} width={248}>
        <div className="flex h-16 items-center px-5">
          <Typography.Text className="text-base font-semibold text-white">
            Hải tặc vui vẻ Admin
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <Typography.Text className="block text-sm text-slate-500">
              Xin chao
            </Typography.Text>
            <Typography.Text className="font-medium">
              {user?.name ?? "Quan tri vien"}
            </Typography.Text>
          </div>
          <Button
            icon={<LogoutOutlined />}
            onClick={() => {
              dispatch(logout());
              navigate("/sign-up-login-screen");
            }}
          >
            Dang xuat
          </Button>
        </Header>

        <Content className="p-4 sm:p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
