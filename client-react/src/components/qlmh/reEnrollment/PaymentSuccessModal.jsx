import { Modal, Typography, Button, Space } from "antd";
import { CheckCircleOutlined, HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

export default function PaymentSuccessModal({ visible, onClose, paymentInfo }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onClose();
    navigate("/qlmh/submit");
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      closable={true}
      width={500}
      styles={{
        body: {
          padding: "40px 24px",
          textAlign: "center",
        },
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <CheckCircleOutlined
          style={{
            fontSize: 64,
            color: "#52c41a",
            marginBottom: 16,
          }}
        />
        <Title level={3} style={{ margin: 0, color: "#52c41a" }}>
          Thanh toán thành công!
        </Title>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Bạn đã thanh toán thành công cho các môn học lại.
        </Text>
        {paymentInfo && (
          <div style={{ marginTop: 16, padding: "16px", backgroundColor: "#f5f5f5", borderRadius: 8 }}>
            <Text strong>Số tiền: </Text>
            <Text style={{ color: "#52c41a", fontSize: 18 }}>
              {paymentInfo.amount?.toLocaleString("vi-VN")} VNĐ
            </Text>
            <br />
            {paymentInfo.transactionCode && (
              <>
                <Text strong>Mã giao dịch: </Text>
                <Text>{paymentInfo.transactionCode}</Text>
              </>
            )}
          </div>
        )}
      </div>

      <Space>
        <Button
          type="primary"
          size="large"
          icon={<HomeOutlined />}
          onClick={handleGoHome}
          style={{
            minWidth: 150,
            height: 45,
          }}
        >
          Quay lại danh sách
        </Button>
      </Space>
    </Modal>
  );
}
