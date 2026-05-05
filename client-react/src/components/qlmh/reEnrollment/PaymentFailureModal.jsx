import { Modal, Typography, Button, Space } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

export default function PaymentFailureModal({ visible, onClose, errorMessage }) {
  const navigate = useNavigate();

  const handleRetry = () => {
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
        <CloseCircleOutlined
          style={{
            fontSize: 64,
            color: "#ff4d4f",
            marginBottom: 16,
          }}
        />
        <Title level={3} style={{ margin: 0, color: "#ff4d4f" }}>
          Thanh toán thất bại!
        </Title>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Text type="secondary" style={{ fontSize: 16 }}>
          {errorMessage || "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại."}
        </Text>
      </div>

      <Space>
        <Button
          type="primary"
          size="large"
          onClick={handleRetry}
          style={{
            minWidth: 150,
            height: 45,
          }}
        >
          Thử lại
        </Button>
      </Space>
    </Modal>
  );
}

