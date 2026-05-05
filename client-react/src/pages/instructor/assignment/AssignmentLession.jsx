// src/pages/instructor/assignment/AssignmentLession.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Layout, Card, Table, Button, Space, Tag, Tooltip, Modal, Form, Input,
  InputNumber, DatePicker, Switch, Select, message, Tree, Typography, Empty, Divider
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined, SearchOutlined,
  FolderOpenOutlined, FileTextOutlined, BookOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

import { listSessions } from "../../../services/sessionService";
import { listLessonsBySession } from "../../../services/lessonService";
import { getMyClasses } from "../../../services/classService";

import {
  getAssignmentsBySession,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../../../services/assignmentService";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const toLocalDateTime = (val) => (val ? dayjs(val).format("YYYY-MM-DDTHH:mm:ss") : null);

export default function AssignmentLessonPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filterText, setFilterText] = useState("");

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const [lessonTree, setLessonTree] = useState([]);           // Antd TreeData
  const [lessonTitleById, setLessonTitleById] = useState({}); // { [id]: title }
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [onlySelectedLesson, setOnlySelectedLesson] = useState(false);

  const [classes, setClasses] = useState([]);
  const [defaultClassId, setDefaultClassId] = useState(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  // ---------- Init ----------
  useEffect(() => {
    (async () => {
      try {
        const ses = await listSessions();
        const arr = Array.isArray(ses) ? ses : [];
        setSessions(arr);
        if (!activeSessionId && arr.length) {
          setActiveSessionId(arr[0].sessionId ?? arr[0].id ?? null);
        }
      } catch {
        message.error("Không lấy được danh sách Session.");
      }
    })();

    (async () => {
      try {
        const cls = await getMyClasses();
        const arr = Array.isArray(cls) ? cls : [];
        setClasses(arr);
        if (arr.length) setDefaultClassId(arr[0].classId);
      } catch {
        setClasses([]);
      }
    })();
  }, []);

  // ---------- Load lessons + assignments khi đổi session ----------
  useEffect(() => {
    if (!activeSessionId) return;

    (async () => {
      try {
        const list = await listLessonsBySession(activeSessionId);
        const { tree, titleMap } = toAntTree(list, (id) => openCreateForLesson(id));
        setLessonTree(tree);
        setLessonTitleById(titleMap);
        setSelectedLessonId(null);
      } catch {
        message.error("Không tải được danh sách Lesson.");
      }
    })();

    fetchAssignments(activeSessionId);
  }, [activeSessionId]);

  const fetchAssignments = useCallback(async (sessionId) => {
    setLoading(true);
    try {
      const data = await getAssignmentsBySession(sessionId);
      const mapped = (data || []).map((it) => ({
        ...it,
        postedAt: it.postedAt ? dayjs(it.postedAt) : null,
        dueDate: it.dueDate ? dayjs(it.dueDate) : null,
      }));
      setRows(mapped);
    } catch {
      message.error("Không tải được Assignment.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- Tree helpers ----------
  function toAntTree(listOrTree, onQuickAdd) {
    const isTree = Array.isArray(listOrTree) && listOrTree.some((n) => Array.isArray(n?.children));
    let roots = [];

    if (isTree) {
      roots = listOrTree;
    } else {
      const list = listOrTree || [];
      const byId = new Map();
      list.forEach((x) => byId.set(x.lessonId, { ...x, children: [] }));
      list.forEach((x) => {
        const n = byId.get(x.lessonId);
        if (x.parentLessonId && byId.get(x.parentLessonId)) {
          byId.get(x.parentLessonId).children.push(n);
        } else {
          roots.push(n);
        }
      });
    }

    const titleMap = {};
    const iconOf = (n) => (n.nodeType === "SECTION" ? <FolderOpenOutlined /> : <FileTextOutlined />);

    const makeTitle = (n) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</span>
        {n.nodeType !== "SECTION" && (
          <Tooltip title="Thêm bài tập cho bài học này">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={(e) => { e.stopPropagation(); onQuickAdd?.(n.lessonId); }}
            />
          </Tooltip>
        )}
      </div>
    );

    const mapNode = (n) => {
      if (n.nodeType !== "SECTION") titleMap[n.lessonId] = n.title;
      return {
        key: `lesson-${n.lessonId}`,
        title: makeTitle(n),
        icon: iconOf(n),
        selectable: n.nodeType !== "SECTION",
        isLeaf: n.nodeType === "LESSON" && !(n.children && n.children.length),
        children: (n.children || []).map(mapNode),
        meta: n,
      };
    };

    const tree = (roots || []).map(mapNode);
    return { tree, titleMap };
  }

  const onSelectLesson = (_, info) => {
    const meta = info?.node?.meta;
    setSelectedLessonId(meta && meta.nodeType !== "SECTION" ? meta.lessonId : null);
  };

  // ---------- Create / Edit ----------
  const openCreate = () => openCreateForLesson(selectedLessonId);
  const openCreateForLesson = (lessonId) => {
    if (!activeSessionId) return message.warning("Hãy chọn Session trước.");
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      sessionId: activeSessionId,
      classId: defaultClassId ?? undefined,
      referenceLessonId: lessonId ?? null,
      allowLate: false,
      maxScore: 100,
      postedAt: dayjs(),
    });
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.resetFields();
    form.setFieldsValue({
      sessionId: record.sessionId ?? activeSessionId,
      classId: record.classId ?? defaultClassId ?? undefined,
      referenceLessonId: record.referenceLessonId ?? selectedLessonId ?? null,
      title: record.title,
      description: record.description,
      postedAt: record.postedAt ? dayjs(record.postedAt) : null,
      dueDate: record.dueDate ? dayjs(record.dueDate) : null,
      maxScore: record.maxScore ?? 100,
      allowLate: !!record.allowLate,
      isPublished: !!record.isPublished,
    });
    setOpen(true);
  };

  const onFinish = async (values) => {
    const payload = {
      classId: values.classId,
      sessionId: values.sessionId,
      referenceLessonId: values.referenceLessonId ?? null,
      title: values.title?.trim(),
      description: values.description ?? "",
      postedAt: toLocalDateTime(values.postedAt),
      dueDate: toLocalDateTime(values.dueDate),
      maxScore: values.maxScore ?? 100,
      allowLate: !!values.allowLate,
      isPublished: !!values.isPublished,
    };

    if (!payload.classId) return message.warning("Vui lòng chọn lớp (Class).");
    if (!payload.title) return message.warning("Tiêu đề không được để trống.");
    if (payload.postedAt && payload.dueDate && dayjs(payload.dueDate).isBefore(dayjs(payload.postedAt))) {
      return message.warning("Hạn nộp phải sau thời điểm đăng bài.");
    }

    try {
      if (editing?.assignmentId) {
        await updateAssignment(editing.assignmentId, payload);
        message.success("Cập nhật thành công");
      } else {
        await createAssignment(payload);
        message.success("Tạo mới thành công");
      }
      setOpen(false);
      fetchAssignments(activeSessionId);
    } catch (e) {
      message.error(e?.response?.data?.message || "Lưu thất bại");
    }
  };

  // ---------- Table ----------
  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (t) => <Text strong>{t}</Text>,
    },
    {
      title: "Lesson",
      dataIndex: "referenceLessonId",
      key: "referenceLessonId",
      width: 220,
      render: (id) =>
        id ? (
          <Space size={6}>
            <Tag color="blue">#{id}</Tag>
            <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {lessonTitleById[id] || "—"}
            </span>
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
      filters: [
        { text: "Có gắn lesson", value: "has" },
        { text: "Không gắn", value: "none" },
      ],
      onFilter: (val, record) =>
        val === "has" ? !!record.referenceLessonId : !record.referenceLessonId,
    },
    {
      title: "Đăng lúc",
      dataIndex: "postedAt",
      key: "postedAt",
      width: 150,
      render: (v) => (v ? dayjs(v).format("DD/MM/YY HH:mm") : <Text type="secondary">—</Text>),
      sorter: (a, b) => (a.postedAt?.valueOf() ?? 0) - (b.postedAt?.valueOf() ?? 0),
    },
    {
      title: "Hạn nộp",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 150,
      render: (v) =>
        !v ? (
          <Text type="secondary">—</Text>
        ) : (
          <Text type={dayjs(v).isBefore(dayjs()) ? "danger" : undefined}>
            {dayjs(v).format("DD/MM/YY HH:mm")}
          </Text>
        ),
      sorter: (a, b) => (a.dueDate?.valueOf() ?? 0) - (b.dueDate?.valueOf() ?? 0),
    },
    {
      title: "Điểm",
      dataIndex: "maxScore",
      key: "maxScore",
      width: 80,
      align: "center",
      render: (v) => <Tag color="gold">{v ?? 100}</Tag>,
      sorter: (a, b) => (a.maxScore ?? 0) - (b.maxScore ?? 0),
    },
    {
      title: "Nộp trễ",
      dataIndex: "allowLate",
      key: "allowLate",
      width: 90,
      align: "center",
      render: (v) => (v ? <Tag color="success">Có</Tag> : <Tag>Không</Tag>),
      filters: [
        { text: "Cho phép", value: true },
        { text: "Không cho phép", value: false },
      ],
      onFilter: (val, record) => Boolean(record.allowLate) === val,
    },
    {
      title: "Published",
      dataIndex: "isPublished",
      key: "isPublished",
      width: 100,
      align: "center",
      render: (isPublished) => <Tag color={isPublished ? "green" : "default"}>{isPublished ? "Yes" : "No"}</Tag>,
      filters: [
        { text: "Yes", value: true },
        { text: "No", value: false },
      ],
      onFilter: (val, rec) => Boolean(rec.isPublished) === val,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, r) => (
        <Space size={0}>
          <Tooltip title="Chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() =>
                Modal.info({
                  title: r.title,
                  width: 600,
                  content: (
                    <div style={{ marginTop: 16 }}>
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <div><Text type="secondary">Session:</Text> <Tag>#{r.sessionId}</Tag></div>
                        <div>
                          <Text type="secondary">Lesson:</Text>{" "}
                          {r.referenceLessonId ? (
                            <Space size={6}>
                              <Tag color="blue">#{r.referenceLessonId}</Tag>
                              <span>{lessonTitleById[r.referenceLessonId] || "—"}</span>
                            </Space>
                          ) : (
                            "—"
                          )}
                        </div>
                        <div><Text type="secondary">Lớp:</Text> <Tag>#{r.classId}</Tag></div>
                        <div><Text type="secondary">Đăng:</Text> {r.postedAt ? dayjs(r.postedAt).format("DD/MM/YYYY HH:mm") : "—"}</div>
                        <div><Text type="secondary">Hạn:</Text> {r.dueDate ? dayjs(r.dueDate).format("DD/MM/YYYY HH:mm") : "—"}</div>
                        <Divider style={{ margin: "8px 0" }} />
                        <div>
                          <Text strong>Mô tả:</Text>
                          <div style={{ marginTop: 8, padding: 12, background: "#f5f5f5", borderRadius: 4 }}>
                            {r.description || <Text type="secondary">Không có</Text>}
                          </div>
                        </div>
                      </Space>
                    </div>
                  ),
                })
              }
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                Modal.confirm({
                  title: "Xác nhận xóa",
                  content: `Xóa bài tập "${r.title}"?`,
                  okText: "Xóa",
                  okButtonProps: { danger: true },
                  cancelText: "Hủy",
                  onOk: async () => {
                    await deleteAssignment(r.assignmentId);
                    message.success("Đã xóa");
                    fetchAssignments(activeSessionId);
                  },
                })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    let data = rows;
    if (onlySelectedLesson && selectedLessonId) {
      data = data.filter((r) => r.referenceLessonId === selectedLessonId);
    }
    return q ? data.filter((r) => (r.title || "").toLowerCase().includes(q)) : data;
  }, [rows, filterText, onlySelectedLesson, selectedLessonId]);

  // ---------- Render ----------
  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Content style={{ padding: 16 }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {/* Header */}
          <Card size="small">
            <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
              <Space>
                <BookOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                <Title level={4} style={{ margin: 0 }}>Quản lý Bài tập</Title>
              </Space>
              <Space>
                <Select
                  style={{ width: 260 }}
                  value={activeSessionId ?? undefined}
                  onChange={setActiveSessionId}
                  placeholder="Chọn session"
                  showSearch
                  optionFilterProp="label"
                >
                  {sessions.map((s) => {
                    const sid = s.sessionId ?? s.id;
                    const name = s.title || s.name || `Session #${sid}`;
                    return (
                      <Option key={sid} value={sid} label={name}>
                        {name} <Text type="secondary">(#{sid})</Text>
                      </Option>
                    );
                  })}
                </Select>
              </Space>
            </Space>
          </Card>

          <div style={{ display: "flex", gap: 16 }}>
            {/* Sidebar lessons */}
            <Card
              size="small"
              style={{ width: 320, flexShrink: 0 }}
              title={<Text strong>Danh sách bài học</Text>}
              extra={
                <Space size={8}>
                  <Tooltip title="Chỉ xem bài tập của bài học đã chọn">
                    <Switch
                      checked={onlySelectedLesson}
                      onChange={setOnlySelectedLesson}
                    />
                  </Tooltip>
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() =>
                      activeSessionId &&
                      listLessonsBySession(activeSessionId).then((list) => {
                        const { tree, titleMap } = toAntTree(list, (id) => openCreateForLesson(id));
                        setLessonTree(tree);
                        setLessonTitleById(titleMap);
                      })
                    }
                  />
                </Space>
              }
            >
              {activeSessionId ? (
                lessonTree?.length ? (
                  <>
                    <div style={{ maxHeight: 420, overflow: "auto", marginBottom: 8 }}>
                      <Tree showIcon defaultExpandAll onSelect={onSelectLesson} treeData={lessonTree} />
                    </div>
                    {selectedLessonId && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Đã chọn lesson: #{selectedLessonId} — {lessonTitleById[selectedLessonId]}
                      </Text>
                    )}
                    <div style={{ marginTop: 10 }}>
                      <Button
                        block
                        type="primary"
                        icon={<PlusOutlined />}
                        disabled={!selectedLessonId}
                        onClick={() => openCreateForLesson(selectedLessonId)}
                      >
                        Tạo bài tập cho bài học này
                      </Button>
                    </div>
                  </>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bài học" />
                )
              ) : (
                <Empty description="Chọn session" />
              )}
            </Card>

            {/* Main table */}
            <Card
              size="small"
              style={{ flex: 1 }}
              title={
                <Space>
                  <Text strong>Danh sách bài tập</Text>
                  <Tag color="blue">{filtered.length}</Tag>
                </Space>
              }
              extra={
                <Space>
                  <Input
                    allowClear
                    placeholder="Tìm kiếm..."
                    prefix={<SearchOutlined />}
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    style={{ width: 220 }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                    disabled={!activeSessionId}
                  >
                    Tạo mới
                  </Button>
                </Space>
              }
            >
              <Table
                size="small"
                rowKey="assignmentId"
                columns={columns}
                loading={loading}
                dataSource={filtered}
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  showTotal: (total) => `${total} bài tập`,
                }}
              />
            </Card>
          </div>
        </Space>
      </Content>

      {/* Modal create/edit */}
      <Modal
        open={open}
        width={720}
        title={editing ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
        okText={editing ? "Cập nhật" : "Tạo"}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            sessionId: activeSessionId,
            classId: defaultClassId ?? undefined,
            referenceLessonId: selectedLessonId,
            allowLate: false,
            maxScore: 100,
            postedAt: dayjs(),
          }}
        >
          <Space style={{ width: "100%" }} size={16}>
            <Form.Item label="Session" name="sessionId" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input disabled />
            </Form.Item>
            <Form.Item label="Lớp" name="classId" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select placeholder="Chọn lớp" showSearch optionFilterProp="label">
                {classes.map((c) => (
                  <Option key={c.classId} value={c.classId} label={c.className}>
                    {c.className || `Lớp #${c.classId}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          <Form.Item label="Bài học (tùy chọn)" name="referenceLessonId">
            <Input disabled placeholder="Chọn từ danh sách bên trái hoặc nút + ở mỗi bài" />
          </Form.Item>

          <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
            <Input maxLength={255} showCount placeholder="Tiêu đề bài tập" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} placeholder="Mô tả chi tiết..." maxLength={2000} showCount />
          </Form.Item>

          <Space style={{ width: "100%" }} size={16}>
            <Form.Item label="Thời gian đăng" name="postedAt" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
            </Form.Item>
            <Form.Item label="Hạn nộp" name="dueDate" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
            </Form.Item>
          </Space>

          <Space style={{ width: "100%" }} size={16}>
            <Form.Item label="Điểm tối đa" name="maxScore" style={{ flex: 1 }}>
              <InputNumber min={0} max={1000} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Nộp trễ" name="allowLate" valuePropName="checked" style={{ flex: 1 }}>
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
            <Form.Item label="Published" name="isPublished" valuePropName="checked" style={{ flex: 1 }}>
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Layout>
  );
}
