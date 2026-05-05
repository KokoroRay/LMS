import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  message,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Popconfirm,
  Empty,
  Image,
  Spin,
  Avatar,
} from "antd";
import {
  BookOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  listSubjects,
  createSubjectManagementAPI,
  deleteSubjectManagementAPI,
  updateSubjectManagementAPI,
  getTeachers,
} from "../../../services/subjectService";

import SubjectEditModalAdmin from "../../../components/admin/subject/SubjectEditModalAdmin";
import SubjectCreateModalAdmin from "../../../components/admin/subject/SubjectCreateModalAdmin";

import "../../../styles/teacher/teachercoursemanagement.css";

const { Title, Text } = Typography;

const slugify = (s = "") =>
  s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const STATUS_META = {
  DRAFT: { color: "default", label: "Nháp" },
  PUBLISHED: { color: "green", label: "Hoạt động" },
  INACTIVE: { color: "orange", label: "Tạm dừng" },
  ARCHIVED: { color: "red", label: "Ngừng" },
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeSubject = (subject) => ({
  id: subject.courseId,
  subjectId: subject.courseId,
  title: subject.title || "Untitled Subject",
  slug: subject.slug || slugify(subject.title || ""),
  shortDescription:
    subject.shortDescription || subject.description || "No description",
  longDescription:
    subject.longDescription || subject.description || "No description",
  description:
    subject.longDescription || subject.description || "No description",
  level: subject.level || "BEGINNER",
  thumbnailUrl: subject.thumbnailUrl || "/images/Image 2.svg",
  price: toNumber(subject.price),
  status: (subject.status || "DRAFT").toUpperCase(),
  categoryId: subject.categoryId ?? null,
  teacherIds: Array.isArray(subject.teacherIds)
    ? subject.teacherIds.map((id) => Number(id))
    : [],
  createdAt: subject.createdAt ?? null,
  updatedAt: subject.updatedAt ?? null,
  instructorId: subject.instructorId ?? null,
  instructorName: subject.instructorName || "Unknown Instructor",
  duration: subject.duration || "0 hours",
  chapters: toNumber(subject.chapters),
  students: toNumber(subject.students),
  rating: Number(subject.rating) || 0,
  tags: Array.isArray(subject.tags) ? subject.tags : [],
  requirements: Array.isArray(subject.requirements) ? subject.requirements : [],
  objectives: Array.isArray(subject.objectives) ? subject.objectives : [],
  assignmentsWeight: subject.assignments_weight,
  quizzesWeight: subject.quizzes_weight,
  examsWeight: subject.exams_weight,
  passingScore: subject.passing_score,
});

const SubjectManageAdmin = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const teacherMap = useMemo(() => {
    return teachers.reduce((acc, teacher) => {
      acc[teacher.id] = teacher.fullName;
      return acc;
    }, {});
  }, [teachers]);

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listSubjects();
      setSubjects(list.map(normalizeSubject));
    } catch (error) {
      console.error("Error loading subjects:", error);
      message.error("Chưa có dữ liệu môn học nào");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTeachers = useCallback(async () => {
    setTeachersLoading(true);
    try {
      const list = await getTeachers();
      setTeachers(list);
    } catch (error) {
      console.error("Error loading teachers:", error);
      message.error("Không thể tải danh sách giáo viên");
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
    loadTeachers();
  }, [loadSubjects, loadTeachers]);

  const handleEdit = (record) => {
    setEditingSubject(record);
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    setEditingSubject(null);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (subjectId) => {
    try {
      await deleteSubjectManagementAPI(subjectId);
      message.success("Xóa môn học thành công");
      loadSubjects();
    } catch (e) {
      console.error(e);
      message.error("Xóa môn học thất bại");
    }
  };

  const handleCreateSubmit = async (values) => {
    try {
      setSaving(true);
      const subjectData = {
        title: values.title,
        slug: values.slug || slugify(values.title),
        shortDescription: values.shortDescription,
        description: values.description,
        price: toNumber(values.price),
        level: values.level,
        status: (values.status || "DRAFT").toUpperCase(),
        categoryId: values.categoryId,
        teacherIds: values.teacherIds.map(Number),
        createdById: 1,
        assignments_weight: values.assignments_weight,
        quizzes_weight: values.quizzes_weight,
        exams_weight: values.exams_weight,
        passing_score: values.passing_score,
      };

      const formData = new FormData();
      formData.append("course", JSON.stringify(subjectData));

      if (values.thumbnail?.length > 0 && values.thumbnail[0].originFileObj) {
        formData.append("thumbnail", values.thumbnail[0].originFileObj);
      }

      await createSubjectManagementAPI(formData);

      message.success("Tạo môn học thành công");
      setIsCreateModalOpen(false);
      loadSubjects();
    } catch (error) {
      console.error("Error creating subject:", error);
      message.error(
        "Tạo môn học thất bại: " +
        (error?.response?.data?.message || error.message)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (values) => {
    const { subjectId, ...subjectDataValues } = values;
    if (!subjectId) {
      message.error("Lỗi: Không tìm thấy ID môn học để cập nhật.");
      return;
    }

    try {
      setSaving(true);
      const subjectData = {
        title: subjectDataValues.title,
        slug: subjectDataValues.slug || slugify(subjectDataValues.title),
        shortDescription: subjectDataValues.shortDescription,
        description: subjectDataValues.description,
        price: toNumber(subjectDataValues.price),
        level: subjectDataValues.level,
        status: (subjectDataValues.status || "DRAFT").toUpperCase(),
        categoryId: subjectDataValues.categoryId,
        teacherIds: subjectDataValues.teacherIds.map(Number),
        createdById: 1,
        assignments_weight: subjectDataValues.assignments_weight,
        quizzes_weight: subjectDataValues.quizzes_weight,
        exams_weight: subjectDataValues.exams_weight,
        passing_score: subjectDataValues.passing_score,
      };

      const formData = new FormData();
      formData.append("course", JSON.stringify(subjectData));

      if (
        subjectDataValues.thumbnail?.length > 0 &&
        subjectDataValues.thumbnail[0].originFileObj
      ) {
        formData.append(
          "thumbnail",
          subjectDataValues.thumbnail[0].originFileObj
        );
      }

      await updateSubjectManagementAPI(subjectId, formData);

      message.success("Cập nhật môn học thành công");
      setIsEditModalOpen(false);
      loadSubjects();
    } catch (error) {
      console.error("Error updating subject:", error);
      message.error(
        "Cập nhật môn học thất bại: " +
        (error?.response?.data?.message || error.message)
      );
    } finally {
      setSaving(false);
    }
  };
  const columns = [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Hình ảnh",
      dataIndex: "thumbnailUrl",
      width: 100,
      render: (url) => (
        <Image
          width={60}
          height={40}
          src={url}
          style={{ objectFit: "cover", borderRadius: 4 }}
          fallback="/images/Image 2.svg"
          alt="thumbnail"
        />
      ),
    },
    {
      title: "Tên Môn Học",
      dataIndex: "title",
      width: 260,
      render: (text) => <strong style={{ fontSize: 14 }}>{text}</strong>,
    },
    {
      title: "Giáo viên",
      dataIndex: "teacherIds",
      width: 180,
      render: (teacherIds) => {
        if (teachersLoading) return <Spin size="small" />;
        if (!teacherIds?.length) return <Text type="secondary">Chưa gán</Text>;
        const names = teacherIds.map((id) => teacherMap[id] || `ID: ${id}`);
        return (
          <Space direction="vertical" size="small">
            {names.map((name) => (
              <Tag icon={<UserOutlined />} key={name} color="purple">
                {name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Cấp độ",
      dataIndex: "level",
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Giá",
      dataIndex: "price",
      width: 120,
      render: (price) => (
        <span style={{ fontWeight: "bold", color: "#1890ff" }}>
          {price ? `${Number(price).toLocaleString()} VNĐ` : "Miễn phí"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s) => {
        const meta = STATUS_META[s] || { color: "default", label: s };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="primary"
            ghost
          />
          <Popconfirm
            title="Xóa môn học này?"
            description="Thao tác này không thể hoàn tác!"
            onConfirm={() => handleDelete(record.subjectId)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-dashboard roles-page">
      {/* Top action card */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: "12px 24px" }}>
        <Space style={{ width: "100%", justifyContent: "space-between", alignItems: "center" }}>
          <Space>
            <BookOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            <Title level={5} style={{ margin: 0 }}>
              Quản Lý Môn Học
            </Title>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            Thêm Môn Học Mới
          </Button>
        </Space>
      </Card>

      {/* Main card with table */}
      <Card
        title={
          <Space>
            <BookOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            <Title level={5} style={{ margin: 0 }}>
              Danh Sách Môn Học
            </Title>
          </Space>
        }
        bodyStyle={{ padding: "16px 24px" }}
      >
        <Table
          rowKey="subjectId"
          columns={columns}
          loading={loading}
          dataSource={subjects}
        />
      </Card>

      <SubjectCreateModalAdmin
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        confirmLoading={saving}
        teachers={teachers}
        loading={teachersLoading}
      />

      <SubjectEditModalAdmin
        open={isEditModalOpen}
        initialValues={editingSubject}
        onCancel={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        confirmLoading={saving}
        teachers={teachers}
        loading={teachersLoading}
      />
    </div>
  );
// ...existing code...
};
export default SubjectManageAdmin;
