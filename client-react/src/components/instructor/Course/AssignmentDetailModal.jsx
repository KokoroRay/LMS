// src/components/instructor/Course/AssignmentDetailModal.jsx
import React from "react";
import { Modal, Typography, Tag, Divider } from "antd";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

export default function AssignmentDetailModal({ modal, setModal, editing }) {
  const a = editing.assignment;
  return (
    <Modal
      open={modal.viewAssignment}
      onCancel={() => setModal(m => ({ ...m, viewAssignment: false }))}
      footer={null}
      title="Chi tiết bài tập"
      width={760}
      destroyOnClose
    >
      {a ? (
        <>
          <Title level={4} style={{ marginTop: 0 }}>{a.title}</Title>
          <Paragraph style={{ whiteSpace: "pre-wrap" }}>{a.description || "—"}</Paragraph>
          <Divider />
          <Text strong>Điểm tối đa: </Text>{a.maxScore ?? 100}<br />
          <Text strong>Ngày đăng: </Text>{a.postedAt ? dayjs(a.postedAt).format("DD/MM/YYYY HH:mm") : "—"}<br />
          <Text strong>Hạn nộp: </Text>{a.dueDate ? dayjs(a.dueDate).format("DD/MM/YYYY HH:mm") : "—"}<br />
          <div style={{ marginTop: 8 }}>
            <Tag color={a.allowLate ? "green" : "default"}>
              {a.allowLate ? "Cho phép nộp trễ" : "Không nộp trễ"}
            </Tag>
          </div>
        </>
      ) : (
        <Text>Không có dữ liệu</Text>
      )}
    </Modal>
  );
}
