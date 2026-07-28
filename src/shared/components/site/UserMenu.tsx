import { Avatar, Dropdown, type MenuProps } from "antd";
import {
  ChevronDown,
  CircleDollarSign,
  Download,
  LayoutDashboard,
  LogOut,
  UserRound,
  WalletMinimal,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { logout } from "@/features/auth/model/authSlice";
import { PATH } from "@/shared/config/path";

type UserMenuProps = {
  compact?: boolean;
};

const MENU_PATHS = {
  account: PATH.ACCOUNT,
  download: PATH.DOWNLOAD,
  deposit: PATH.WALLET_DEPOSIT,
  exchange: PATH.COIN_EXCHANGE,
  dashboard: PATH.ADMIN_DASHBOARD,
} as const;

export function UserMenu({ compact = false }: UserMenuProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  const avatarSrc = user.avatar || undefined;

  const items: MenuProps["items"] = [
    ...(user.role === "admin"
      ? [
          {
            key: "dashboard",
            icon: <LayoutDashboard size={16} />,
            label: "Quản lý",
          },
          { type: "divider" as const },
        ]
      : []),
    {
      key: "account",
      icon: <UserRound size={16} />,
      label: "Tài khoản",
    },
    {
      key: "deposit",
      icon: <WalletMinimal size={16} />,
      label: "Nạp tiền",
    },
    { type: "divider" },
    {
      key: "exchange",
      icon: <CircleDollarSign size={16} />,
      label: "Đổi coin",
    },
    {
      key: "download",
      icon: <Download size={16} />,
      label: "Tải game",
    },
    { type: "divider" },
    {
      key: "logout",
      danger: true,
      icon: <LogOut size={16} />,
      label: "Đăng xuất",
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      dispatch(logout());

      toast.success("Đã đăng xuất.");
      navigate(PATH.HOME);

      return;
    }

    const path = MENU_PATHS[key as keyof typeof MENU_PATHS];
    if (path) navigate(path);
  };

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      menu={{
        items,
        onClick: handleMenuClick,
        selectable: false,
        style: { boxShadow: "none" },
      }}
      overlayStyle={{ width: 264 }}
      dropdownRender={(menu) => (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-2 shadow-[0_16px_40px_rgba(31,41,55,0.14)]">
          <Link
            to={PATH.ACCOUNT}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-amber-50"
          >
            <Avatar
              size={40}
              src={avatarSrc}
              icon={<UserRound size={20} />}
              alt={`${user.username} avatar`}
              className="shrink-0 bg-amber-500 text-white"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">
                {user.username}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Tài khoản người chơi
              </p>
            </div>
          </Link>
          <div className="mt-1 border-t border-gray-100 pt-1">{menu}</div>
        </div>
      )}
    >
      <button
        type="button"
        className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 text-gray-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        aria-label={`Mở menu tài khoản ${user.username}`}
      >
        <Avatar
          size={28}
          src={avatarSrc}
          icon={<UserRound size={15} />}
          alt={`${user.username} avatar`}
          className="bg-amber-500 text-white"
        />
        {!compact && (
          <>
            <span className="max-w-32 truncate text-sm font-semibold">
              {user.username}
            </span>
            <ChevronDown size={14} />
          </>
        )}
      </button>
    </Dropdown>
  );
}
