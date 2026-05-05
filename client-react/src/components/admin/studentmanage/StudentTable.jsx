import React, { useMemo } from "react";
import { Table, Avatar, Tag, Space, Button, Tooltip, Typography } from "antd";
import {
  EditOutlined, DeleteOutlined, EyeOutlined, KeyOutlined, UserOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
// Hàm hỗ trợ lấy màu trạng thái
const STATUS_COLOR = (s) => (s === "ACTIVE" ? "green" : s === "PENDING" ? "orange" : "red");

export default function StudentTable({
  data = [],
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  sortBy,
  sortDir,
  onSorterChange,
  onView,
  onEdit,
  onChangePassword,
  onDelete,
}) {
  const columns = useMemo(() => {
    return [
      {
        title: "STT",
        key: "index",
        width: 60,
        align: "center",
        // Tính toán STT dựa trên trang và index của phần tử
        render: (_, __, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: "Avatar",
        dataIndex: "avatarUrl",
        key: "avatarUrl",
        width: 80,
        render: (url) => <Avatar size={32} src={url || undefined} icon={<UserOutlined />} />,
      },
      {
        title: "Tên",
        key: "fullName",
        sorter: true,
        width: 200,
        ellipsis: true,
        sortOrder: sortBy === "fullName" ? (sortDir === "asc" ? "ascend" : "descend") : null,
        render: (_, r) => {
          const name = r.firstName || r.lastName
            ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim()
            : (r.username || "No name");
          return <Text ellipsis={{ tooltip: name }}>{name}</Text>;
        },
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        sorter: true,
        width: 240,
        ellipsis: true,
        sortOrder: sortBy === "email" ? (sortDir === "asc" ? "ascend" : "descend") : null,
        render: (v) => <Text ellipsis={{ tooltip: v }}>{v || "—"}</Text>,
      },
      {
        title: "Mã sinh viên",
        dataIndex: "studentCode",
        key: "studentCode",
        width: 140,
        sorter: true,
        sortOrder: sortBy === "studentCode" ? (sortDir === "asc" ? "ascend" : "descend") : null,
        render: (v) => v || "—",
      },
      {
        title: "Lớp",
        dataIndex: "className",
        key: "className",
        width: 120,
        ellipsis: true,
        render: (v) => v || "—",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (s) => (s ? <Tag color={STATUS_COLOR(s)}>{s}</Tag> : "—"),
      },
      {
        title: "Hành động",
        key: "actions",
        fixed: "right",
        width: 168, // Đủ rộng cho 4 nút nhỏ
        render: (_, r) => (
          <Space size="small">
            {/* Xem */}
            {/* Sửa */}
            <Tooltip title="Sửa"><Button size="small" icon={<EditOutlined />} onClick={() => onEdit(r)} /></Tooltip>
            {/* Password */}
            <Tooltip title="Đổi mật khẩu"><Button size="small" icon={<KeyOutlined />} onClick={() => onChangePassword(r)} /></Tooltip>
            {/* Xóa */}
            <Tooltip title="Xóa"><Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(r.userId)} /></Tooltip>
          </Space>
        ),
      },
    ];
  }, [page, pageSize, sortBy, sortDir, onEdit, onChangePassword, onDelete]);

  return (
    <Table
      rowKey={(r) => r.userId}
      dataSource={data}
      columns={columns}
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
      }}
      onChange={(pagination, _filters, sorter) => {
        if (pagination?.current && pagination.current !== page) {
          onPageChange(pagination.current);
        }
        if (sorter && sorter.field !== undefined) {
          const order = sorter.order === "ascend" ? "asc" : sorter.order === "descend" ? "desc" : undefined;
          let field = sorter.field;
          // Ánh xạ trường hiển thị sang trường backend
          if (sorter.columnKey === "fullName") field = "fullName";
          if (sorter.columnKey === "studentCode") field = "studentCode";
          if (sorter.columnKey === "email") field = "email";
          onSorterChange(field, order);
        }
      }}
      scroll={{ x: 1200 }} // Đảm bảo bảng cuộn ngang nếu cần
    />
  );
}