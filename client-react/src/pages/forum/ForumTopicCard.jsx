import React from "react";
import { Card, Typography, Space, Tag, Avatar, Grid, Divider } from "antd";
import {
  PushpinFilled,
  ClockCircleOutlined,
  MessageOutlined,
  UserOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { authorName, formatDate } from "../../utils/forum";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const BRAND_COLOR = "#FF7F00";
const ACCENT_COLOR = "#1890ff";

const ForumTopicCard = ({ topic, onClick }) => {
  const author = topic.author || {};
  const screens = useBreakpoint();

  const postedTime = topic.createdAt;
  const timeAgo = postedTime ? formatDate(postedTime, "time ago") : "N/A";

  const categoryName = topic.categoryTag || "Chưa phân loại";

  const postCount = topic.postCount != null ? topic.postCount : 0;
  const viewCount = topic.viewCount || 0;

  return (
    <Card
      hoverable
      onClick={() => onClick(topic.topicId)}
      style={{
        marginBottom: 16,
        borderRadius: 0,
        border: "none",
        borderBottom: "1px solid #f0f0f0",
        backgroundColor: topic.pinned ? "#fffaf0" : "#ffffff",
        transition: "background-color 0.3s",
        cursor: "pointer",
      }}
      bodyStyle={{
        padding: screens.md ? "18px 24px" : "14px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <Title
          level={4}
          style={{
            margin: 0,
            fontSize: screens.md ? 19 : 16,
            lineHeight: 1.3,
            fontWeight: topic.pinned ? 700 : 600,
            color: topic.pinned ? BRAND_COLOR : "#333",
          }}
        >
          {topic.pinned && (
            <PushpinFilled
              style={{ color: BRAND_COLOR, marginRight: 8, fontSize: 16 }}
            />
          )}
          {topic.title || "No Title"}
        </Title>

        <Space
          size={10}
          split={<Divider type="vertical" />}
          style={{ marginTop: 8, opacity: 0.8, flexWrap: "wrap" }}
        >
          <Tag
            color={categoryName === "Global" ? "default" : "geekblue"}
            style={{ borderRadius: 4, fontWeight: 500 }}
          >
            {categoryName}
          </Tag>

          <Space size={4}>
            <Avatar
              size="small"
              src={author.avatarUrl}
              icon={<UserOutlined />}
              style={{ background: ACCENT_COLOR }}
            />
            <Text type="secondary" style={{ fontSize: 13 }}>
              {authorName(author)}
            </Text>
          </Space>

          <Text type="secondary" style={{ fontSize: 13 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} /> {timeAgo}
          </Text>
        </Space>
      </div>

      {screens.md && (
        <Space
          size={40}
          style={{
            flexShrink: 0,
            marginLeft: 20,
            minWidth: 200,
            justifyContent: "flex-end",
          }}
        >
          <div style={{ textAlign: "center", minWidth: 60 }}>
            <Text
              strong
              style={{ fontSize: 16, color: "#666", lineHeight: 1.2 }}
            >
              {topic.viewCount || 0}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              <EyeOutlined style={{ marginRight: 2 }} /> Views
            </Text>
          </div>

          <div style={{ textAlign: "center", minWidth: 60 }}>
            <Text
              strong
              style={{ fontSize: 18, color: ACCENT_COLOR, lineHeight: 1.2 }}
            >
              {postCount}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              <MessageOutlined style={{ marginRight: 2 }} /> Replies
            </Text>
          </div>
        </Space>
      )}

      {!screens.md && (
        <Text
          strong
          style={{ fontSize: 15, color: ACCENT_COLOR, flexShrink: 0 }}
        >
          <MessageOutlined style={{ marginRight: 4 }} /> {postCount}
        </Text>
      )}
    </Card>
  );
};

export default ForumTopicCard;
