import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Typography,
  Tag,
  Upload,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  InboxOutlined,
  PlayCircleOutlined,
  BookOutlined,
} from "@ant-design/icons";

import { listSessions } from "../../../services/sessionService";
import {
  listLessonsBySession,
  createLessonWithVideo,
  updateLessonWithVideo,
  deleteLesson,
} from "../../../services/lessonService";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

export default function LessonsBySessionPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      try {
        const data = await listSessions();
        const arr = Array.isArray(data) ? data : [];
        setSessions(arr);
        if (!activeSessionId && arr.length) {
          const sid = arr[0].sessionId ?? arr[0].id ?? arr[0].classId;
          setActiveSessionId(sid ?? null);
        }
      } catch {
        message.error("Không tải được Session.");
      }
    })();
  }, []);

  const fetchLessons = async (sid) => {
    if (!sid) return;
    setLoading(true);
    try {
      const data = await listLessonsBySession(sid);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      message.error("Không tải được Lesson.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSessionId) fetchLessons(activeSessionId);
  }, [activeSessionId]);

  const onOpenCreate = () => {
    if (!activeSessionId) return message.warning("Hãy chọn Session trước");
    setEditing(null);
    setUploadFile(null);
    form.resetFields();
    form.setFieldsValue({
      sessionId: activeSessionId,
      orderIndex: rows.length,
      durationMinutes: 0,
    });
    setOpen(true);
  };

  const onOpenEdit = (record) => {
    setEditing(record);
    setUploadFile(null);
    form.resetFields();
    form.setFieldsValue({
      sessionId: activeSessionId,
      title: record.title,
      description: record.description,
      content: record.content,
      durationMinutes: record.durationMinutes ?? 0,
      orderIndex: record.orderIndex ?? 0,
      quizId: record.quizId ?? null,
    });
    setOpen(true);
  };

  const onFinish = async (values) => {
    const dto = {
      sessionId: values.sessionId,
      title: values.title?.trim(),
      description: values.description ?? null,
      content: values.content ?? null,
      durationMinutes: values.durationMinutes
        ? Number(values.durationMinutes)
        : null,
      orderIndex: values.orderIndex ? Number(values.orderIndex) : 0,
      quizId: values.quizId ? Number(values.quizId) : null,
    };

    try {
      setSaving(true);

      // Azure video upload via multipart/form-data
      const hide = uploadFile
        ? message.loading("Đang upload video", 0)
        : null;

      try {
        if (editing?.lessonId) {
          await updateLessonWithVideo(editing.lessonId, dto, uploadFile);
          message.success("Cập nhật thành công");
        } else {
          await createLessonWithVideo(dto, uploadFile);
          message.success("Tạo mới thành công");
        }
      } finally {
        if (hide) hide();
      }

      setOpen(false);
      fetchLessons(activeSessionId);
    } catch (e) {
      message.error(e?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (record) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Xóa bài học "${record.title}"?`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteLesson(record.lessonId);
          message.success("Đã xóa");
          fetchLessons(activeSessionId);
        } catch {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  const uploadProps = {
    multiple: false,
    maxCount: 1,
    accept: "video/*",
    beforeUpload: (file) => {
      setUploadFile(file);
      return false;
    },
    onRemove: () => setUploadFile(null),
    fileList: uploadFile ? [uploadFile] : [],
  };

  const columns = [
    { title: "#", key: "idx", width: 60, render: (_, __, i) => i + 1 },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (t) => <Text strong>{t}</Text>,
      sorter: (a, b) => (a.title || "").localeCompare(b.title || ""),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (t) => t || <Text type="secondary">—</Text>,
    },
    {
      title: "Video",
      dataIndex: "videoUrl",
      key: "videoUrl",
      width: 100,
      align: "center",
      render: (v) =>
        v ? (
          <a href={v} target="_blank" rel="noreferrer">
            <PlayCircleOutlined style={{ fontSize: 18 }} />
          </a>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Phút",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
      width: 80,
      align: "right",
      sorter: (a, b) => (a.durationMinutes ?? 0) - (b.durationMinutes ?? 0),
      render: (v) => v ?? 0,
    },
    {
      title: "Thứ tự",
      dataIndex: "orderIndex",
      key: "orderIndex",
      width: 90,
      align: "right",
      sorter: (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
      render: (v) => v ?? 0,
    },
    {
      title: "Quiz",
      dataIndex: "quizId",
      key: "quizId",
      width: 90,
      align: "center",
      render: (v) =>
        v ? <Tag color="blue">#{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, r) => (
        <Space size={0}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onOpenEdit(r)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(r)}
          />
        </Space>
      ),
    },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return (rows || []).filter(
      (r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 16 }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {/* Header */}
          <Card size="small">
            <Space
              wrap
              style={{ width: "100%", justifyContent: "space-between" }}
            >
              <Space>
                <BookOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                <Title level={4} style={{ margin: 0 }}>
                  Quản lý Bài học
                </Title>
              </Space>
              <Space>
                <Select
                  showSearch
                  style={{ width: 260 }}
                  value={activeSessionId ?? undefined}
                  onChange={setActiveSessionId}
                  placeholder="Chọn session"
                  optionFilterProp="label"
                >
                  {sessions.map((s) => {
                    const sid = s.sessionId ?? s.id ?? s.classId;
                    const label = s.name ?? s.title ?? `Session #${sid}`;
                    return (
                      <Select.Option key={sid} value={sid} label={label}>
                        {label} <Text type="secondary">(#{sid})</Text>
                      </Select.Option>
                    );
                  })}
                </Select>
              </Space>
            </Space>
          </Card>

          {/* Main Table */}
          <Card
            size="small"
            title={
              <Space>
                <Text strong>Danh sách bài học</Text>
                <Tag color="blue">{filtered.length}</Tag>
              </Space>
            }
            extra={
              <Space>
                <Input
                  allowClear
                  placeholder="Tìm kiếm..."
                  prefix={<SearchOutlined />}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ width: 220 }}
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() =>
                    activeSessionId && fetchLessons(activeSessionId)
                  }
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={onOpenCreate}
                  disabled={!activeSessionId}
                >
                  Tạo mới
                </Button>
              </Space>
            }
          >
            <Table
              size="small"
              rowKey="lessonId"
              columns={columns}
              dataSource={filtered}
              loading={loading}
              tableLayout="fixed"
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showTotal: (t) => `${t} bài học`,
              }}
            />
          </Card>
        </Space>
      </Content>

      {/* Modal */}
      <Modal
        open={open}
        width={700}
        title={editing ? "Chỉnh sửa bài học" : "Tạo bài học mới"}
        okText={editing ? "Cập nhật" : "Tạo"}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            sessionId: activeSessionId,
            durationMinutes: 0,
            orderIndex: rows.length,
          }}
        >
          <Form.Item
            label="Session"
            name="sessionId"
            rules={[{ required: true }]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: "Nhập tiêu đề" }]}
          >
            <Input
              maxLength={255}
              showCount
              placeholder="VD: Giới thiệu React"
            />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <TextArea
              rows={3}
              placeholder="Tóm tắt nội dung"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item label="Nội dung chi tiết" name="content">
            <TextArea
              rows={5}
              placeholder="Nội dung, tài liệu, code..."
              maxLength={5000}
              showCount
            />
          </Form.Item>

          <Space style={{ width: "100%" }} size={16}>
            <Form.Item
              label="Thời lượng (phút)"
              name="durationMinutes"
              style={{ flex: 1 }}
            >
              <InputNumber min={0} max={10000} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Thứ tự" name="orderIndex" style={{ flex: 1 }}>
              <InputNumber min={0} max={10000} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Quiz ID" name="quizId" style={{ flex: 1 }}>
              <InputNumber
                min={0}
                max={999999}
                style={{ width: "100%" }}
                placeholder="Tùy chọn"
              />
            </Form.Item>
          </Space>

          <Divider style={{ margin: "16px 0" }} />

          <Form.Item label="Video (tùy chọn)">
            <Dragger
              multiple={false}
              maxCount={1}
              accept="video/*"
              beforeUpload={(file) => {
                setUploadFile(file);
                return false;
              }}
              onRemove={() => setUploadFile(null)}
              fileList={uploadFile ? [uploadFile] : []}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Kéo thả hoặc chọn file video</p>
              <p className="ant-upload-hint" style={{ fontSize: 12 }}>
                MP4/AVI/MOV/WMV/FLV/WEBM (tối đa 3GB, upload lên Azure Storage)
              </p>
            </Dragger>
          </Form.Item>

          {editing?.videoUrl && !uploadFile && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Video hiện tại:
              </Text>
              <video
                src={editing.videoUrl}
                controls
                style={{ width: "100%", borderRadius: 8, marginTop: 8 }}
              />
            </div>
          )}
        </Form>
      </Modal>
    </Layout>
  );
}
