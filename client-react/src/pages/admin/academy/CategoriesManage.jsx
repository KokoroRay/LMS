// src/pages/admin/academy/CategoriesManage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Typography,
  Button,
  Table,
  message,
  Input,
  Space,
  Popconfirm,
  Card,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";

import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../services/CourseCategoryService";
import CourseCategoryFormModal from "../../../components/modal/CourseCategoryFormModal";

const { Title, Text } = Typography;
const { Search } = Input;

const CategoriesManage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const categoriesData = await getAllCategories();
      console.log("DỮ LIỆU API TRẢ VỀ:", categoriesData);
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải khóa học:", error);
      message.error("Không thể tải khóa học.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter(
      (cat) =>
        (cat.name || "").toLowerCase().includes(term) ||
        (cat.description || "").toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  const handleOpenModal = (record = null) => {
    setEditingCategory(record);
    setIsModalOpen(true);
  };

  const handleModalFinish = async (formData) => {
    setIsSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.categoryId, formData);
        message.success("Cập nhật khóa học thành công!");
      } else {
        await createCategory(formData);
        message.success("Tạo khóa học mới thành công!");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Lỗi lưu dữ liệu.";
      if (error.response?.status === 409) {
        message.error(errorMsg);
      } else {
        message.error("Đã xảy ra lỗi, vui lòng thử lại.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      message.success("Xóa khóa học thành công!");
      fetchCategories();
    } catch (error) {
      message.error(
        "Lỗi xóa khóa học. Vui lòng kiểm tra khóa học có liên quan không."
      );
    }
  };

  const columns = [
    // 1. Cột STT
    {
      title: "STT",
      key: "stt",
      width: 80,
      align: "center",
      render: (text, record, index) => index + 1,
    },

    // 2. Cột Tên Khóa học
    {
      title: "Khóa học",
      dataIndex: "name",
      key: "name",
      width: 200,
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (text) => (
        <Title level={5} style={{ margin: 0 }}>
          {text}
        </Title>
      ),
    },

    // 3. Cột Các Chủ đề/Môn học (Hiển thị các course)
    {
      title: "Môn học",
      key: "courses",
      // Đảm bảo dữ liệu courses là mảng và có phần tử
      render: (_, record) => (
        <Space size={[0, 8]} wrap>
          {Array.isArray(record.courses) && record.courses.length > 0 ? (
            record.courses.map((course) => (
              <Tag key={course.courseId} color="geekblue">
                {course.title}
              </Tag>
            ))
          ) : (
            <Text type="secondary">Chưa có chủ đề nào</Text>
          )}
        </Space>
      ),
    },

    // 4. Cột Mô tả
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },

    // 5. Cột Thao tác
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title={`Xác nhận xóa khóa học "${record.name}"?`}
            onConfirm={() => handleDelete(record.categoryId)}
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            placement="left"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, minHeight: "100vh" }}>
      <Card style={{ marginBottom: 24 }}>
        <Title
          level={4}
          style={{ margin: 0, display: "flex", alignItems: "center" }}
        >
          <FolderOpenOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          Quản lý Khóa học và Môn học
        </Title>
      </Card>

      <Card>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Search
            placeholder="Tìm kiếm theo Tên hoặc Mô tả..."
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchCategories}>
              Tải lại
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal(null)}
            >
              Thêm Khóa học
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="categoryId"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 900 }}
        />
      </Card>

      <CourseCategoryFormModal
        open={isModalOpen}
        onFinish={handleModalFinish}
        onCancel={() => setIsModalOpen(false)}
        initialValues={editingCategory}
        isSaving={isSaving}
      />
    </div>
  );
};

export default CategoriesManage;
