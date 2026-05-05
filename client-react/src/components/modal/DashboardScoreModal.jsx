import React from "react";
import { Modal, Typography, Button } from "antd";
const { Title, Text } = Typography;

export default function DashboardScoreModal({ open, score, onClose }) {
  const isNumericScore = !isNaN(parseFloat(score));

  let displayContent;
  if (isNumericScore) {
    displayContent = `Điểm của bạn là: ${parseFloat(score).toFixed(1)}`;
  } else {
    displayContent = score;
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={560}
      styles={{ content: { borderRadius: 16 } }}
    >
      <div style={{ textAlign: "center", paddingTop: 4 }}>
        <img
          src="/images/status/complete.png"
          alt="Điểm của bạn"
          width={400}
          height={400}
          style={{ objectFit: "contain" }}
        />
        <Text
          type="secondary"
          style={{ display: "block", marginTop: 8, fontSize: 16 }}
        >
          Bài thi của bạn đã được nộp
        </Text>
        <Title level={2} style={{ marginTop: 6, minHeight: "1.2em" }}>
          {displayContent}
        </Title>
        <Button
          type="primary"
          onClick={onClose}
          style={{
            width: 80,
            height: 48,
            borderRadius: 8,
            backgroundColor: "#AB1F24",
            borderColor: "#AB1F24",
          }}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
}
