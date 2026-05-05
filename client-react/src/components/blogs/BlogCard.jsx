import React, { useState, useEffect } from "react";
import {
  Card,
  Badge,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Tag,
  Button,
} from "antd";
import { ClockCircleOutlined, ReadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { formatCategoryDisplay, getDynamicTagColor } from "../../utils/helpers";
import { motion } from "framer-motion";

const { Text, Title } = Typography;

const BlogCard = ({
  post,
  level,
  date,
  readTime,
  title,
  description,
  image,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    const tagColor = getDynamicTagColor(level);
    navigate(`/blog/${post.slug}`, {
      state: { tagColor },
    });
  };

  return (
    <Card
      hoverable
      onClick={handleCardClick}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        border: "1px solid #d9d9d9",
        minHeight: 450,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
      }}
      bodyStyle={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      <div
        className="blog-card-cover"
        style={{
          background: "#ffffffff",
          height: 240,
          borderRadius: 12,
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        <img
          src={image}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      <Badge
        count={
          <Tag
            color={getDynamicTagColor(level)}
          >
            {formatCategoryDisplay(level)}
          </Tag>
        }
        color="#1677ff"
        styles={{
          indicator: {
            position: "static",
            transform: "none",
          },
        }}
      />

      <Title
        level={2}
        className="blog-card-title"
        style={{
          marginTop: 8,
          marginBottom: 8,
          fontSize: 24,
          minHeight: 64,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {title}
      </Title>

      <Text
        type="secondary"
        style={{
          fontSize: 14,
          lineHeight: "20px",
          marginBottom: 8,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </Text>

      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <Space
          size={24}
          wrap
          split={<Divider type="vertical" style={{ height: 18, margin: 0 }} />}
        >
          <Space size={8}>
            <ClockCircleOutlined style={{ color: "#666" }} />
            <Text type="secondary">{date}</Text>
          </Space>
          <Space size={8}>
            <ReadOutlined style={{ color: "#666" }} />
            <Text type="secondary">{readTime}</Text>
          </Space>
        </Space>
      </div>
    </Card>
  );
};

const BlogCardSmall = ({
  id,
  slug,
  level,
  date,
  readTime,
  title,
  description,
  image,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    const tagColor = getDynamicTagColor(level);
    navigate(`/blog/${slug}`, {
      state: { tagColor },
    });
  };

  return (
    <Card
      hoverable
      onClick={handleCardClick}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        border: "1px solid #d9d9d9",
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
      }}
      bodyStyle={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      <div
        className="blog-card-cover"
        style={{
          background: "#ffffffff",
          height: 160,
          borderRadius: 12,
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        <img
          src={image}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      <Badge
        count={
          <Tag
            color={getDynamicTagColor(level)}
          >
            {formatCategoryDisplay(level)}
          </Tag>
        }
        color="#1677ff"
        styles={{
          indicator: {
            position: "static",
            transform: "none",
          },
        }}
      />

      <Title
        level={4}
        className="blog-card-title"
        style={{
          marginTop: 8,
          marginBottom: 8,
          fontSize: 18,
          minHeight: 48,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {title}
      </Title>

      <Text
        type="secondary"
        style={{
          fontSize: 13,
          lineHeight: "18px",
          marginBottom: 8,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </Text>

      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <Space
          size={16}
          wrap
          split={<Divider type="vertical" style={{ height: 16, margin: 0 }} />}
        >
          <Space size={6}>
            <ClockCircleOutlined style={{ color: "#666", fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {date}
            </Text>
          </Space>
          <Space size={6}>
            <ReadOutlined style={{ color: "#666", fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {readTime}
            </Text>
          </Space>
        </Space>
      </div>
    </Card>
  );
};

const BlogCardGrid = ({ blogs }) => {
  const INITIAL_LOAD_COUNT = 6;
  const LOAD_MORE_COUNT = 6;

  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const defaultBlogs = Array.from({ length: 12 }, (_, idx) => ({
    id: `blog-${idx + 1}`,
    slug: `blog-${idx + 1}-slug`,
    level: "FRONT_END",
    date: "8 tháng trước",
    readTime: "10-15 phút đọc",
    title: `Blog ${idx + 1}`,
    description:
      "Chào bạn! Nếu bạn đã là học viên khóa Pro của Rikkei Academy, chắc hẳn bạn đã biết tới Dev Mode – giúp thực h...",
    image: "/images/Image 2.svg",
  }));

  const allBlogs = blogs || defaultBlogs;
  
  // Tạo key để trigger animation lại khi blogs thay đổi
  const blogsKey = blogs ? blogs.map(b => b.id).join(',') : 'default';

  useEffect(() => {
    setVisibleCount(INITIAL_LOAD_COUNT);
  }, [blogs]);

  const hasMoreBlogs = visibleCount < allBlogs.length;

  const displayBlogs = allBlogs.slice(0, visibleCount);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prevCount) => prevCount + LOAD_MORE_COUNT);
      setIsLoadingMore(false);
    }, 300);
  };

  return (
    <>
      <Row
        key={blogsKey}
        gutter={[24, 24]}
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: "30px 24px",
        }}
      >
        {displayBlogs.map((blog, index) => (
          <Col key={blog.id} xs={24} sm={12} md={12} lg={8} xl={8}>
            {/* Thêm animation cho mỗi card */}
            <motion.div
              key={`${blogsKey}-${blog.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut",
              }}
            >
              <BlogCard
                post={blog}
                level={blog.level}
                date={blog.date}
                readTime={blog.readTime}
                title={blog.title}
                description={blog.description}
                image={blog.image}
              />
            </motion.div>
          </Col>
        ))}
      </Row>

      {hasMoreBlogs && (
        <div style={{ textAlign: "center", paddingBottom: "30px" }}>
          <Button
            type="primary"
            size="large"
            onClick={handleLoadMore}
            loading={isLoadingMore}
            iconPosition="end"
            style={{
              backgroundColor: "rgba(221, 103, 60, 1)",
              borderColor: "rgba(221, 103, 60, 1)",
            }}
          >
            Xem Thêm
          </Button>
        </div>
      )}
    </>
  );
};

export { BlogCard, BlogCardSmall, BlogCardGrid };
export default BlogCardGrid;
