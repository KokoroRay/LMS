import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, Typography, Button, Space } from "antd";
import { CloseCircleOutlined, ReloadOutlined, HomeOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    
    // Nếu có vnp_ResponseCode, tạo message dựa trên mã lỗi
    let finalError = error;
    if (!finalError && vnpResponseCode) {
      if (vnpResponseCode !== "00") {
        finalError = `Mã lỗi: ${vnpResponseCode}. Thanh toán thất bại. Vui lòng thử lại.`;
      }
    }
    
    setErrorMessage(finalError || "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.");
  }, [searchParams]);

  const handleRetry = () => {
    navigate("/qlmh/submit");
  };

  const handleGoHome = () => {
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
          {/* Icon Failure */}
          <CloseCircleOutlined
            style={{
              fontSize: 80,
              color: "#ff4d4f",
              marginBottom: 24,
            }}
          />

          {/* Title */}
          <Title level={2} style={{ margin: 0, color: "#ff4d4f", marginBottom: 16 }}>
            Thanh toán thất bại!
          </Title>

          {/* Error Message */}
          <Card
            style={{
              backgroundColor: "#fff2f0",
              border: "1px solid #ffccc7",
              borderRadius: 8,
              marginBottom: 32,
              textAlign: "left",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <Paragraph
              style={{
                margin: 0,
                fontSize: 16,
                color: "#595959",
                lineHeight: 1.6,
              }}
            >
              {errorMessage}
            </Paragraph>
          </Card>

          {/* Action Buttons */}
          <Space size="middle">
            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleRetry}
              style={{
                minWidth: 150,
                height: 48,
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              Thử lại
            </Button>
            <Button
              size="large"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
              style={{
                minWidth: 150,
                height: 48,
                fontSize: 16,
              }}
            >
              Về trang chủ
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}

