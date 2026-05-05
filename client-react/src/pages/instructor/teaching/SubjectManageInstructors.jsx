import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

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
  Input,
} from "antd";
import {
  BookOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import {
  createSubjectManagementAPI,
  deleteSubjectManagementAPI,
  updateSubjectManagementAPI,
  getMyCourses,
} from "../../../services/subjectService";

import SubjectEditModalInstructors from "../../../components/teacher/SubjectEditModalInstructors";
import "../../../styles/teacher/teachercoursemanagement.css";
import SubjectViewModalInstructors from "../../../components/teacher/SubjectViewModalInstructors";

const { Title } = Typography;
const { Search } = Input;

// --- Helpers ---------------------------------------------------------------
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

const normalizeSubject = (item) => {
  const rawId = item?.subjectId ?? item?.courseId ?? item?.id ?? null;
  return {
    id: rawId,
    subjectId: item?.subjectId ?? rawId,
    courseId: item?.courseId ?? rawId, 
    title: item?.title || "Untitled Subject",
    slug: item?.slug || slugify(item?.title || ""),
    shortDescription:
      item?.shortDescription || item?.description || "No description",
    longDescription:
      item?.longDescription || item?.description || "No description",
    description: item?.longDescription || item?.description || "No description",
    level: item?.level || "BEGINNER",
    thumbnailUrl: item?.thumbnailUrl || "/images/Image 2.svg",
    price: toNumber(item?.price),
    status: (item?.status || "DRAFT").toUpperCase(),
    categoryId: item?.categoryId ?? null,
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
    instructorId: item?.instructorId ?? null,
    instructorName: item?.instructorName || "Unknown Instructor",
    duration: item?.duration || "0 hours",
    chapters: toNumber(item?.chapters),
    students: toNumber(item?.students),
    rating: Number(item?.rating) || 0,
    tags: Array.isArray(item?.tags) ? item.tags : [],
    requirements: Array.isArray(item?.requirements) ? item.requirements : [],
    objectives: Array.isArray(item?.objectives) ? item.objectives : [],
  };
};

// ---------------------------------------------------------------------------
const SubjectManagementInstructors = () => {
  console.log(` [SUBJECT LIST COMPONENT] Mounted`);
  console.log(
    ` [SUBJECT LIST COMPONENT] Current URL: ${window.location.pathname}`
  );

  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingSubject, setViewingSubject] = useState(null);

  const [keyword, setKeyword] = useState("");

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMyCourses();
      setSubjects((list || []).map(normalizeSubject));
    } catch (error) {
      console.error("Error loading subjects:", error);
      message.error("Chưa có dữ liệu môn học nào");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleEdit = (e, record) => {
    e?.stopPropagation?.();
    setEditingSubject(record); // record đã có subjectId + courseId (fallback)
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingSubject(null);
    setModalOpen(true);
  };

  const handleDelete = async (e, id) => {
    e?.stopPropagation?.();
    const subjectId = id?.subjectId ?? id?.courseId ?? id;
    try {
      await deleteSubjectManagementAPI(subjectId);
      message.success("Xóa môn học thành công");
      loadSubjects();
    } catch (e2) {
      console.error(e2);
      message.error("Xóa môn học thất bại");
    }
  };

  const handleView = (e, record) => {
    e?.stopPropagation?.();
    setViewingSubject(record);
    setViewModalOpen(true);
  };

  // Common submit handler for modal
  const handleSubmit = async (values) => {
    const id = editingSubject?.subjectId ?? editingSubject?.courseId;
    if (id) {
      await updateSubject(id, values);
    } else {
      await createSubject(values);
    }
  };

  // --- Create / Update -----------------------------------------------------
  const createSubject = async (values) => {
    try {
      setSaving(true);
      const payload = {
        title: values.title,
        slug: values.slug || slugify(values.title),
        shortDescription: values.shortDescription,
        description: values.description,
        price: toNumber(values.price),
        level: values.level,
        status: (values.status || "DRAFT").toUpperCase(),
        categoryId: values.categoryId,
        createdById: 1,
      };

      if (values.thumbnail?.length > 0) {
        const formData = new FormData();
        formData.append("course", JSON.stringify(payload));
        formData.append("thumbnail", values.thumbnail[0].originFileObj);
        await createSubjectManagementAPI(formData);
      } else {
        await createSubjectManagementAPI(payload);
      }

      message.success("Tạo môn học thành công");
      setModalOpen(false);
      setEditingSubject(null);
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

  const updateSubject = async (subjectId, values) => {
    try {
      setSaving(true);
      const payload = {
        title: values.title,
        slug: values.slug || slugify(values.title),
        shortDescription: values.shortDescription,
        description: values.description,
        price: toNumber(values.price),
        level: values.level,
        status: (values.status || "DRAFT").toUpperCase(),
        categoryId: values.categoryId,
        createdById: 1,
      };

      if (values.thumbnail?.length > 0) {
        const formData = new FormData();
        formData.append("course", JSON.stringify(payload));
        formData.append("thumbnail", values.thumbnail[0].originFileObj);
        await updateSubjectManagementAPI(subjectId, formData);
      } else {
        await updateSubjectManagementAPI(subjectId, payload);
      }

      message.success("Cập nhật môn học thành công");
      setModalOpen(false);
      setEditingSubject(null);
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

  // --- Search / Filter -----------------------------------------------------
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return subjects;
    return subjects.filter((s) => {
      const t = (s.title || "").toLowerCase();
      const sl = (s.slug || "").toLowerCase();
      return t.includes(kw) || sl.includes(kw);
    });
  }, [subjects, keyword]);

  // --- Table ---------------------------------------------------------------
  const columns = [
    {
      title: "STT",
      width: 80,
      align: "center",
      render: (t, r, i) => i + 1,
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
      render: (text) => <strong style={{ fontSize: 14 }}>{text}</strong>,
    },
    {
      title: "Cấp độ",
      dataIndex: "level",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Giá",
      dataIndex: "price",
      render: (price) => (
        <span style={{ fontWeight: "bold", color: "#1890ff" }}>
          {price ? `${Number(price).toLocaleString()} VNĐ` : "Miễn phí"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => {
        const s = (status || "DRAFT").toUpperCase();
        const meta = STATUS_META[s] || STATUS_META.DRAFT;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      align: "right",
      render: (_, record) => {
        const id = record.subjectId ?? record.courseId;
        return (
          <Space onClick={(e) => e.stopPropagation()}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => handleView(e, record)}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <div className="admin-dashboard roles-page">
      <Card
        title={
          <Space>
            <BookOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            <Title level={5} style={{ margin: 0 }}>
              TRANG DANH SÁCH QUẢN LÝ MÔN HỌC
            </Title>
          </Space>
        }
        bodyStyle={{ padding: "16px 24px" }}
      >
        <Table
          className="roles-table"
          size="middle"
          rowKey={(r) => r.subjectId ?? r.courseId} 
          columns={columns}
          loading={loading}
          dataSource={filtered}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} môn học`,
            showSizeChanger: false,
            pageSizeOptions: ["10", "20", "50"],
          }}
          locale={{ emptyText: <Empty description="Chưa có môn học" /> }}
          onRow={(record) => ({
            onClick: () => {
              const id = record.subjectId ?? record.courseId;
              console.log(`[SubjectManage] Navigating to course detail: ${id}`);
              console.log(
                `[SubjectManage] URL will be: /instructor/course/${id}/structure`
              );
              if (id) navigate(`/instructor/course/${id}/structure`);
            },
            style: { cursor: "pointer" },
          })}
        />
      </Card>

      <SubjectEditModalInstructors
        open={modalOpen}
        initialValues={editingSubject}
        onCancel={() => {
          setModalOpen(false);
          setEditingSubject(null);
        }}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      />

      <SubjectViewModalInstructors
        open={viewModalOpen}
        subjectData={viewingSubject}
        onCancel={() => setViewModalOpen(false)}
      />
    </div>
  );
};

export default SubjectManagementInstructors;
