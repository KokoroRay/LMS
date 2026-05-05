import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Typography,
  Button,
  Table,
  message,
  Avatar,
  Input,
  Space,
  Popconfirm,
  Spin,
  Card,
  Tooltip,
  Tag,
} from "antd";
import {
  PlusOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";

import {
  getAllInstructors,
  deleteInstructor,
  createInstructor,
  updateInstructor,
} from "../../../services/authService";
import InstructorFormModal from "../../../components/modal/InstructorFormModal";

const { Title } = Typography;
const { Search } = Input;

const InstructorListPage = () => {
  const [allInstructors, setAllInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useSelector((state) => state.auth);

  const isAdmin = useMemo(
    () =>
      user?.roles?.some((role) => role === "ROLE_ADMIN" || role === "ADMIN"),
    [user]
  );

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllInstructors();
      setAllInstructors(response.data.data || []);
    } catch (error) {
      message.error("Failed to fetch instructors.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const filteredInstructors = useMemo(() => {
    if (!searchTerm) {
      return allInstructors;
    }
    return allInstructors.filter((instructor) => {
      const fullName = `${instructor.firstName || ""} ${
        instructor.lastName || ""
      }`.toLowerCase();
      const email = (instructor.email || "").toLowerCase();
      const code = (instructor.teacherCode || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      return (
        fullName.includes(term) || email.includes(term) || code.includes(term)
      );
    });
  }, [allInstructors, searchTerm]);

  const handleAdd = () => {
    setEditingInstructor(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingInstructor(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteInstructor(id);
      message.success("Instructor deleted successfully!");
      fetchInstructors();
    } catch (error) {
      message.error("Failed to delete instructor.");
    }
  };

  const handleModalFinish = async (formData) => {
    try {
      if (editingInstructor) {
        await updateInstructor(editingInstructor.userId, formData);
        message.success("Instructor updated successfully!");
      } else {
        await createInstructor(formData);
        message.success("Instructor created successfully!");
      }
      setIsModalVisible(false);
      fetchInstructors();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "An error occurred.";
      message.error(errorMsg);
    }
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatarUrl",
      key: "avatarUrl",
      width: 80,
      render: (url) => (
        <Avatar src={url || undefined} icon={<UserOutlined />} />
      ),
    },
    {
      title: "Full Name",
      key: "fullName",
      render: (_, record) =>
        `${record.firstName || ""} ${record.lastName || ""}`,
      sorter: (a, b) => (a.lastName || "").localeCompare(b.lastName || ""),
    },
    {
      title: "Instructor Code",
      dataIndex: "teacherCode",
      key: "teacherCode",
      sorter: (a, b) =>
        (a.teacherCode || "").localeCompare(b.teacherCode || ""),
    },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (status) => {
        let color = "grey";
        if (status === "ACTIVE") color = "green";
        if (status === "INACTIVE") color = "red";
        return <Tag color={color}>{status || "N/A"}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {" "}
          <Tooltip title="Edit">
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure to delete this instructor?"
              onConfirm={() => handleDelete(record.userId)}
              okText="Yes"
              cancelText="No"
              placement="left"
            >
              <Button danger ghost icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          padding: "16px 24px",
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow:
            "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
        }}
      >
        <Title
          level={4}
          style={{ margin: 0, display: "flex", alignItems: "center" }}
        >
          <TeamOutlined
            style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
          />
          Instructor Management
        </Title>
        <Space>
          <Search
            placeholder="Search by Name, Email, Code..."
            onSearch={(value) => setSearchTerm(value)}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            New Instructor
          </Button>
        </Space>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredInstructors}
            rowKey="userId"
            pagination={{ pageSize: 10, size: "small" }}
            scroll={{ x: "max-content" }}
          />
        </Spin>
      </Card>

      <InstructorFormModal
        open={isModalVisible}
        onFinish={handleModalFinish}
        onCancel={() => setIsModalVisible(false)}
        initialValues={editingInstructor}
      />
    </div>
  );
};

export default InstructorListPage;
