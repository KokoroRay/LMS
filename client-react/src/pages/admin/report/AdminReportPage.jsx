import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Table,
  Button,
  message,
  Space,
  Spin,
  Tag,
  Select,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Tooltip,
  Modal,
} from "antd";
import {
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  getReportsAPI,
  getReportStatsAPI,
  updateReportStatusAPI,
  deleteReportAPI,
  resolveReportAPI,
} from "../../../services/forumReportService";
import { formatDate } from "../../../utils/forum";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const REPORT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Đang chờ xử lý", color: "processing" },
  { value: "UNDER_REVIEW", label: "Đang xem xét", color: "warning" },
  {
    value: "RESOLVED",
    label: "Đã giải quyết (Xóa nội dung)",
    color: "success",
  },
  { value: "DISMISSED", label: "Bác bỏ (Giữ nội dung)", color: "error" },
];

const AdminReportPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [currentStatus, setCurrentStatus] = useState("ALL");
  const [stats, setStats] = useState({});

  const fetchReports = useCallback(async (status, page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page: page - 1,
        size: pageSize,
      };

      if (status !== "ALL") {
        params.status = status;
      }

      const res = await getReportsAPI(params);
      const data = res?.data?.data;

      if (data && Array.isArray(data.content)) {
        setReports(data.content);
        setPagination((prev) => ({
          ...prev,
          current: data.pageable.pageNumber + 1,
          total: data.totalElements,
        }));
      } else {
        setReports([]);
        setPagination((prev) => ({ ...prev, total: 0 }));
      }
    } catch (error) {
      message.error("Lỗi tải danh sách báo cáo.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getReportStatsAPI();
      const statsData = res?.data?.data || {};

      if (!statsData.TOTAL) {
        statsData.TOTAL =
          (statsData.PENDING || 0) +
          (statsData.UNDER_REVIEW || 0) +
          (statsData.RESOLVED || 0) +
          (statsData.DISMISSED || 0);
      }

      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReports(currentStatus, pagination.current, pagination.pageSize);
  }, [currentStatus, pagination.current, pagination.pageSize, fetchReports]);

  // --- LOGIC QUAN TRỌNG ĐÃ SỬA (Cập nhật UI ngay lập tức) ---
  const handleUpdateStatus = async (record, newStatus) => {
    // TRƯỜNG HỢP 1: CHỌN "ĐÃ GIẢI QUYẾT" (RESOLVED) => XÓA NỘI DUNG
    if (newStatus === "RESOLVED") {
      const isTopic = record.reportType === "TOPIC";

      Modal.confirm({
        title: isTopic
          ? "CẢNH BÁO: Xóa Chủ đề vi phạm?"
          : "Xác nhận: Xóa Bình luận vi phạm?",
        icon: <ExclamationCircleOutlined style={{ color: "red" }} />,
        content: (
          <div>
            <Paragraph>
              Bạn đang chọn giải quyết báo cáo <b>#{record.reportId}</b>.
            </Paragraph>
            {isTopic ? (
              <div
                style={{
                  backgroundColor: "#fff1f0",
                  padding: "10px",
                  border: "1px solid #ffa39e",
                  borderRadius: "4px",
                }}
              >
                <Text type="danger" strong>
                  Hậu quả:
                </Text>
                <ul style={{ margin: 0, paddingLeft: 20, color: "#cf1322" }}>
                  <li>Chủ đề này sẽ bị xóa vĩnh viễn.</li>
                  <li>
                    <b>TOÀN BỘ bình luận</b> bên trong chủ đề cũng sẽ bị xóa
                    theo.
                  </li>
                </ul>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#f6ffed",
                  padding: "10px",
                  border: "1px solid #b7eb8f",
                  borderRadius: "4px",
                }}
              >
                <Text type="success" strong>
                  Xử lý:
                </Text>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>
                    Chỉ xóa <b>bình luận</b> bị báo cáo này.
                  </li>
                  <li>
                    Chủ đề gốc và các bình luận khác <b>VẪN GIỮ NGUYÊN</b>.
                  </li>
                </ul>
              </div>
            )}
          </div>
        ),
        okText: isTopic
          ? "Xóa Chủ đề & Giải quyết"
          : "Xóa Bình luận & Giải quyết",
        okType: "danger",
        cancelText: "Hủy bỏ",
        onOk: async () => {
          try {
            // Gọi API backend
            await resolveReportAPI(record.reportId, true);

            message.success(
              isTopic
                ? `Đã xóa chủ đề và giải quyết báo cáo #${record.reportId}`
                : `Đã xóa bình luận và giải quyết báo cáo #${record.reportId}`
            );

            // [QUAN TRỌNG] Cập nhật UI ngay lập tức (Optimistic Update)
            setReports((prevReports) =>
              prevReports.map((item) =>
                item.reportId === record.reportId
                  ? { ...item, status: "RESOLVED" }
                  : item
              )
            );

            // Gọi fetch ngầm để đồng bộ lại sau
            fetchStats();
            fetchReports(
              currentStatus,
              pagination.current,
              pagination.pageSize
            );
          } catch (error) {
            message.error("Lỗi hệ thống: Không thể giải quyết báo cáo.");
          }
        },
      });
    }

    // TRƯỜNG HỢP 2: CHỌN "BÁC BỎ" (DISMISSED)
    else if (newStatus === "DISMISSED") {
      Modal.confirm({
        title: "Bác bỏ báo cáo?",
        content:
          "Hành động này xác nhận nội dung KHÔNG vi phạm. Nội dung sẽ được giữ lại và báo cáo sẽ đóng.",
        okText: "Bác bỏ báo cáo",
        cancelText: "Hủy",
        onOk: async () => {
          try {
            const data = {
              status: newStatus,
              resolutionNote: "Admin dismissed report",
            };
            await updateReportStatusAPI(record.reportId, data);
            message.success(`Đã bác bỏ báo cáo #${record.reportId}`);

            // [QUAN TRỌNG] Cập nhật UI ngay lập tức
            setReports((prevReports) =>
              prevReports.map((item) =>
                item.reportId === record.reportId
                  ? { ...item, status: "DISMISSED" }
                  : item
              )
            );

            fetchStats();
          } catch (error) {
            message.error("Lỗi khi cập nhật trạng thái.");
          }
        },
      });
    }

    // TRƯỜNG HỢP 3: CÁC TRẠNG THÁI KHÁC
    else {
      try {
        const data = { status: newStatus, resolutionNote: "" };
        await updateReportStatusAPI(record.reportId, data);
        message.success("Cập nhật trạng thái thành công");

        // [QUAN TRỌNG] Cập nhật UI ngay lập tức
        setReports((prevReports) =>
          prevReports.map((item) =>
            item.reportId === record.reportId
              ? { ...item, status: newStatus }
              : item
          )
        );

        fetchStats();
      } catch (error) {
        message.error("Lỗi khi cập nhật trạng thái.");
      }
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await deleteReportAPI(reportId);
      message.success(`Đã xóa báo cáo #${reportId}.`);

      // Xóa dòng đó khỏi bảng ngay lập tức
      setReports((prev) => prev.filter((item) => item.reportId !== reportId));

      fetchStats();
    } catch (error) {
      message.error("Lỗi khi xóa báo cáo.");
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const getTagProps = (status) =>
    REPORT_STATUS_OPTIONS.find((opt) => opt.value === status) || {
      color: "default",
      label: status,
    };

  const columns = [
    {
      title: "ID",
      dataIndex: "reportId",
      key: "reportId",
      width: 80,
      sorter: true,
    },
    {
      title: "Đối tượng & Lý do",
      dataIndex: "reason",
      key: "reason",
      render: (reason, record) => (
        <Space direction="vertical" size={2}>
          {record.reportType === "TOPIC" ? (
            <Tag color="geekblue">CHỦ ĐỀ</Tag>
          ) : (
            <Tag color="purple">BÌNH LUẬN</Tag>
          )}
          <Text strong style={{ fontSize: 13 }}>
            Lý do: {reason}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
            Link:{" "}
            {record.postId ? (
              <Typography.Link
                href={`/forum/topics/${
                  record.topicId || record.post?.topicId
                }?postId=${record.postId}`}
                target="_blank"
              >
                Xem Bình luận ID {record.postId}
              </Typography.Link>
            ) : (
              <Typography.Link
                href={`/forum/topics/${record.topicId}`}
                target="_blank"
              >
                Xem Chủ đề ID {record.topicId}
              </Typography.Link>
            )}
          </Text>
        </Space>
      ),
    },
    {
      title: "Người báo cáo",
      dataIndex: ["reporter", "firstName"],
      key: "reporter",
      render: (_, record) =>
        `${record.reporter?.firstName || ""} ${
          record.reporter?.lastName || ""
        }`,
    },
    {
      title: "Thời gian",
      dataIndex: "reportedAt",
      key: "reportedAt",
      width: 150,
      render: (date) => formatDate(date, "DD/MM/YYYY HH:mm"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => {
        const tag = getTagProps(status);
        return (
          <Tag color={tag.color} style={{ borderRadius: 4 }}>
            {tag.label}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xử lý vi phạm">
            <Select
              placeholder="Hành động"
              style={{ width: 140 }}
              onChange={(value) => handleUpdateStatus(record, value)}
              value={record.status}
              disabled={
                record.status === "RESOLVED" || record.status === "DISMISSED"
              }
              size="small"
            >
              {REPORT_STATUS_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Tooltip>

          <Tooltip title="Xóa dòng báo cáo này (Không xóa nội dung)">
            <Popconfirm
              title="Chỉ xóa dòng báo cáo này khỏi danh sách?"
              description="Nội dung bài viết/comment vẫn giữ nguyên."
              onConfirm={() => handleDeleteReport(record.reportId)}
              okText="Xóa báo cáo"
              cancelText="Hủy"
              placement="left"
            >
              <Button danger ghost icon={<DeleteOutlined />} size="small" />
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
          <WarningOutlined style={{ marginRight: 8, color: "#ff4d4f" }} />
          Quản lý Báo cáo Cộng đồng
        </Title>
        <Space>
          <Text strong>Lọc trạng thái:</Text>
          <Select
            style={{ width: 200 }}
            value={currentStatus}
            onChange={setCurrentStatus}
          >
            <Option value="ALL">Tất cả ({stats.TOTAL || 0})</Option>
            {REPORT_STATUS_OPTIONS.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label} ({stats[opt.value] || 0})
              </Option>
            ))}
          </Select>
          <Tooltip title="Tải lại dữ liệu">
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                fetchReports(
                  currentStatus,
                  pagination.current,
                  pagination.pageSize
                )
              }
              loading={loading}
              type="primary"
              ghost
            />
          </Tooltip>
        </Space>
      </div>
      <Card title="Thống kê Tình trạng" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          {REPORT_STATUS_OPTIONS.map((opt) => (
            <Col span={6} key={opt.value}>
              <Statistic
                title={opt.label}
                value={stats[opt.value] || 0}
                valueStyle={{
                  color:
                    opt.value === "PENDING"
                      ? "#faad14"
                      : opt.value === "RESOLVED"
                      ? "#52c41a"
                      : "#333",
                }}
                prefix={
                  opt.value === "PENDING" ? (
                    <ClockCircleOutlined />
                  ) : opt.value === "RESOLVED" ? (
                    <CheckCircleOutlined />
                  ) : opt.value === "DISMISSED" ? (
                    <CloseCircleOutlined />
                  ) : null
                }
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={reports}
            rowKey="reportId"
            pagination={{
              ...pagination,
              showSizeChanger: false,
              pageSizeOptions: ["10", "20", "50"],
              size: "small",
            }}
            onChange={handleTableChange}
            scroll={{ x: "max-content" }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default AdminReportPage;
