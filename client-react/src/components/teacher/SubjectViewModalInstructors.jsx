import { Modal, Descriptions, Image, Tag, Space, Typography, Divider, Row, Col } from "antd";
import {
  BookOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function SubjectViewModalInstructors({ open, subjectData, onCancel }) {
  if (!subjectData) return null;

  const getStatusColor = (status) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "ACTIVE": return "green";
      case "PUBLISHED": return "blue";
      case "INACTIVE": return "orange";
      case "ARCHIVED": return "red";
      case "DRAFT":
      default: return "default";
    }
  };

  const getStatusText = (status) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "ACTIVE": return "Hoạt động";
      case "PUBLISHED": return "Đã xuất bản";
      case "INACTIVE": return "Tạm dừng";
      case "ARCHIVED": return "Ngừng";
      case "DRAFT":
      default: return "Bản nháp";
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "BEGINNER": return "green";
      case "INTERMEDIATE": return "blue";
      case "ADVANCED": return "orange";
      case "EXPERT": return "red";
      default: return "default";
    }
  };

  const id = subjectData.subjectId ?? subjectData.courseId ?? subjectData.id ?? "N/A";

  return (
    <Modal
      title={
        <Space>
          <BookOutlined style={{ color: "#1890ff" }} />
          <Title level={4} style={{ margin: 0 }}>
            Chi tiết môn học
          </Title>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
      bodyStyle={{
        padding: "16px 20px",
        maxHeight: "75vh",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxHeight: "65vh",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "4px",
        }}
      >
        {/* Header: ảnh + info cơ bản */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col span={8}>
            <Image
              src={subjectData.thumbnailUrl}
              alt={subjectData.title}
              style={{
                width: "100%",
                height: 180,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #f0f0f0",
              }}
              fallback="/images/Image 2.svg"
            />
          </Col>
          <Col span={16}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                {subjectData.title}
              </Title>

              <Space wrap>
                <Tag color={getStatusColor(subjectData.status)}>
                  {getStatusText(subjectData.status)}
                </Tag>
                <Tag color={getLevelColor(subjectData.level)}>
                  {subjectData.level}
                </Tag>
                <Tag color="blue">
                  <DollarOutlined />{" "}
                  {subjectData.price ? `${Number(subjectData.price).toLocaleString()} VNĐ` : "Miễn phí"}
                </Tag>
              </Space>

              <Paragraph ellipsis={{ rows: 2, expandable: true }} style={{ margin: "12px 0" }}>
                {subjectData.shortDescription}
              </Paragraph>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        {/* Thông tin chi tiết */}
        <Descriptions title="Thông tin chi tiết" bordered column={1} size="small">
          <Descriptions.Item label="Mã môn học">
            <Text code>{id}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Slug">
            <Text code>{subjectData.slug}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Giảng viên">
            <Space>
              <UserOutlined />
              <Text strong>{subjectData.instructorName || "Chưa xác định"}</Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày tạo">
            <Space>
              <CalendarOutlined />
              <Text>
                {subjectData.createdAt
                  ? new Date(subjectData.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Cập nhật lần cuối">
            <Space>
              <CalendarOutlined />
              <Text>
                {subjectData.updatedAt
                  ? new Date(subjectData.updatedAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>

        {/* Mô tả chi tiết */}
        {subjectData.description && (
          <>
            <Divider style={{ margin: "16px 0" }} />
            <div>
              <Title level={5}>Mô tả chi tiết</Title>
              <Paragraph style={{ textAlign: "justify", marginBottom: 16 }}>
                {subjectData.description}
              </Paragraph>
            </div>
          </>
        )}

        {/* Yêu cầu */}
        {Array.isArray(subjectData.requirements) && subjectData.requirements.length > 0 && (
          <>
            <Divider style={{ margin: "16px 0" }} />
            <div>
              <Title level={5}>Yêu cầu</Title>
              <ul style={{ marginBottom: 16 }}>
                {subjectData.requirements.map((req, index) => (
                  <li key={index}>
                    <Text>{req}</Text>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Mục tiêu */}
        {Array.isArray(subjectData.objectives) && subjectData.objectives.length > 0 && (
          <>
            <Divider style={{ margin: "16px 0" }} />
            <div>
              <Title level={5}>Mục tiêu môn học</Title>
              <ul style={{ marginBottom: 16 }}>
                {subjectData.objectives.map((obj, index) => (
                  <li key={index}>
                    <Text>{obj}</Text>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Tags */}
        {Array.isArray(subjectData.tags) && subjectData.tags.length > 0 && (
          <>
            <Divider style={{ margin: "16px 0" }} />
            <div>
              <Title level={5}>Tags</Title>
              <Space wrap>
                {subjectData.tags.map((tag, index) => (
                  <Tag key={index} color="blue">
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
