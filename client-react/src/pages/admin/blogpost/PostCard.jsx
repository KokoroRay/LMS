import React from "react";
import { Card, Tag, Button, Popconfirm, Typography } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { authorName, formatDate, formatCategoryDisplay, getDynamicTagColor } from "../../../utils/helpers";

const { Text } = Typography;

const PostCard = ({ post, onSelectView, onSelectEdit, onSelectDelete }) => {
  const coverMedia = () => {
    if (post.coverUrl) {
      return <img src={post.coverUrl} alt={post.title} />;
    }
    return (
      <div className="post-card-media-placeholder">
        📄
      </div>
    );
  };

  const statusColor =
    post.status === "PUBLISHED"
      ? "green"
      : post.status === "ARCHIVED"
      ? "orange"
      : "default";

  const categoryValue = post.postType || post.category || "FRONT_END";
  const tagColor = getDynamicTagColor(categoryValue);

  return (
    <Card className="post-card" cover={coverMedia()} hoverable>
      <div className="post-card-title">{post.title}</div>
      <div className="post-card-meta">
        By {authorName(post.author)} •{" "}
        {formatDate(post.publishedAt, "MMM DD, YYYY") || "Draft"}
      </div>
      <div className="post-card-tags">
        <Tag color={tagColor}>
          {formatCategoryDisplay(categoryValue)}
        </Tag>
        <Tag color={statusColor}>{post.status || "DRAFT"}</Tag>
      </div>
      <div className="post-card-footer">
        <Text
          type="secondary"
          style={{
            fontSize: 12,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          /{post.slug}
        </Text>
        <div className="post-card-actions">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onSelectView(post)}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onSelectEdit(post)}
          />
          <Popconfirm
            title="Xóa bài viết này?"
            onConfirm={() => onSelectDelete(post.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
