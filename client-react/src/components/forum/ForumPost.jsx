import React from "react";
import { Card, Typography, Space, Avatar, Button, Popconfirm } from "antd";
import {
  LikeOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  WarningOutlined,
  LikeFilled,
} from "@ant-design/icons";
import { formatDate } from "../../utils/forum";

const { Text, Paragraph } = Typography;

const authorName = (author) => {
  return (
    `${author?.firstName || ""} ${author?.lastName || ""}`.trim() ||
    "Người dùng"
  );
};

const ForumPost = ({
  post,
  onReply,
  onLike,
  onDelete,
  onReport,
  onEdit, // Add onEdit handler
  isNested = false,
  isAuthenticated = false,
}) => {
  const author = post.author || {};
  const formattedDate = formatDate(post.createdAt, "DD/MM/YYYY HH:mm") || "N/A";
  const content = post.content || "<p>Nội dung đang trống.</p>";
  
  const canModify = isAuthenticated && post.isAuthor;

  const handleDelete = () => onDelete(post.postId);
  const handleEdit = () => onEdit(post); // Pass the whole post object to the edit handler
  const handleReport = () => onReport(post.postId, post.topicId);
  const handleLike = () => onLike(post.postId, post.likedByCurrentUser);

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        width: '100%',
        marginBottom: isNested ? '12px' : '20px',
      }}
    >
      <Avatar
        size={isNested ? 32 : 40}
        src={author.avatarUrl}
        alt={authorName(author)}
        icon={<UserOutlined />}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            backgroundColor: isNested ? '#f7f9fa' : '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '8px',
            padding: isNested ? '8px 16px' : '16px', // Adjust padding based on nesting
          }}
        >
          <Space size={8} align="center">
            <Text strong style={{ fontSize: 14 }}>{authorName(author)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>•</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formattedDate}
              {post.edited && <span style={{ fontStyle: 'italic' }}> (đã sửa)</span>}
            </Text>
          </Space>
          
          <div
            className="post-content-wrapper ql-editor"
            style={{ marginTop: '4px', marginBottom: '8px' }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        <Space size={12} style={{ marginTop: '4px', paddingLeft: '8px' }}>
          <Button
            type="text"
            size="small"
            icon={post.likedByCurrentUser ? <LikeFilled style={{ color: '#1890ff' }}/> : <LikeOutlined />}
            onClick={handleLike}
            disabled={!isAuthenticated || post.isAuthor}
            style={{ fontWeight: post.likedByCurrentUser ? 'bold' : 'normal', color: post.likedByCurrentUser ? '#1890ff' : 'inherit' }}
          >
            {post.likeCount > 0 && post.likeCount}
          </Button>

          {!isNested && (
             <Button
                type="text"
                size="small"
                onClick={() => onReply(post.postId)}
                disabled={!isAuthenticated}
             >
                Trả lời
             </Button>
          )}

          {canModify && (
            <>
              <Button type="text" size="small" onClick={handleEdit}>Sửa</Button>
              <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={handleDelete} okText="Xóa" cancelText="Hủy">
                <Button type="text" danger size="small">Xóa</Button>
              </Popconfirm>
            </>
          )}
           
          {isAuthenticated && !canModify && (
            <Button type="text" danger size="small" onClick={handleReport}>Báo cáo</Button>
          )}
        </Space>

        {post.replies && post.replies.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {post.replies.map((reply) => (
              <ForumPost
                key={reply.postId}
                post={reply}
                onReply={onReply}
                onLike={onLike}
                onDelete={onDelete}
                onReport={onReport}
                onEdit={onEdit}
                isNested={true}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPost;

