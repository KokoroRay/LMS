import React, { useEffect } from "react";
import { Modal, Button, Space, Typography, Tag, Row, Col } from "antd";
import { authorName, formatDate, formatCategoryDisplay, getDynamicTagColor } from "../../../utils/helpers";
import "highlight.js/styles/atom-one-dark.css";
import hljs from "highlight.js/lib/core";

const { Title, Text } = Typography;
const ViewPostModal = ({ post, open, onClose, onEdit }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const codeBlocks = document.querySelectorAll(".desc-box pre.ql-syntax");

        codeBlocks.forEach((block) => {
          block.removeAttribute("data-highlighted");
          hljs.highlightElement(block);
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, post]);

  if (!post) return null;

  const statusColor =
    post.status === "PUBLISHED"
      ? "green"
      : post.status === "ARCHIVED"
      ? "orange"
      : "default";
  
  const categoryValue = post.postType || post.category || "FRONT_END";
  const tagColor = getDynamicTagColor(categoryValue);

  return (
    <Modal
      title="Chi tiết bài viết"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button key="edit" type="primary" onClick={() => onEdit(post)}>
          Chỉnh sửa
        </Button>,
      ]}
      width={900}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div>
          <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
            {post.title}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            ID: {post.id} • Slug: /{post.slug}
          </Text>
        </div>
        <Space wrap>
          <Tag color={tagColor}>{formatCategoryDisplay(categoryValue)}</Tag>
          <Tag color={statusColor}>{post.status || "DRAFT"}</Tag>
          {post.author && <Tag>By {authorName(post.author)}</Tag>}
          {post.author?.email && <Tag>{post.author.email}</Tag>}
          {post.author?.role?.roleName && (
            <Tag color="blue">{post.author.role.roleName}</Tag>
          )}
        </Space>
        <Row gutter={[16, 16]}>
          {post.coverUrl && (
            <Col span={24}>
              <img
                src={post.coverUrl}
                alt="cover"
                style={{ width: "100%", borderRadius: 8 }}
              />
            </Col>
          )}
        </Row>
        <div>
          <Title level={5}>Nội dung</Title>
          <div
            className="desc-box ql-editor"
            style={{
              overflow: "visible",
              whiteSpace: "normal",
              lineHeight: 1.6,
            }}
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
        </div>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text type="secondary">Ngày tạo:</Text>
            <br />
            <Text strong>{formatDate(post.createdAt) || "N/A"}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">Ngày cập nhật:</Text>
            <br />
            <Text strong>{formatDate(post.updatedAt) || "N/A"}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">Ngày xuất bản:</Text>
            <br />
            <Text strong>
              {formatDate(post.publishedAt) || "Chưa xuất bản"}
            </Text>
          </Col>
        </Row>
      </Space>
    </Modal>
  );
};
export default ViewPostModal;
