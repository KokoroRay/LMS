import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Breadcrumb, Tag, Typography, Row, Col, Space, Spin, Skeleton } from "antd";
import {
  ClockCircleOutlined,
  ReadOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { BlogCardSmall } from "../../components/blogs/BlogCard";
import dayjs from "dayjs";
import {
  fetchPostDetailAPI,
  fetchAllPostAPI,
} from "../../services/authService";
import { Avatar, Card, Flex, Switch } from "antd";
import { formatCategoryDisplay, getDynamicTagColor } from "../../utils/helpers";
import { motion } from "framer-motion";
import "../../styles/blogdetail.css";
import "highlight.js/styles/atom-one-dark.css";

import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
import java from "highlight.js/lib/languages/java";
import css from "highlight.js/lib/languages/css";

if (!hljs.getLanguage("java")) {
  hljs.registerLanguage("java", java);
}
if (!hljs.getLanguage("javascript")) {
  hljs.registerLanguage("javascript", javascript);
}
if (!hljs.getLanguage("xml")) {
  hljs.registerLanguage("xml", xml);
}
if (!hljs.getLanguage("css")) {
  hljs.registerLanguage("css", css);
}

const { Title, Paragraph, Text } = Typography;
const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagColor, setTagColor] = useState(null);

  useEffect(() => {
    if (blog) {
      const timer = setTimeout(() => {
        // Tìm tất cả các khối code Quill đã tạo
        const codeBlocks = document.querySelectorAll(
          ".blog-detail-content-html pre.ql-syntax"
        );

        codeBlocks.forEach((block) => {
          block.removeAttribute("data-highlighted");

          hljs.highlightElement(block);
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [blog]);

  useEffect(() => {
    if (location.state?.tagColor) {
      setTagColor(location.state.tagColor);
    }

    setBlog(null);
    setRelatedBlogs([]);

    const loadDetail = async () => {
      try {
        const res = await fetchPostDetailAPI(slug);
        const p = res?.data || {};
        const words =
          typeof p?.content === "string"
            ? p.content.trim().split(/\s+/).length
            : 0;
        const minutes = Math.max(1, Math.ceil(words / 200));
        const category = formatCategoryDisplay(p?.postType || p?.category || "Article");
        const postCategoryOriginal = p?.postType || p?.category || "ARTICLE";
        const mapped = {
          id: p?.id,
          title: p?.title || "",
          tag: category.toLowerCase(),
          categoryDisplay: category,
          publishDate: p?.publishedAt
            ? dayjs(p.publishedAt).format("YYYY-MM-DD")
            : "",
          readTime: `${minutes} phút đọc`,
          content: {
            sections: [
              { content: typeof p?.content === "string" ? p.content : "" },
            ],
            images: p?.coverUrl ? [p.coverUrl] : [],
          },
        };
        setBlog(mapped);
        await loadRelatedPosts(postCategoryOriginal, mapped.id);
      } catch {
        setBlog(null);
      }
    };
    const loadRelatedPosts = async (currentTag, currentId) => {
      setLoading(true);
      try {
        const allPostsRes = await fetchAllPostAPI();
        const allPosts = Array.isArray(allPostsRes?.data?.content)
          ? allPostsRes.data.content
          : [];
        // Chỉ lấy bài viết có trạng thái PUBLISHED
        const publishedPosts = allPosts.filter((post) => post.status === "PUBLISHED");
        const formattedPosts = publishedPosts.map((post) => {
          const words =
            typeof post?.content === "string"
              ? post.content.trim().split(/\s+/).length
              : 0;
          const minutes = Math.max(1, Math.ceil(words / 200));
          const cleanDescription = post?.content
            ? post.content.replace(/<[^>]*>/g, "").slice(0, 100) + "..."
            : "";
          const postCategory = formatCategoryDisplay(post?.postType || post?.category || "Article");
          return {
            id: post?.id,
            slug: post?.slug,
            level: post?.postType || post?.category || "ARTICLE",
            date: post?.publishedAt
              ? dayjs(post.publishedAt).format("DD/MM/YYYY")
              : "",
            readTime: `${minutes} phút đọc`,
            title: post?.title || "",
            description: cleanDescription,
            image: post?.coverUrl || "/images/Blog-E-Learning.svg",
          };
        });
        const related = formattedPosts
          .filter((b) => {
            const bTag = (b.level || "").toLowerCase();
            const currentTagLower = (currentTag || "").toLowerCase();
            return bTag === currentTagLower && b.id !== currentId;
          })
          .slice(0, 3);
        setRelatedBlogs(related);
      } catch (error) {
        console.error("Error loading related posts:", error);
        setRelatedBlogs([]);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [slug, location.state]);

  const getTagColor = (tag) => {
    return tagColor || getDynamicTagColor(tag);
  };

  if (!blog) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }
  return (
    <>
      <div className="blog-detail-container">
        <Breadcrumb
          items={[
            {
              title: "Trang Chủ",
              href: "/home",
            },
            {
              title: "Bài viết",
              href: "/blog",
            },
            {
              title: "Chi tiết bài viết",
            },
          ]}
          className="blog-detail-breadcrumb"
        />
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={16}>
            <div className="blog-detail-main-content">
              <Title
                level={1}
                className="blog-detail-title"
                style={{ fontWeight: 700 }}
              >
                {blog.title}
              </Title>
              <div className="blog-detail-meta">
                <Space size={24} wrap>
                  <Tag
                    color={getTagColor(blog.tag)}
                    className="blog-detail-tag"
                  >
                    {blog.categoryDisplay || formatCategoryDisplay(blog.tag)}
                  </Tag>
                  <Space size={8}>
                    <ClockCircleOutlined className="blog-detail-meta-icon" />
                    <Text type="secondary">{blog.publishDate}</Text>
                  </Space>
                  <Space size={8}>
                    <ReadOutlined className="blog-detail-meta-icon" />
                    <Text type="secondary">{blog.readTime}</Text>
                  </Space>
                </Space>
              </div>
              {blog.content.images[0] && (
                <div
                  className="blog-detail-image-container"
                  style={{ margin: "20px 0" }}
                >
                  <img
                    src={blog.content.images[0]}
                    alt="Cover"
                    className="blog-detail-image"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}
              {blog.content.sections.map((section, index) => (
                <div
                  key={index}
                  className="blog-detail-content-html ql-editor"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              ))}
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div className="blog-detail-sidebar">
              {relatedBlogs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Title level={3} className="blog-detail-sidebar-title">
                    Bài viết cùng chủ đề
                  </Title>
                </motion.div>
              )}
              {relatedBlogs.length > 0 ? (
                <>
                  <div className="blog-detail-related-layout">
                    <div className="blog-detail-mobile-only mobile-only">
                      <Row gutter={[16, 16]}>
                        {relatedBlogs.map((relatedBlog, index) => (
                          <Col key={relatedBlog.id} xs={12}>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.5,
                                delay: 0.2 + index * 0.1,
                                ease: "easeOut",
                              }}
                            >
                              <BlogCardSmall
                                id={relatedBlog.id}
                                slug={relatedBlog.slug}
                                level={relatedBlog.level}
                                date={relatedBlog.date}
                                readTime={relatedBlog.readTime}
                                title={relatedBlog.title}
                                description={relatedBlog.description}
                                image={relatedBlog.image}
                              />
                            </motion.div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                    <div className="blog-detail-desktop-only desktop-only">
                      <Space
                        direction="vertical"
                        size={16}
                        className="blog-detail-related-space"
                      >
                        {relatedBlogs.map((relatedBlog, index) => (
                          <motion.div
                            key={relatedBlog.id}
                            className="blog-detail-related-item"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.5,
                              delay: 0.2 + index * 0.1,
                              ease: "easeOut",
                            }}
                          >
                            <BlogCardSmall
                              id={relatedBlog.id}
                              slug={relatedBlog.slug}
                              level={relatedBlog.level}
                              date={relatedBlog.date}
                              readTime={relatedBlog.readTime}
                              title={relatedBlog.title}
                              description={relatedBlog.description}
                              image={relatedBlog.image}
                            />
                          </motion.div>
                        ))}
                      </Space>
                    </div>
                  </div>
                </>
              ) : (
                <Skeleton style={{ margin: 30 }} active />
              )}
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
};
export default BlogDetail;
