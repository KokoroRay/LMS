import { Modal, Descriptions, Image, Tag, Space, Typography, Divider, Row, Col } from "antd";
import {
  BookOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function SubjectViewModalAmin({ open, courseData, onCancel }) {
  if (!courseData) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'DRAFT': return 'orange';
      case 'PUBLISHED': return 'blue';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'DRAFT': return 'Bản nháp';
      case 'PUBLISHED': return 'Đã xuất bản';
      default: return status;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'BEGINNER': return 'green';
      case 'INTERMEDIATE': return 'blue';
      case 'ADVANCED': return 'orange';
      case 'EXPERT': return 'red';
      default: return 'default';
    }
  };

  return (
    <Modal
      title={
        <Space>
          <BookOutlined style={{ color: "#1890ff" }} />
          <Title level={4} style={{ margin: 0 }}>
            Chi tiết khóa học
          </Title>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
      bodyStyle={{
        padding: '16px 20px',
        maxHeight: '75vh',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      <div style={{
        maxHeight: '65vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '4px'
      }}>
        {/* Header với hình ảnh và thông tin cơ bản */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col span={8}>
            <Image
              src={courseData.thumbnailUrl}
              alt={courseData.title}
              style={{
                width: '100%',
                height: 180,
                objectFit: 'cover',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}
              fallback="/images/Image 2.svg"
            />
          </Col>
          <Col span={16}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                {courseData.title}
              </Title>

              <Space wrap>
                <Tag color={getStatusColor(courseData.status)}>
                  {getStatusText(courseData.status)}
                </Tag>
                <Tag color={getLevelColor(courseData.level)}>
                  {courseData.level}
                </Tag>
                <Tag color="blue">
                  <DollarOutlined /> {courseData.price ? `${courseData.price.toLocaleString()} VNĐ` : 'Miễn phí'}
                </Tag>
              </Space>

              <Paragraph
                ellipsis={{ rows: 2, expandable: true }}
                style={{ margin: '12px 0' }}
              >
                {courseData.shortDescription}
              </Paragraph>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        {/* Thông tin chi tiết */}
        <Descriptions
          title="Thông tin chi tiết"
          bordered
          column={1}
          size="small"
        >
          <Descriptions.Item label="Mã khóa học">
            <Text code>{courseData.courseId}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Slug">
            <Text code>{courseData.slug}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Giảng viên">
            <Space>
              <UserOutlined />
              <Text strong>{courseData.instructorName || 'Chưa xác định'}</Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày tạo">
            <Space>
              <CalendarOutlined />
              <Text>{courseData.createdAt ? new Date(courseData.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Cập nhật lần cuối">
            <Space>
              <CalendarOutlined />
              <Text>{courseData.updatedAt ? new Date(courseData.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}</Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>

        {/* Mô tả chi tiết */}
        {courseData.description && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Title level={5}>Mô tả chi tiết</Title>
              <Paragraph style={{ textAlign: 'justify', marginBottom: 16 }}>
                {courseData.description}
              </Paragraph>
            </div>
          </>
        )}

        {/* Yêu cầu */}
        {courseData.requirements && courseData.requirements.length > 0 && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Title level={5}>Yêu cầu</Title>
              <ul style={{ marginBottom: 16 }}>
                {courseData.requirements.map((req, index) => (
                  <li key={index}>
                    <Text>{req}</Text>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Mục tiêu */}
        {courseData.objectives && courseData.objectives.length > 0 && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Title level={5}>Mục tiêu khóa học</Title>
              <ul style={{ marginBottom: 16 }}>
                {courseData.objectives.map((obj, index) => (
                  <li key={index}>
                    <Text>{obj}</Text>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Tags */}
        {courseData.tags && courseData.tags.length > 0 && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Title level={5}>Tags</Title>
              <Space wrap>
                {courseData.tags.map((tag, index) => (
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