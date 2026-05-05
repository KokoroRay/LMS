import React, { useEffect, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Card,
  Table,
  Tag,
  Typography,
  Tabs,
  Space,
  Button,
  message,
  Pagination,
  Spin,
  Modal,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  ScheduleOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  clearLeaveRequestError,
} from "../../../redux/api/slices/leaveRequestSlice";
import dayjs from "dayjs";
import { unwrapResult } from "@reduxjs/toolkit";
import "../../../styles/scrolltable.css";
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const getStatusTag = (status) => {
  switch (status) {
    case "APPROVED":
      return <Tag color="green">Đã duyệt</Tag>;
    case "REJECTED":
      return <Tag color="red">Từ chối</Tag>;
    case "PENDING":
    default:
      return <Tag color="gold">Chờ duyệt</Tag>;
  }
};

export default function LeaveManagementPage() {
  const dispatch = useDispatch();
  const { adminRequests, loading, error } = useSelector(
    (state) => state.leaveRequests
  );
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const total = adminRequests.totalElements || 0;

  const fetchRequests = useCallback(() => {
    dispatch(fetchAllLeaveRequests({ status: statusFilter, page, size }));
  }, [dispatch, statusFilter, page, size]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearLeaveRequestError());
    }
  }, [error, dispatch]);

  const handleAction = useCallback(
    (requestId, actionType) => {
      Modal.confirm({
        title:
          actionType === "approve"
            ? "Xác nhận Duyệt Đơn?"
            : "Xác nhận Từ chối Đơn?",
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn ${
          actionType === "approve" ? "duyệt" : "từ chối"
        } đơn xin nghỉ này không?`,
        okText: actionType === "approve" ? "Duyệt" : "Từ chối",
        okType: actionType === "approve" ? "primary" : "danger",
        cancelText: "Hủy",
        onOk: async () => {
          try {
            let action =
              actionType === "approve"
                ? approveLeaveRequest(requestId)
                : rejectLeaveRequest(requestId);
            const actionResult = await dispatch(action);
            unwrapResult(actionResult);
            message.success(
              `Đơn đã được ${
                actionType === "approve" ? "duyệt" : "từ chối"
              } thành công!`
            );
            fetchRequests();
          } catch (error) {
            message.error(error || `Thao tác ${actionType} thất bại.`);
          }
        },
      });
    },
    [dispatch, fetchRequests]
  );

  const handlePaginationChange = (newPage, newSize) => {
    const adjustedPage = newPage - 1;
    setPage(adjustedPage);
    setSize(newSize);
  };

  const handleTabChange = (key) => {
    setStatusFilter(key);
    setPage(0);
    setSize(10);
  };

  const customPagination = {
    current: page + 1,
    pageSize: size,
    total: total,
    showSizeChanger: false,
    onChange: handlePaginationChange,
    position: ["bottomRight"],
  };

  const columns = useMemo(
    () => [
      { title: "Mã đơn", dataIndex: "id", key: "id", width: 80 },
      {
        title: "Người nộp",
        dataIndex: "userFullName",
        key: "userFullName",
        width: 150,
      },
      {
        title: "Thời gian nghỉ",
        dataIndex: "dates",
        key: "dates",
        width: 170,
        render: (text, record) => (
          <Space direction="vertical" size={0}>
            <div>
              <b>Từ:</b> {dayjs(record.startDate).format("DD/MM/YYYY")}
            </div>
            <div>
              <b>Đến:</b> {dayjs(record.endDate).format("DD/MM/YYYY")}
            </div>
          </Space>
        ),
      },
      {
        title: "Lý do",
        dataIndex: "reason",
        key: "reason",
        ellipsis: true,
        width: 280,
      },
      {
        title: "Ảnh chứng minh",
        dataIndex: "attachmentUrl",
        key: "attachmentUrl",
        width: 150,
        render: (url) =>
          url ? (
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button type="link" size="small" icon={<LinkOutlined />}>
                Xem ảnh
              </Button>
            </a>
          ) : (
            <Text type="secondary" italic>
              Không có
            </Text>
          ),
      },
      {
        title: "Ngày nộp",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (text) => dayjs(text).format("HH:mm DD/MM/YYYY"),
        width: 150,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: getStatusTag,
        width: 120,
      },
      ...(statusFilter === "PENDING"
        ? [
            {
              title: "Hành động",
              key: "action",
              width: 180,
              render: (text, record) => (
                <Space size="small">
                  <Button
                    icon={<CheckOutlined />}
                    onClick={() => handleAction(record.id, "approve")}
                    type="primary"
                    size="small"
                  >
                    Duyệt
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => handleAction(record.id, "reject")}
                    type="default"
                    danger
                    size="small"
                  >
                    Từ chối
                  </Button>
                </Space>
              ),
            },
          ]
        : []),
      ...(statusFilter !== "PENDING"
        ? [
            {
              title: "Ngày duyệt",
              dataIndex: "approvalDate",
              key: "approvalDate",
              render: (text) =>
                text ? dayjs(text).format("HH:mm DD/MM/YYYY") : "N/A",
              width: 150,
            },
          ]
        : []),
    ],
    [statusFilter, handleAction]
  );

  const requiredTableWidth = columns.reduce(
    (sum, col) => sum + (col.width || 0),
    0
  );

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          padding: "16px 24px",
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow:
            "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
        }}
      >
        <Title
          level={4}
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
          }}
        >
          <ScheduleOutlined
            style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
          />
          Quản lý Đơn Xin Nghỉ
        </Title>
      </div>

      <Card
        bodyStyle={{ padding: 0 }}
        style={{
          borderRadius: 8,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}
      >
        <Tabs
          activeKey={statusFilter}
          onChange={handleTabChange}
          style={{ padding: "0 24px", marginBottom: 0 }}
          tabBarStyle={{ marginBottom: 0 }}
        >
          <TabPane tab="Chờ duyệt" key="PENDING" />
          <TabPane tab="Đã duyệt" key="APPROVED" />
          <TabPane tab="Đã từ chối" key="REJECTED" />
        </Tabs>

        <div style={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={adminRequests.content}
            rowKey="id"
            pagination={customPagination}
            loading={loading}
            scroll={{ x: requiredTableWidth }}
            locale={{ emptyText: "Không có đơn xin nghỉ nào trong mục này." }}
            className="custom-thin-scrollbar-table"
          />
        </div>
      </Card>
    </div>
  );
}
