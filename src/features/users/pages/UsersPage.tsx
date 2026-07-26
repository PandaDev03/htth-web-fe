import { Card, Table, Tag, Typography } from "antd";

const columns = [
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Vai tro",
    dataIndex: "role",
    render: (role: string) => <Tag color="blue">{role}</Tag>,
  },
  {
    title: "Trang thai",
    dataIndex: "status",
  },
];

function UsersPage() {
  return (
    <div className="space-y-5">
      <div>
        <Typography.Title level={3} className="!mb-1">
          Nguoi dung
        </Typography.Title>
        <Typography.Text className="text-slate-500">
          Feature mau de gan API va mo rong CRUD.
        </Typography.Text>
      </div>

      <Card>
        <Table
          rowKey="email"
          columns={columns}
          dataSource={[]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default UsersPage;
