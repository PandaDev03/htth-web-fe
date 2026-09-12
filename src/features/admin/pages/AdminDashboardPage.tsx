import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Statistic,
} from "antd";
import {
  BadgeDollarSign,
  CircleDollarSign,
  Gift,
  LockKeyhole,
  Radio,
  RefreshCw,
  Repeat2,
  ShieldCheck,
  UnlockKeyhole,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import {
  addAdminWalletCoin,
  getAdminDashboardStats,
  setAdminAccountLock,
  type AdminDashboardMetrics,
  type AdminDashboardServerStats,
} from "@/features/dashboard/api/dashboardApi";

type AddCoinFormValues = { username: string; amount: number };
type LockFormValues = { username: string; action: "lock" | "unlock" };
const numberFormatter = new Intl.NumberFormat("vi-VN");
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function ServerBreakdownCard({ server }: { server: AdminDashboardServerStats }) {
  if (server.status === "error" || !server.metrics) {
    return (
      <Card className="border-red-200 shadow-sm">
        <h3 className="font-bold text-slate-800">{server.displayName}</h3>
        <Alert
          className="mt-3"
          type="error"
          showIcon
          message={server.error || "Không thể tải dữ liệu server."}
        />
      </Card>
    );
  }

  const metrics: Array<{
    key: keyof AdminDashboardMetrics;
    label: string;
    currency?: boolean;
  }> = [
    { key: "totalAccounts", label: "Tài khoản" },
    { key: "activeAccounts", label: "Đã kích hoạt" },
    { key: "totalPlayers", label: "Nhân vật" },
    { key: "onlineAccounts", label: "Đang online" },
    { key: "revenue", label: "Doanh thu", currency: true },
    { key: "pendingRecharge", label: "Nạp đang chờ" },
    { key: "pendingCoinConversions", label: "Đổi Coin đang chờ" },
    { key: "pendingGifts", label: "Quà đang chờ" },
  ];

  return (
    <Card className="border-slate-200 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800">{server.displayName}</h3>
          <p className="mt-1 font-mono text-xs text-slate-400">
            {server.serverId}
          </p>
        </div>
        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          Hoạt động
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((item) => (
          <div key={item.key}>
            <dt className="text-xs font-medium text-slate-400">{item.label}</dt>
            <dd className="mt-1 font-mono text-sm font-bold text-slate-800">
              {item.currency
                ? currencyFormatter.format(server.metrics?.[item.key] ?? 0)
                : numberFormatter.format(server.metrics?.[item.key] ?? 0)}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function AdminDashboardPage() {
  const [coinForm] = Form.useForm<AddCoinFormValues>();
  const [lockForm] = Form.useForm<LockFormValues>();
  const statsQuery = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboardStats,
  });

  const addCoinMutation = useMutation({
    mutationFn: (values: AddCoinFormValues) =>
      addAdminWalletCoin(values.username, values.amount),
    onSuccess: (result) => {
      toast.success(result.message || "Đã cộng Coin vào ví web.");
      coinForm.resetFields(["amount"]);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Không thể cộng Coin.",
      ),
  });
  const lockMutation = useMutation({
    mutationFn: (values: LockFormValues) =>
      setAdminAccountLock(values.username, values.action === "lock"),
    onSuccess: (result) =>
      toast.success(result.message || "Đã cập nhật trạng thái tài khoản."),
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái tài khoản.",
      ),
  });
  const stats = statsQuery.data;

  const statItems = [
    {
      key: "accounts",
      label: "Tổng tài khoản",
      value: stats?.totalAccounts ?? 0,
      icon: <UsersRound size={20} />,
      color: "text-slate-900",
      suffix: "tài khoản",
      currency: false,
    },
    {
      key: "active",
      label: "Đã kích hoạt",
      value: stats?.activeAccounts ?? 0,
      icon: <ShieldCheck size={20} />,
      color: "text-emerald-700",
      suffix: "tài khoản",
      currency: false,
    },
    {
      key: "players",
      label: "Tổng nhân vật",
      value: stats?.totalPlayers ?? 0,
      icon: <UsersRound size={20} />,
      color: "text-slate-900",
      suffix: "nhân vật",
      currency: false,
    },
    {
      key: "online",
      label: "Đang online",
      value: stats?.onlineAccounts ?? 0,
      icon: <Radio size={20} />,
      color: "text-emerald-700",
      suffix: "tài khoản",
      currency: false,
    },
    {
      key: "revenue",
      label: "Doanh thu",
      value: stats?.revenue ?? 0,
      icon: <BadgeDollarSign size={20} />,
      color: "text-amber-700",
      suffix: "từ giao dịch nạp",
      currency: true,
    },
    {
      key: "pending-recharge",
      label: "Nạp đang chờ",
      value: stats?.pendingRecharge ?? 0,
      icon: <WalletCards size={20} />,
      color: "text-amber-700",
      suffix: "yêu cầu",
      currency: false,
    },
    {
      key: "pending-conversion",
      label: "Đổi Coin đang chờ",
      value: stats?.pendingCoinConversions ?? 0,
      icon: <Repeat2 size={20} />,
      color: "text-amber-700",
      suffix: "yêu cầu",
      currency: false,
    },
    {
      key: "pending-gift",
      label: "Quà đang chờ",
      value: stats?.pendingGifts ?? 0,
      icon: <Gift size={20} />,
      color: "text-amber-700",
      suffix: "phần quà",
      currency: false,
    },
  ] as const;

  return (
    <div className="space-y-8">
      {statsQuery.isError && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải thống kê"
          description={
            statsQuery.error instanceof Error
              ? statsQuery.error.message
              : "Vui lòng thử lại sau."
          }
          action={
            <Button size="small" onClick={() => void statsQuery.refetch()}>
              Thử lại
            </Button>
          }
        />
      )}
      {stats?.partial && (
        <Alert
          type="warning"
          showIcon
          message="Thống kê chưa đầy đủ"
          description="Một game server đang lỗi kết nối. Tổng số bên dưới chỉ gồm các server tải thành công."
        />
      )}
      <section aria-labelledby="stats-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="stats-heading" className="text-base font-bold text-slate-800">
            Thống kê tổng quan
          </h2>
          <Button
            size="small"
            icon={<RefreshCw size={14} />}
            loading={statsQuery.isFetching}
            onClick={() => void statsQuery.refetch()}
          >
            Làm mới
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsQuery.isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="border-slate-200 shadow-sm">
                  <Skeleton active paragraph={{ rows: 1 }} />
                </Card>
              ))
            : statItems.map((item) => (
                <Card
                  key={item.key}
                  className="border-slate-200 shadow-sm"
                  styles={{ body: { padding: 20 } }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      {item.label}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      {item.icon}
                    </span>
                  </div>
                  <Statistic
                    value={item.value}
                    formatter={(value) =>
                      item.currency
                        ? currencyFormatter.format(Number(value))
                        : numberFormatter.format(Number(value))
                    }
                    valueStyle={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 25,
                      fontWeight: 700,
                    }}
                    className={item.color}
                  />
                  <p className="mt-1 text-xs text-slate-400">{item.suffix}</p>
                </Card>
              ))}
        </div>
      </section>

      {stats && (
        <section aria-labelledby="server-breakdown-heading">
          <div className="mb-4">
            <h2
              id="server-breakdown-heading"
              className="text-base font-bold text-slate-800"
            >
              Chi tiết từng server
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Số liệu được truy vấn độc lập từ database của mỗi server.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {stats.servers.map((server) => (
              <ServerBreakdownCard key={server.serverId} server={server} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="tools-heading">
        <div className="mb-4">
          <h2 id="tools-heading" className="text-base font-bold text-slate-800">
            Công cụ tài khoản
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Các thao tác hiện chỉ áp dụng cho tài khoản Server 1.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card
            className="border-slate-200 shadow-sm"
            styles={{ body: { padding: 24 } }}
          >
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <WalletCards size={20} />
              </span>
              <div>
                <h3 className="font-bold text-slate-800">Cộng ví web</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Cộng trực tiếp vào số dư <code>account.coin</code>.
                </p>
              </div>
            </div>
            <Form
              form={coinForm}
              layout="vertical"
              requiredMark={false}
              onFinish={(values) => addCoinMutation.mutate(values)}
            >
              <Form.Item
                name="username"
                label="Tên tài khoản"
                rules={[
                  { required: true, message: "Vui lòng nhập tên tài khoản." },
                ]}
              >
                <Input
                  autoComplete="off"
                  placeholder="Nhập chính xác tên tài khoản"
                />
              </Form.Item>
              <Form.Item
                name="amount"
                label="Số Coin cộng thêm"
                rules={[
                  { required: true, message: "Vui lòng nhập số Coin." },
                  {
                    type: "number",
                    min: 1,
                    message: "Số Coin phải lớn hơn 0.",
                  },
                ]}
              >
                <InputNumber<number>
                  className="w-full"
                  min={1}
                  max={2_147_483_647}
                  precision={0}
                  controls={false}
                  placeholder="Ví dụ: 100000"
                  formatter={(value) =>
                    value === undefined ? "" : numberFormatter.format(value)
                  }
                  parser={(value) => Number((value || "").replace(/\D/g, ""))}
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CircleDollarSign size={16} />}
                loading={addCoinMutation.isPending}
              >
                Xác nhận cộng Coin
              </Button>
            </Form>
            {addCoinMutation.data && (
              <Alert
                className="mt-4"
                type="success"
                showIcon
                message={`${addCoinMutation.data.data.username}: ${numberFormatter.format(addCoinMutation.data.data.coin)} Coin`}
              />
            )}
          </Card>

          <Card
            className="border-slate-200 shadow-sm"
            styles={{ body: { padding: 24 } }}
          >
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <LockKeyhole size={20} />
              </span>
              <div>
                <h3 className="font-bold text-slate-800">Khóa hoặc mở khóa</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Cập nhật trạng thái <code>account.lock</code>.
                </p>
              </div>
            </div>
            <Form
              form={lockForm}
              layout="vertical"
              requiredMark={false}
              initialValues={{ action: "lock" }}
              onFinish={(values) => lockMutation.mutate(values)}
            >
              <Form.Item
                name="username"
                label="Tên tài khoản"
                rules={[
                  { required: true, message: "Vui lòng nhập tên tài khoản." },
                ]}
              >
                <Input
                  autoComplete="off"
                  placeholder="Nhập chính xác tên tài khoản"
                />
              </Form.Item>
              <Form.Item name="action" label="Thao tác">
                <Select
                  options={[
                    { value: "lock", label: "Khóa tài khoản" },
                    { value: "unlock", label: "Mở khóa tài khoản" },
                  ]}
                />
              </Form.Item>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => {
                  const locking = getFieldValue("action") === "lock";
                  return (
                    <Button
                      type={locking ? "default" : "primary"}
                      danger={locking}
                      htmlType="submit"
                      icon={
                        locking ? (
                          <LockKeyhole size={16} />
                        ) : (
                          <UnlockKeyhole size={16} />
                        )
                      }
                      loading={lockMutation.isPending}
                    >
                      {locking ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                    </Button>
                  );
                }}
              </Form.Item>
            </Form>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
