import { Card, Typography, Radio, Space } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function PaymentMethodSection() {
  // Placeholder state - will be handled later
  const paymentMethod = "vnpay";

  return (
    <div style={{ height: "100%" }}>
      <Title level={5} style={{ marginBottom: 16 }}>
        Phương thức thanh toán
      </Title>

      <div
        style={{
          padding: "20px",
          backgroundColor: "#fafafa",
          borderRadius: 8,
          border: "1px solid #e8e8e8",
        }}
      >
        <Radio.Group value={paymentMethod} style={{ width: "100%" }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Radio value="vnpay" style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px",
                  backgroundColor: "#fff",
                  borderRadius: 6,
                  border: "1px solid #e8e8e8",
                }}
              >
                <CreditCardOutlined
                  style={{
                    fontSize: "24px",
                    marginRight: 12,
                    color: "rgb(24, 144, 255)",
                  }}
                />
                <div>
                  <Text strong style={{ fontSize: "16px" }}>
                    VnPay
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "14px" }}>
                    Thanh toán qua cổng VnPay
                  </Text>
                </div>
              </div>
            </Radio>
          </Space>
        </Radio.Group>
      </div>
    </div>
  );
}
