import React, { useState } from "react";
import { Layout, Card, Form, Input, Button, message, Typography } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { uploadToCloudinary } from "../../utils/cloudinaryUploader";
import { createTopicAPI } from "../../services/forumService";

import TextEditor from "../../pages/admin/blogpost/TextEditor";

const { Content } = Layout;
const { Title, Text } = Typography;

const BRAND_COLOR = "#FF7F00";

const NewTopicPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isAuthenticated = true;

  const handleBack = () => {
    navigate(-1);
  };

  const onFinish = async (values) => {
    if (!isAuthenticated) {
      message.error("Vui lòng đăng nhập để tạo Topic mới.");
      return;
    }

    const htmlContent = values.content;

    if (!htmlContent || htmlContent === "<p><br></p>") {
      return message.error("Nội dung không được để trống.");
    }

    setLoading(true);
    try {
      const data = {
        title: values.title,
        content: htmlContent,
        categoryTag: values.categoryTag || null,
        classId: null,
      };

      const res = await createTopicAPI(data);

      message.success("Tạo Topic thành công!");
      const newTopicId = res?.data?.data?.topicId;
      if (newTopicId) {
        navigate(`/forum/topics/${newTopicId}`);
      } else {
        navigate("/forum");
      }
    } catch (error) {
      message.error("Lỗi khi tạo Topic. Vui lòng thử lại.");
      console.error("Create Topic Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    message.warning("Vui lòng đăng nhập để tạo Topic.");
    return (
      <div style={{ textAlign: "center", padding: 50 }}>Access Denied</div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content
        style={{
          margin: "24px auto",
          maxWidth: 1200,
          width: "100%",
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
          <Title
            level={2}
            style={{ margin: 0, fontWeight: 700, color: "#333" }}
          >
            <EditOutlined style={{ color: BRAND_COLOR, marginRight: 8 }} />
            Tạo Topic Mới
          </Title>
        </div>

        <Card
          loading={loading}
          style={{
            borderRadius: 8,
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
            border: "1px solid #ddd",
          }}
          bodyStyle={{ padding: 30 }}
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="title"
              label={<Text strong>Tiêu đề Topic</Text>}
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề." }]}
              required={false}
            >
              <Input
                placeholder="Nhập tiêu đề Topic..."
                size="large"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            <Form.Item
              name="categoryTag"
              label={
                <Text strong>
                  Category Tag (Dùng để phân loại, ví dụ: Java, React,
                  Database...)
                </Text>
              }
              rules={[]}
              required={false}
            >
              <Input
                placeholder="Nhập tối đa 50 ký tự..."
                size="large"
                maxLength={50}
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            <Form.Item
              name="content"
              label={<Text strong>Nội dung Topic/Bài viết</Text>}
              rules={[{ required: true, message: "Vui lòng nhập nội dung." }]}
              required={false}
            >
              <TextEditor
                placeholder="Nhập nội dung bài viết đầu tiên..."
                uploadImage={uploadToCloudinary}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={{
                  backgroundColor: BRAND_COLOR,
                  borderColor: BRAND_COLOR,
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Đăng Topic
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default NewTopicPage;
