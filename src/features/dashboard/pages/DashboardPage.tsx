import { Card, Col, Row, Statistic, Typography } from "antd";

function DashboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <Typography.Title level={3} className="!mb-1">
          Dashboard
        </Typography.Title>
        <Typography.Text className="text-slate-500">
          Khung qu?n tr? m?i cho Hải tặc vui vẻ.
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Tai khoan" value={0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Tin tuc" value={0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Giao dich" value={0} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
