import { useEffect, useState } from "react";
import dayjs from "dayjs";
import BlogCardGrid from "../../components/blogs/BlogCard";
import BannerBlog from "../../layouts/BannerBlog";
import { Dropdown, Space, Divider, Spin } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { fetchAllPostAPI } from "../../services/authService";
import { formatCategoryDisplay } from "../../utils/helpers";

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("Tất cả");
  // Thêm loading state
  const [loading, setLoading] = useState(true);

  const loadAllPost = async () => {
    // Bắt đầu loading
    setLoading(true);
    try {
      const res = await fetchAllPostAPI();
      const items = Array.isArray(res?.data?.content) ? res.data.content : [];
      // Chỉ hiển thị bài viết có trạng thái PUBLISHED
      const publishedPosts = items.filter((post) => post.status === "PUBLISHED");
      setPosts(publishedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      // Kết thúc loading
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPost();
  }, []);

  const handleFilterChange = (label) => {
    setFilter(label);
  };

  const filterItems = [
    {
      key: "1",
      label: "Tất cả",
      onClick: () => handleFilterChange("Tất cả"),
    },
    {
      key: "2",
      label: "Front-End",
      onClick: () => handleFilterChange("Front-End"),
    },
    {
      key: "3",
      label: "Back-End",
      onClick: () => handleFilterChange("Back-End"),
    },
    {
      key: "4",
      label: "DevOps-Cloud",
      onClick: () => handleFilterChange("DevOps-Cloud"),
    },
    {
      key: "5",
      label: "Data-AI",
      onClick: () => handleFilterChange("Data-AI"),
    },
    {
      key: "6",
      label: "UI/UX-Design",
      onClick: () => handleFilterChange("UI/UX-Design"),
    },
  ];

  const cards = Array.isArray(posts)
    ? posts.map((p) => {
      const words =
        typeof p?.content === "string"
          ? p.content.trim().split(/\s+/).length
          : 0;
      const minutes = Math.max(1, Math.ceil(words / 200));

      const cleanDescription = p?.content
        ? p.content.replace(/<[^>]*>/g, "").slice(0, 160) + "..."
        : "";

      return {
        id: p?.id,
        slug: p?.slug,
        level: p?.postType || p?.category || "ARTICLE",
        date: p?.publishedAt ? dayjs(p.publishedAt).format("YYYY-MM-DD") : "",
        readTime: `${minutes} phút đọc`,
        title: p?.title || "",
        description: cleanDescription,
        image: p?.coverUrl || "/images/Blog-E-Learning.svg",
      };
    })
    : [];

  const displayBlogs =
    filter === "Tất cả" 
      ? cards 
      : cards.filter((b) => formatCategoryDisplay(b.level) === filter);

  return (
    <>
      <BannerBlog />
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: "30px 24px 0 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <span style={{ fontSize: "24px", fontWeight: "bold" }}>
              Tất cả bài viết
            </span>
            <span
              style={{
                marginLeft: "12px",
                fontSize: "20px",
                color: "#666",
              }}
            >
              {displayBlogs.length}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span>Sắp xếp:</span>
            <Dropdown menu={{ items: filterItems }} trigger={["click"]}>
              <a onClick={(e) => e.preventDefault()}>
                <Space
                  style={{
                    color: "#ff4d4f",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  {filter}
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
          </div>
        </div>

        <Divider
          style={{ margin: "0 0 20px 0", backgroundColor: "#00000018" }}
        />
      </div>

      {/* Thêm loading spinner */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <BlogCardGrid blogs={displayBlogs} />
      )}
    </>
  );
};

export default BlogPage;
