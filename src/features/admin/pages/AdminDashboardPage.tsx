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
  Tag,
} from "antd";
import {
  BadgeDollarSign,
  CircleDollarSign,
  LockKeyhole,
  RefreshCw,
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
} from "@/features/dashboard/api/dashboardApi";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";

type AddCoinFormValues = {
  username: string;
  amount: number;
};

type LockFormValues = {
  username: string;
  action: "lock" | "unlock";
};

const numberFormatter = new Intl.NumberFormat("vi-VN");
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

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
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không thể cộng Coin.");
    },
  });

  const lockMutation = useMutation({
    mutationFn: (values: LockFormValues) =>
      setAdminAccountLock(values.username, values.action === "lock"),
    onSuccess: (result) => {
      toast.success(result.message || "Đã cập nhật trạng thái tài khoản.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái tài khoản.",
      );
    },
  });

  const stats = statsQuery.data;

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7fb]">
      <Header />
      <main className="flex-1 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-7 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
                <ShieldCheck size={17} aria-hidden="true" />
                Khu vực quản trị
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Theo dõi tài khoản, doanh thu và xử lý nhanh các tác vụ vận hành.
              </p>
            </div>
            <Button
              icon={<RefreshCw size={15} />}
              loading={statsQuery.isFetching}
              onClick={() => void statsQuery.refetch()}
            >
              Làm mới
            </Button>
          </div>

          <section aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="mb-4 text-base font-bold text-gray-800">
              Thống kê tổng quan
            </h2>
            {statsQuery.isError && (
              <Alert
                className="mb-4"
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {statsQuery.isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="border-gray-200 shadow-sm">
                      <Skeleton active paragraph={{ rows: 1 }} />
                    </Card>
                  ))
                : (
                    [
                      {
                        key: "accounts",
                        label: "Tổng tài khoản",
                        value: stats?.totalAccounts ?? 0,
                        icon: <UsersRound size={21} />,
                        valueClass: "text-gray-900",
                        suffix: "tài khoản",
                        currency: false,
                      },
                      {
                        key: "active",
                        label: "Tài khoản đã kích hoạt",
                        value: stats?.activeAccounts ?? 0,
                        icon: <ShieldCheck size={21} />,
                        valueClass: "text-emerald-700",
                        suffix: "tài khoản",
                        currency: false,
                      },
                      {
                        key: "revenue",
                        label: "Doanh thu",
                        value: stats?.revenue ?? 0,
                        icon: <BadgeDollarSign size={21} />,
                        valueClass: "text-amber-700",
                        currency: true,
                      },
                    ] as const
                  ).map((item) => (
                    <Card
                      key={item.key}
                      className="border-gray-200 shadow-sm"
                      styles={{ body: { padding: 20 } }}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">
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
                          fontSize: 26,
                          fontWeight: 700,
                        }}
                        className={item.valueClass}
                      />
                      {"suffix" in item && (
                        <p className="mt-1 text-xs text-gray-400">{item.suffix}</p>
                      )}
                    </Card>
                  ))}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="tools-heading">
            <div className="mb-4">
              <h2 id="tools-heading" className="text-base font-bold text-gray-800">
                Công cụ tài khoản
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Các thao tác có hiệu lực ngay trên tài khoản được nhập.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card className="border-gray-200 shadow-sm">
                <div className="mb-5 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <WalletCards size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-800">Cộng ví web</h3>
                    <p className="mt-1 text-sm leading-5 text-gray-500">
                      Cộng trực tiếp vào số dư <code>account.coin</code>.
                    </p>
                  </div>
                </div>

                <Form<AddCoinFormValues>
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
                      { max: 255, message: "Tên tài khoản không hợp lệ." },
                    ]}
                  >
                    <Input autoComplete="off" placeholder="Nhập chính xác tên tài khoản" />
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
                    className="w-full sm:w-auto"
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

              <Card className="border-gray-200 shadow-sm">
                <div className="mb-5 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                    <LockKeyhole size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-800">Khóa hoặc mở khóa</h3>
                    <p className="mt-1 text-sm leading-5 text-gray-500">
                      Cập nhật trạng thái <code>account.lock</code>.
                    </p>
                  </div>
                </div>

                <Form<LockFormValues>
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
                      { max: 255, message: "Tên tài khoản không hợp lệ." },
                    ]}
                  >
                    <Input autoComplete="off" placeholder="Nhập chính xác tên tài khoản" />
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
                          className="w-full sm:w-auto"
                        >
                          {locking ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        </Button>
                      );
                    }}
                  </Form.Item>
                </Form>

                {lockMutation.data && (
                  <Alert
                    className="mt-4"
                    type={lockMutation.data.data.locked ? "warning" : "success"}
                    showIcon
                    message={
                      <span className="flex flex-wrap items-center gap-2">
                        <span>{lockMutation.data.data.username}</span>
                        <Tag color={lockMutation.data.data.locked ? "red" : "green"}>
                          {lockMutation.data.data.locked ? "Đã khóa" : "Đang mở"}
                        </Tag>
                      </span>
                    }
                  />
                )}
              </Card>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AdminDashboardPage;
