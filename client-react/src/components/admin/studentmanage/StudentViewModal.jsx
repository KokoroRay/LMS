import React from "react";
import { Modal, Space, Avatar, Typography, Divider, Tag, Row, Col } from "antd"; // Thêm Row, Col
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const fmt = (v, f = "YYYY-MM-DD HH:mm") => {
  const d = v ? dayjs(v) : null;
  return d && d.isValid() ? d.format(f) : "N/A";
};
const STATUS_COLOR = (s) => (s === "ACTIVE" ? "green" : s === "PENDING" ? "orange" : "red");

// Component nhỏ để hiển thị một cặp thông tin
const DetailItem = ({ label, value, span = 12 }) => (
  <Col span={span} style={{ marginBottom: 8 }}>
    <Text strong>{label}:</Text> <Text>{value}</Text>
  </Col>
);

export default function StudentViewModal({ open, onClose, user }) {
  // Hàm render cho các giá trị dạng Tag hoặc Date
  const renderValue = (val) => val || "N/A";
  
  return (
    <Modal
      title="Chi tiết người dùng"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
    >
      {!user ? null : (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {/* PHẦN AVATAR VÀ TÊN */}
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <Avatar size={100} src={user.avatarUrl || undefined} icon={<UserOutlined />} />
            <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
              {user.firstName || user.lastName
                ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                : (user.username || "No name")}
            </Title>
            {user.username && <Text type="secondary">@{user.username}</Text>}
            <div style={{ marginTop: 4 }}>
                {user.status 
                    ? <Tag color={STATUS_COLOR(user.status)}>{user.status}</Tag> 
                    : <Tag>N/A</Tag>
                }
            </div>
          </div>
          <Divider style={{ margin: "8px 0" }} />

          {/* PHẦN THÔNG TIN CHI TIẾT (SỬ DỤNG ROW/COL ĐỂ CĂN CHỈNH THẲNG HÀNG) */}
          <Row gutter={[16, 8]}>
            {/* Hàng 1: Email và Phone */}
            <DetailItem label="Email" value={renderValue(user.email)} />
            <DetailItem label="Phone" value={renderValue(user.phone)} />

            {/* Hàng 2: Mã sinh viên và Lớp */}
            <DetailItem label="Mã sinh viên" value={renderValue(user.studentCode)} />
            <DetailItem label="Lớp" value={renderValue(user.className)} />

            {/* Hàng 3: Ngày sinh và Giới tính */}
            <DetailItem label="Ngày sinh" value={user.dateOfBirth ? fmt(user.dateOfBirth, "YYYY-MM-DD") : "N/A"} />
            <DetailItem label="Giới tính" value={renderValue(user.gender)} />

            {/* Hàng 4: Nghề nghiệp và Thành phố */}
            <DetailItem label="Nghề nghiệp" value={renderValue(user.occupation)} />
            <DetailItem label="Thành phố" value={renderValue(user.city)} />

            {/* Hàng 5: Quốc gia */}
            <DetailItem label="Quốc gia" value={renderValue(user.country)} span={24} />

            {/* Hàng 6: Địa chỉ (Full width) */}
            <Col span={24} style={{ marginBottom: 8 }}>
                <Text strong>Địa chỉ:</Text> <Text>{renderValue(user.address)}</Text>
            </Col>

            {/* Hàng 7: Bio (Full width) */}
            <Col span={24} style={{ marginBottom: 8 }}>
                <Text strong>Giới thiệu:</Text> <Text>{renderValue(user.bio)}</Text>
            </Col>
            
            <Divider dashed style={{ margin: "8px 0 16px" }} />
            
            {/* Hàng 8: Created/Updated */}
            <DetailItem label="Tạo lúc" value={user.createdAt ? fmt(user.createdAt) : "N/A"} />
            <DetailItem label="Cập nhật lúc" value={user.updatedAt ? fmt(user.updatedAt) : "N/A"} />
          </Row>
        </Space>
      )}
    </Modal>
  );
}