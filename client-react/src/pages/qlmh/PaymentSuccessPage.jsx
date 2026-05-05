import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, Typography, Button, Space, Divider } from "antd";
import { CheckCircleOutlined, HomeOutlined, DollarOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    // Lấy thông tin từ query params
    const transactionRef = searchParams.get("transactionRef");
    const amount = searchParams.get("amount");
    const transactionCode = searchParams.get("transactionCode");
    const vnpAmount = searchParams.get("vnp_Amount");
    const vnpTransactionNo = searchParams.get("vnp_TransactionNo");

    // Nếu có vnp_Amount từ VNPay, convert từ cent sang VNĐ
    let finalAmount = null;
    if (amount) {
      finalAmount = parseFloat(amount);
    } else if (vnpAmount) {
      finalAmount = parseInt(vnpAmount) / 100;
    }

    const finalTransactionCode = transactionCode || vnpTransactionNo || null;

    setPaymentInfo({
      amount: finalAmount,
      transactionCode: finalTransactionCode,
      transactionRef: transactionRef || null,
    });
  }, [searchParams]);

  const handleGoBack = () => {
    navigate("/qlmh/submit");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f2f5",
        padding: "24px",
      }}
    >
      <Card
        style={{
          maxWidth: 600,
          width: "100%",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
        bodyStyle={{ padding: "48px" }}
      >
        <div style={{ textAlign: "center" }}>
          {/* Icon Success */}
          <CheckCircleOutlined
            style={{
              fontSize: 80,
              color: "#52c41a",
              marginBottom: 24,
            }}
          />

          {/* Title */}
          <Title level={2} style={{ margin: 0, color: "#52c41a", marginBottom: 16 }}>
            Thanh toán thành công!
          </Title>

          {/* Description */}
          <Text type="secondary" style={{ fontSize: 16, display: "block", marginBottom: 32 }}>
            Bạn đã thanh toán thành công cho các môn học lại.
          </Text>

          {/* Payment Info */}
          {paymentInfo && (
            <Card
              style={{
                backgroundColor: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: 8,
                marginBottom: 32,
                textAlign: "left",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {paymentInfo.amount && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong style={{ fontSize: 16 }}>
                      <DollarOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                      Số tiền:
                    </Text>
                    <Text style={{ color: "#52c41a", fontSize: 20, fontWeight: 600 }}>
                      {paymentInfo.amount.toLocaleString("vi-VN")} VNĐ
                    </Text>
                  </div>
                )}

                {paymentInfo.transactionCode && (
                  <>
                    <Divider style={{ margin: "16px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text strong style={{ fontSize: 16 }}>
                        Mã giao dịch:
                      </Text>
                      <Text style={{ fontSize: 16, fontFamily: "monospace" }}>
                        {paymentInfo.transactionCode}
                      </Text>
                    </div>
                  </>
                )}

                {paymentInfo.transactionRef && (
                  <>
                    <Divider style={{ margin: "16px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text strong style={{ fontSize: 16 }}>
                        Mã giao dịch tham chiếu:
                      </Text>
                      <Text style={{ fontSize: 16, fontFamily: "monospace" }}>
                        {paymentInfo.transactionRef}
                      </Text>
                    </div>
                  </>
                )}
              </Space>
            </Card>
          )}

          {/* Action Button */}
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={handleGoBack}
            style={{
              minWidth: 200,
              height: 48,
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            Quay lại danh sách
          </Button>
        </div>
      </Card>
    </div>
  );
}

