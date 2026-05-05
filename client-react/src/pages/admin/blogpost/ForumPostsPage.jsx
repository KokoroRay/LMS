import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Space,
  Button,
  Input,
  Select,
  Typography,
  message as antdMessage,
  Row,
  Col,
  Empty,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import api from "../../../services/authService";
import { normalize, authorName } from "../../../utils/helpers";
import PostCard from "./PostCard";
import ViewPostModal from "./ViewPostModal";
import PostFormModal from "./PostFormModal";
import "../../../styles/blogpost.css";

const { Title, Text } = Typography;
const POSTS_URL = "/posts";

export default function ForumPostsPage() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [keyword, setKeyword] = useState("");

  const [viewingPost, setViewingPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(POSTS_URL, {
        params: { keyword: keyword || "", page: page - 1, size: pageSize },
      });

      const data = res?.data;
      let items = [];
      let totalCount = 0;

      if (Array.isArray(data)) {
        items = data;
        totalCount = data.length;
      } else if (data && Array.isArray(data.content)) {
        items = data.content;
        totalCount = Number.isFinite(data.totalElements)
          ? data.totalElements
          : data.content.length;
      }

      if (keyword) {
        const nKeyword = normalize(keyword);
        items = items.filter((p) => {
          const title = normalize(p?.title || "");
          const author = normalize(authorName(p?.author) || "");
          return title.includes(nKeyword) || author.includes(nKeyword);
        });
        totalCount = items.length;
      }

      setList(items);
      setTotal(totalCount);
    } catch (error) {
      setList([]);
      setTotal(0);
      antdMessage.error(
        error?.response?.data?.message || "Không thể tải danh sách bài viết"
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreate = () => {
    setEditingPost(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingPost(record);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`${POSTS_URL}/${id}`);
      antdMessage.success("Xóa bài viết thành công");
      loadPosts();
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Xóa bài viết thất bại"
      );
    }
  };

  const handleFormCancel = () => {
    setIsFormModalOpen(false);
    setEditingPost(null);
  };

  const handleFormComplete = () => {
    setIsFormModalOpen(false);
    setEditingPost(null);
    loadPosts();
  };

  const handleView = (record) => {
    setViewingPost(record);
  };

  const handleViewAndEdit = (record) => {
    setViewingPost(null);
    handleEdit(record);
  };

  const HeaderBar = (
    <Row align="middle" gutter={[8, 8]} justify="space-between" wrap>
      <Col flex="auto">
        <Input.Search
          allowClear
          placeholder="Tìm theo tiêu đề, tác giả..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={(value) => {
            setPage(1);
            setKeyword(value);
          }}
          style={{ width: 320 }}
        />
      </Col>
      <Col>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Post
        </Button>
      </Col>
    </Row>
  );

  const renderPagination = () => (
    <div className="posts-pagination">
      <Space direction="vertical" size={8}>
        <Text type="secondary">Tổng {total} bài viết</Text>
        <Space>
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Trước
          </Button>
          <Text>
            Trang {page} / {Math.ceil(total / pageSize) || 1}
          </Text>
          <Button
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
          <Select
            value={pageSize}
            onChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
            options={[
              { value: 8, label: "8 / trang" },
              { value: 12, label: "12 / trang" },
              { value: 16, label: "16 / trang" },
              { value: 24, label: "24 / trang" },
            ]}
            style={{ width: 120 }}
          />
        </Space>
      </Space>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Text type="secondary">Đang tải...</Text>
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <Empty description="Chưa có bài viết" style={{ padding: "60px 0" }} />
      );
    }
    return (
      <>
        <Row gutter={[16, 16]} className="posts-grid">
          {list.map((post) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={post.id}>
              <PostCard
                post={post}
                onSelectView={handleView}
                onSelectEdit={handleEdit}
                onSelectDelete={handleDelete}
              />
            </Col>
          ))}
        </Row>
        {renderPagination()}
      </>
    );
  };

  return (
    <>
      <div className="admin-dashboard posts-page">
        <Card
          title={
            <Title level={5} style={{ margin: 0 }}>
              Posts Management
            </Title>
          }
          extra={HeaderBar}
          bodyStyle={{ paddingTop: 8 }}
        >
          {renderContent()}
        </Card>
      </div>

      <ViewPostModal
        open={!!viewingPost}
        post={viewingPost}
        onClose={() => setViewingPost(null)}
        onEdit={handleViewAndEdit}
      />

      <PostFormModal
        open={isFormModalOpen}
        editingPost={editingPost}
        onCancel={handleFormCancel}
        onComplete={handleFormComplete}
      />
    </>
  );
}
