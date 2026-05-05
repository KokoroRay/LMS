import React, { useEffect, useState, useCallback } from "react";
import {
  Layout,
  Button,
  Typography,
  Space,
  Card,
  Table,
  Tag,
  Spin,
  message,
  Modal,
  Select,
} from "antd";
import {
  PlusOutlined,
  FormOutlined as LeaveRequestOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyLeaveRequests } from "../../redux/api/slices/leaveRequestSlice";
import LeaveRequestForm from "./LeaveRequestForm";
import dayjs from "dayjs";
import "../../styles/sider.css";

const { Title, Text } = Typography;
const { Header, Content } = Layout;
const { Option } = Select;

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

const columns = [
  { title: "Mã đơn", dataIndex: "id", key: "id", width: 80 },
  {
    title: "Thời gian nghỉ",
    dataIndex: "dates",
    key: "dates",
    width: 150,
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
    width: 250,
  },
  {
    title: "Ảnh chứng minh",
    dataIndex: "attachmentUrl",
    key: "attachmentUrl",
    width: 120,
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
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    render: getStatusTag,
    width: 120,
    align: "center",
  },
  {
    title: "Ngày nộp",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (text) => dayjs(text).format("HH:mm DD/MM/YYYY"),
    width: 150,
  },
  {
    title: "Người duyệt",
    dataIndex: "approverName",
    key: "approverName",
    render: (text) => text || "Chưa duyệt",
    width: 150,
  },
];

export default function MyLeaveRequestsPage() {
  const dispatch = useDispatch();
  const { myRequests, loading, error } = useSelector(
    (state) => state.leaveRequests
  );

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const total = myRequests.totalElements || 0;

  const fetchRequests = useCallback(() => {
    dispatch(fetchMyLeaveRequests({ page, size, status: selectedFilter }));
  }, [dispatch, page, size, selectedFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleSuccessfulSubmit = () => {
    setIsModalVisible(false);
    setPage(0);
    fetchRequests();
  };

  const handlePaginationChange = (newPage, newSize) => {
    setPage(newPage - 1);
    setSize(newSize);
  };

  const handleFilterChange = (newFilter) => {
    setSelectedFilter(newFilter);
    setPage(0);
  };

  const customPagination = {
    current: page + 1,
    pageSize: size,
    total: total,
    showSizeChanger: false,
    onChange: (newPage, newSize) => handlePaginationChange(newPage, newSize),
    position: ["bottomRight"],
  };

  const ControlsHeader = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        marginTop: 16,
        padding: "16px 24px",
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow:
          "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
        flexWrap: "wrap",
        gap: 12,
      }}
      className="responsive-header-box"
    >
      <Title
        level={4}
        style={{
          margin: 0,
          display: "flex",
          alignItems: "center",
          fontWeight: 600,
          fontSize: "1.25rem",
          flexShrink: 0,
        }}
      >
        <LeaveRequestOutlined
          style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
        />
        <span className="mobile-hide-text">Đơn xin nghỉ</span>
        <span className="desktop-hide-text">Đơn nghỉ</span>
      </Title>

      <Space wrap size="middle" style={{ flexWrap: "wrap" }}>
        <Space size={4} align="center" wrap>
          <Text style={{ fontWeight: 500 }} className="mobile-hide-text">Lọc theo:</Text>
          <Select
            style={{ width: 150, minWidth: 120 }}
            placeholder="Tất cả trạng thái"
            value={selectedFilter}
            onChange={handleFilterChange}
            size="small"
          >
            <Option value="all">Tất cả</Option>
            <Option value="PENDING">Chờ duyệt</Option>
            <Option value="APPROVED">Đã duyệt</Option>
            <Option value="REJECTED">Từ chối</Option>
          </Select>
        </Space>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          size="small"
          className="mobile-button"
        >
          <span className="mobile-hide-text">Nộp đơn</span>
          <span className="desktop-hide-text">Nộp</span>
        </Button>
      </Space>
    </div>
  );

  return (
    <>
      <div className="main-content">
        {ControlsHeader}

        <Card
          bordered={false}
          style={{
            borderRadius: 8,
            boxShadow:
              "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
          }}
          headStyle={{ padding: 0, border: "none" }}
          bodyStyle={{ padding: 0 }}
        >
          <Spin spinning={loading && myRequests.content.length === 0}>
            <Table
              columns={columns}
              dataSource={myRequests.content}
              rowKey="id"
              pagination={customPagination}
              loading={loading}
              scroll={{ x: "max-content" }}
              locale={{ emptyText: "Chưa có đơn xin nghỉ nào được gửi." }}
            />
          </Spin>
        </Card>
      </div>

      <Modal
        title={
          <Title level={4} style={{ margin: 0 }}>
            Nộp Đơn Xin Nghỉ
          </Title>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose={true}
      >
        <LeaveRequestForm
          onSuccessfulSubmit={handleSuccessfulSubmit}
          onCancel={() => setIsModalVisible(false)}
        />
      </Modal>
    </>
  );
}
