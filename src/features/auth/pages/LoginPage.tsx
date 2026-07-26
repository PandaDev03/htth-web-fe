import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Form, Input, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "@/app/store/hooks";
import { setCredentials } from "@/features/auth/model/authSlice";

type LoginFormValues = {
  email: string;
  password: string;
};

function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  function handleSubmit(values: LoginFormValues) {
    dispatch(
      setCredentials({
        accessToken: "dev-token",
        user: {
          id: "1",
          email: values.email,
          name: "Admin Hải tặc vui vẻ",
          role: "admin",
        },
      }),
    );
    navigate("/");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <section className="w-full max-w-[420px] rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <Typography.Title level={2} className="!mb-1">
          Hải tặc vui vẻ Admin
        </Typography.Title>
        <Typography.Paragraph className="!mb-6 text-slate-500">
          Dang nhap de quan ly he thong web.
        </Typography.Paragraph>

        <Form<LoginFormValues>
          layout="vertical"
          initialValues={{ email: "admin@htth.local", password: "admin123" }}
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Vui long nhap email" }]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin@htth.local" />
          </Form.Item>
          <Form.Item
            label="Mat khau"
            name="password"
            rules={[{ required: true, message: "Vui long nhap mat khau" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mat khau" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Dang nhap
          </Button>
        </Form>
      </section>
    </main>
  );
}

export default LoginPage;
