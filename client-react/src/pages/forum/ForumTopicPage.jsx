import React, { useEffect, useState, useCallback } from "react";
import {
  Layout,
  Typography,
  Button,
  Empty,
  Spin,
  Input,
  Space,
  Grid,
  message,
  Card,
  Divider,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  CommentOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { getAllTopicsAPI } from "../../services/forumService";
import { useNavigate } from "react-router-dom";
import ForumTopicCard from "./ForumTopicCard";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

const PAGE_SIZE = 10;
const BRAND_COLOR = "#FF7F00";
const ACCENT_COLOR = "#1890ff";

const ForumTopicPage = () => {
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");

  const loadTopics = useCallback(
    async (page, size, isInitialLoad) => {
      if (isInitialLoad) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = { page: page, size: size, keyword: searchKeyword };
        const res = await getAllTopicsAPI(params);
        const data = res?.data?.data;

        if (data && Array.isArray(data.content)) {
          setTopics((prev) =>
            isInitialLoad ? data.content : [...prev, ...data.content]
          );

          setHasMore(!data.last);
        } else {
          if (isInitialLoad) setTopics([]);
          setHasMore(false);
        }
      } catch (error) {
        message.error("Không thể tải danh sách Topics.");
      } finally {
        if (isInitialLoad) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [searchKeyword]
  );

  useEffect(() => {
    setTopics([]);
    setCurrentPage(0);
    setHasMore(true);
    loadTopics(0, PAGE_SIZE, true);
  }, [searchKeyword, loadTopics]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadTopics(nextPage, PAGE_SIZE, false);
  };

  const handleCardClick = (topicId) => {
    navigate(`/forum/topics/${topicId}`);
  };

  const handleSearch = (value) => {
    setSearchKeyword(value);
  };

  const ControlsHeader = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: screens.md ? "center" : "flex-start",
        marginBottom: 20,
        flexDirection: screens.md ? "row" : "column",
        gap: screens.md ? 0 : 15,
      }}
    >
      <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#333" }}>
        <CommentOutlined style={{ color: BRAND_COLOR, marginRight: 10 }} />
        Diễn đàn Cộng đồng
      </Title>

      <Space
        size="middle"
        style={{
          width: screens.md ? "auto" : "100%",
          justifyContent: screens.md ? "flex-end" : "space-between",
        }}
      >
        <Search
          placeholder="Tìm kiếm..."
          allowClear
          onSearch={handleSearch}
          style={{ width: screens.md ? 250 : "60%" }}
          size="large"
          prefix={<SearchOutlined style={{ color: "#aaa", marginRight: 8 }} />}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/forum/topics/new")}
          style={{
            backgroundColor: BRAND_COLOR,
            borderColor: BRAND_COLOR,
            borderRadius: 6,
            fontWeight: 600,
          }}
          size="large"
        >
          New Topic
        </Button>
      </Space>
    </div>
  );

  const ListHeader = screens.md && (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        backgroundColor: "#e6f7ff",
        border: "1px solid #ddd",
        borderRadius: 6,
        marginBottom: 10,
        color: "#555",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <Text style={{ fontWeight: 600, fontSize: 13, flexGrow: 1 }}>
        TOPIC / META
      </Text>

      <Space
        size={40}
        style={{ flexShrink: 0, marginLeft: 20, paddingRight: 5 }}
      >
        <div style={{ textAlign: "center", minWidth: 60 }}>
          <Text style={{ fontWeight: 600, fontSize: 13 }}>LƯỢT XEM</Text>
        </div>
        <div style={{ textAlign: "center", minWidth: 60 }}>
          <Text style={{ fontWeight: 600, fontSize: 13 }}>TRẢ LỜI</Text>
        </div>
      </Space>
    </div>
  );

  const initialLoad = loading && topics.length === 0;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content
        style={{
          margin: "24px auto",
          maxWidth: 1200,
          width: "100%",
        }}
      >
        {ControlsHeader}

        {ListHeader}

        {initialLoad ? (
          <div style={{ textAlign: "center", padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : topics.length > 0 ? (
          <>
            {topics.map((topic) => (
              <ForumTopicCard
                key={topic.topicId}
                topic={topic}
                onClick={handleCardClick}
              />
            ))}

            {hasMore && (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <Button
                  type="default"
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleLoadMore}
                  loading={loadingMore}
                  style={{ width: screens.md ? 250 : "100%", borderRadius: 6 }}
                >
                  {loadingMore ? "Loading..." : "Tải thêm Topics"}
                </Button>
              </div>
            )}
            {!hasMore && (
              <Divider style={{ margin: "30px 0" }}>
                <Text type="secondary" style={{ fontStyle: "italic" }}>
                  Đã tải hết tất cả Topics ({topics.length})
                </Text>
              </Divider>
            )}
          </>
        ) : (
          <Card style={{ borderRadius: 8, border: "1px solid #ddd" }}>
            <Empty
              description={
                <Text type="secondary">Chưa có Topic nào trong diễn đàn.</Text>
              }
              style={{ padding: 50 }}
            />
          </Card>
        )}
      </Content>
    </Layout>
  );
};

export default ForumTopicPage;
