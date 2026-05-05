import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import {
  selectCurrentUserId,
  selectIsAuthenticated,
} from "../../redux/api/slices/authSlice";
import {
  Layout,
  Typography,
  Card,
  Button,
  message, // Ant Design message
  Space,
  Spin,
  Divider,
  Form,
  Modal,
  Select,
  Input,
  Row,
  Col,
  Avatar,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  PushpinFilled,
  ClockCircleOutlined,
  UserOutlined,
  MessageOutlined,
  EyeOutlined,
  TagOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import "../../styles/forum.css";
import {
  getTopicWithNestedPostsAPI,
  likePostAPI,
  unlikePostAPI,
  createPostAPI,
  deletePostAPI,
  createReportAPI,
  updatePostAPI,
} from "../../services/forumService";
import { useNavigate, useParams } from "react-router-dom";
import TextEditor from "../../pages/admin/blogpost/TextEditor";
import { uploadToCloudinary } from "../../utils/cloudinaryUploader";
import { formatDate } from "../../utils/forum";
import ForumPost from "./ForumPost";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const { Content } = Layout;
// --- SỬA LỖI TẠI ĐÂY ---
const { Title, Text } = Typography; // Bỏ TextArea ở đây
const { TextArea } = Input; // Lấy TextArea từ Input
const { Option } = Select;

const BRAND_COLOR = "#FF7F00";
const REPORT_TYPES = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Quấy rối" },
  { value: "INAPPROPRIATE_CONTENT", label: "Nội dung không phù hợp" },
  { value: "OTHER", label: "Khác" },
];

const countTotalPosts = (posts) => {
  let count = 0;
  posts.forEach((post) => {
    count++;
    if (post.replies) {
      count += countTotalPosts(post.replies);
    }
  });
  return count;
};

const updatePostInState = (posts, updatedPost) => {
  return posts.map((post) => {
    if (post.postId === updatedPost.postId) {
      return { ...post, ...updatedPost };
    }
    if (post.replies && post.replies.length > 0) {
      return { ...post, replies: updatePostInState(post.replies, updatedPost) };
    }
    return post;
  });
};

const addReplyToState = (posts, newPost) => {
  return posts.map((post) => {
    if (post.postId === newPost.parentPostId) {
      return { ...post, replies: [...(post.replies || []), newPost] };
    }
    if (post.replies && post.replies.length > 0) {
      return { ...post, replies: addReplyToState(post.replies, newPost) };
    }
    return post;
  });
};

const deletePostFromState = (posts, postIdToDelete) => {
  const idToDelete = String(postIdToDelete);
  return posts
    .filter((post) => String(post.postId) !== idToDelete)
    .map((post) => {
      if (post.replies?.length > 0) {
        return {
          ...post,
          replies: deletePostFromState(post.replies, idToDelete),
        };
      }
      return post;
    });
};

const ForumTopicDetail = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUserId = useSelector(selectCurrentUserId);

  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [replyingTo, setReplyingTo] = useState(null);

  const [editingPost, setEditingPost] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState({
    postId: null,
    topicId: null,
  });
  const [reportForm] = Form.useForm();
  const [selectedReportType, setSelectedReportType] = useState(null);
  const stompClientRef = useRef(null);

  const handleRealtimeEvent = useCallback(
    (socketMsg) => {
      try {
        const event = JSON.parse(socketMsg.body);
        const { type, payload } = event;

        if (
          type === "DELETE_TOPIC" &&
          String(payload.topicId) === String(topicId)
        ) {
          message.warning("Chủ đề này đã bị xóa bởi Admin.");
          navigate("/forum");
          return;
        }

        setPosts((currentPosts) => {
          switch (type) {
            case "NEW_POST":
              if (payload.parentPostId) {
                return addReplyToState(currentPosts, payload);
              } else {
                if (currentPosts.some((p) => p.postId === payload.postId))
                  return currentPosts;
                return [...currentPosts, payload];
              }
            case "UPDATE_POST":
              return updatePostInState(currentPosts, payload);
            case "DELETE_POST":
              return deletePostFromState(currentPosts, payload.postId);
            default:
              return currentPosts;
          }
        });
      } catch (error) {
        console.error("Error processing real-time event:", error);
      }
    },
    [topicId, navigate]
  );

  const loadTopicDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTopicWithNestedPostsAPI(topicId);
      const data = res?.data?.data;
      if (data && data.topicId) {
        setTopic(data);
        setPosts(data.posts || []);
      } else {
        message.error("Topic không tồn tại hoặc đã bị xóa.");
        navigate("/forum");
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        message.error("Topic không tồn tại.");
        navigate("/forum");
      } else {
        message.error("Không thể tải chi tiết Topic.");
      }
    } finally {
      setLoading(false);
    }
  }, [topicId, navigate]);

  useEffect(() => {
    if (!topicId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_WS_BASE_URL || 'https://hocvienit.id.vn'}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {

        client.subscribe(`/topic/forum/${topicId}`, handleRealtimeEvent);
        loadTopicDetail();
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [topicId, navigate, loadTopicDetail, handleRealtimeEvent]);

  const handleBack = () => navigate(-1);

  const handleReply = (parentPostId) => {
    if (!isAuthenticated) return message.info("Vui lòng đăng nhập để trả lời.");
    setReplyingTo(parentPostId);
    document
      .getElementById("reply-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLike = async (postId, isCurrentlyLiked) => {
    if (!isAuthenticated) return message.info("Vui lòng đăng nhập để Like.");
    try {
      await (isCurrentlyLiked ? unlikePostAPI(postId) : likePostAPI(postId));
    } catch (error) {
      message.error("Lỗi thao tác Like.");
    }
  };

  const handleDelete = async (postId) => {
    if (!isAuthenticated) return message.error("Vui lòng đăng nhập để xóa.");
    try {
      await deletePostAPI(postId);
      message.success("Xóa bài viết/bình luận thành công.");
    } catch (error) {
      message.error("Không thể xóa bài viết.");
    }
  };

  const onFinish = async (values) => {
    if (!isAuthenticated)
      return message.error("Vui lòng đăng nhập để đăng bài.");
    const htmlContent = values.content;
    if (!htmlContent || htmlContent === "<p><br></p>")
      return message.error("Nội dung không được để trống.");

    try {
      await createPostAPI({
        topicId,
        parentPostId: replyingTo,
        content: htmlContent,
      });
      form.resetFields();
      setReplyingTo(null);
    } catch (error) {
      message.error("Lỗi khi đăng bài.");
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    editForm.setFieldsValue({ content: post.content });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    if (!editingPost) return;
    try {
      await updatePostAPI(editingPost.postId, values.content);
      message.success("Cập nhật bài viết thành công.");
      setIsEditModalVisible(false);
      setEditingPost(null);
    } catch (error) {
      message.error("Không thể cập nhật bài viết.");
    }
  };

  const handleReport = (postId) => {
    setReportTarget({ postId, topicId });
    setSelectedReportType(null);
    setIsReportModalVisible(true);
  };

  const handleReportSubmit = async (values) => {
    try {
      const data = {
        ...reportTarget,
        ...values,
      };

      if (data.reportType !== "OTHER" && !data.reason) {
        const reportTypeLabel = REPORT_TYPES.find(
          (rt) => rt.value === data.reportType
        )?.label;
        data.reason = reportTypeLabel || data.reportType;
      }

      await createReportAPI(data);
      message.success("Báo cáo đã được gửi thành công đến Admin.");
      setIsReportModalVisible(false);
      reportForm.resetFields();
    } catch (error) {
      message.error("Lỗi khi gửi báo cáo.");
    }
  };

  if (loading && !topic)
    return (
      <div style={{ padding: "50px 0", textAlign: "center" }}>
        <Spin size="large" tip="Loading Topic..." />
      </div>
    );
  if (!topic)
    return (
      <Title level={3} style={{ margin: 24 }}>
        Topic không tồn tại.
      </Title>
    );

  const createdDate = formatDate(topic.createdAt, "DD/MM/YYYY HH:mm");
  const timeAgo = formatDate(topic.createdAt, "time ago");
  const categoryTag = topic.categoryTag || "Global";
  const authorName = topic.author
    ? `${topic.author.firstName || ""} ${topic.author.lastName || ""}`.trim()
    : "Người dùng";
  const totalReplies = countTotalPosts(posts);
  const isTopicAuthor = topic.author?.userId === currentUserId;
  const showTopicReportButton = isAuthenticated && !isTopicAuthor;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content
        style={{
          margin: "24px auto",
          maxWidth: 1200,
          width: "100%",
          padding: "0 16px",
        }}
      >
        <div
          style={{ marginBottom: 20, display: "flex", alignItems: "center" }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: 16, borderRadius: 6 }}
          >
            Back
          </Button>
          <Title level={2} style={{ margin: 0, fontSize: 28, color: "#333" }}>
            {topic.pinned && (
              <PushpinFilled style={{ color: BRAND_COLOR, marginRight: 8 }} />
            )}
            {topic.topicTitle || topic.title || "Topic"}
          </Title>
        </div>
        <Divider style={{ marginTop: 0, marginBottom: 24 }} />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={18}>
            <Card
              bordered={false}
              style={{ marginBottom: 24, borderRadius: 8 }}
            >
              <div style={{ display: "flex", gap: "16px", width: "100%" }}>
                <Avatar
                  size={48}
                  src={topic.author?.avatarUrl}
                  icon={<UserOutlined />}
                />
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 16, display: "block" }}>
                    {authorName}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <ClockCircleOutlined style={{ marginRight: 6 }} /> Đăng:{" "}
                    {timeAgo}
                  </Text>
                  <div
                    className="post-content-wrapper ql-editor"
                    style={{ marginTop: "12px" }}
                    dangerouslySetInnerHTML={{ __html: topic.content }}
                  />
                </div>
              </div>
              <Divider style={{ marginTop: 16, marginBottom: 8 }} />
              <Space size="large">
                <Text type="secondary">
                  <EyeOutlined style={{ marginRight: 6 }} />{" "}
                  {topic.viewCount || 0} Lượt xem
                </Text>
                <Text type="secondary">
                  <MessageOutlined style={{ marginRight: 6 }} /> {totalReplies}{" "}
                  Bình luận
                </Text>
                {showTopicReportButton && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<WarningOutlined />}
                    onClick={() => handleReport(null)}
                  >
                    Báo cáo chủ đề
                  </Button>
                )}
              </Space>
            </Card>

            <Title level={4} style={{ marginBottom: 16, fontSize: 20 }}>
              Bình luận ({totalReplies})
            </Title>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {loading && posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <Spin />
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <ForumPost
                    key={post.postId}
                    post={post}
                    onReply={handleReply}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onReport={handleReport}
                    onEdit={handleEdit}
                    isAuthenticated={isAuthenticated}
                  />
                ))
              ) : (
                <Text type="secondary">Chưa có bình luận nào.</Text>
              )}
            </div>

            <Divider />

            {isAuthenticated && (
              <Card
                id="reply-form"
                bordered={false}
                style={{ borderRadius: 8 }}
              >
                <Title level={5} style={{ marginBottom: 16 }}>
                  {replyingTo ? "Trả lời bình luận" : "Viết bình luận mới"}
                </Title>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                  <Form.Item
                    name="content"
                    rules={[
                      { required: true, message: "Vui lòng nhập nội dung." },
                    ]}
                  >
                    <TextEditor
                      placeholder="Nhập nội dung..."
                      uploadImage={uploadToCloudinary}
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        style={{
                          backgroundColor: BRAND_COLOR,
                          borderColor: BRAND_COLOR,
                        }}
                      >
                        Gửi
                      </Button>
                      {replyingTo && (
                        <Button
                          type="default"
                          onClick={() => setReplyingTo(null)}
                        >
                          Hủy
                        </Button>
                      )}
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            )}
          </Col>

          <Col xs={24} lg={6}>
            <Card
              title="Thông tin chủ đề"
              bordered={false}
              style={{ borderRadius: 8 }}
            >
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Text type="secondary">
                  <UserOutlined style={{ marginRight: 8 }} />
                  Tác giả: <strong>{authorName}</strong>
                </Text>
                <Text type="secondary">
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  Đăng lúc: <strong>{createdDate}</strong>
                </Text>
                <Tag color={categoryTag === "Global" ? "default" : "geekblue"}>
                  {categoryTag}
                </Tag>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>

      <Modal
        title="Báo cáo"
        open={isReportModalVisible}
        onCancel={() => setIsReportModalVisible(false)}
        footer={null}
      >
        <Form
          form={reportForm}
          layout="vertical"
          onFinish={handleReportSubmit}
          onValuesChange={(_, allValues) =>
            setSelectedReportType(allValues.reportType)
          }
        >
          <Form.Item
            name="reportType"
            label="Loại Vi phạm"
            rules={[{ required: true, message: "Vui lòng chọn loại vi phạm." }]}
          >
            <Select
              placeholder="Chọn loại vi phạm"
              onChange={setSelectedReportType}
            >
              {REPORT_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {selectedReportType === "OTHER" && (
            <Form.Item
              name="reason"
              label="Lý do chi tiết"
              rules={[{ required: true, message: "Vui lòng nhập lý do." }]}
            >
              <TextArea rows={4} />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" danger>
              Gửi Báo cáo
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Sửa bình luận"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={() => editForm.submit()}
        confirmLoading={loading}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            name="content"
            rules={[
              { required: true, message: "Nội dung không được để trống." },
            ]}
          >
            <TextEditor uploadImage={uploadToCloudinary} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ForumTopicDetail;
