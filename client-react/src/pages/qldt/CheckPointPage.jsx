import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Layout,
  Button,
  Drawer,
  Typography,
  Menu,
  Divider,
  Space,
  Avatar,
  Row,
  Select,
  Table,
  Tag,
  message,
  Spin,
  Card,
} from "antd";
import {
  MenuOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  CalendarOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  FormOutlined as LeaveRequestOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import QlmhSider from "../../layouts/QlmhSider";
import "../../styles/sider.css";

import {
  getAllExamsForStudent,
  getExamResults,
} from "../../services/examService";
import dayjs from "dayjs";

const { Content, Header } = Layout;
const { Text, Title } = Typography;
const { Option } = Select;

function MobileDrawerContent({ activeKey, onClose, user }) {
  const navigate = useNavigate();
  const menuItems = [
    {
      key: "overview",
      path: "/qldt",
      icon: <ClockCircleOutlined />,
      label: "Tổng quan",
    },
    {
      key: "scores",
      path: "/checkpoint",
      icon: <BarChartOutlined />,
      label: "Xem điểm",
    },
    {
      key: "attendance",
      path: "/attendance",
      icon: <CalendarOutlined />,
      label: "Điểm danh",
    },
    {
      key: "submit",
      path: "/submit",
      icon: <FileDoneOutlined />,
      label: "Nộp bài",
    },
    {
      key: "leave",
      path: "/leave",
      icon: <LeaveRequestOutlined />,
      label: "Đơn xin nghỉ",
    },
  ];

  const handleMenuClick = (e) => {
    const item = menuItems.find((i) => i.key === e.key);
    if (item) {
      navigate(item.path);
      onClose();
    }
  };

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || "Người dùng";
  const studentId = user?.studentCode || "Đang cập nhật...!";
  const displayAvatar =
    user?.avatarUrl ||
    "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg";
  const displayDob = user?.dateOfBirth
    ? dayjs(user.dateOfBirth).format("DD/MM/YYYY")
    : user?.dob
    ? dayjs(user.dob).format("DD/MM/YYYY")
    : "Đang cập nhật...!";
  const displayEmail = user?.email || "Đang cập nhật...!";
  const displayPhone = user?.phone || "Đang cập nhật...!";

  const handleMobileLogout = () => {
    message.success("Đăng xuất thành công!");
    navigate("/login", { replace: true });
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Row
        justify="space-between"
        align="middle"
        style={{ padding: "16px 24px" }}
      >
        <img src="/images/QLDT/Logo.svg" style={{ height: 28 }} alt="Logo" />
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
      </Row>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={handleMenuClick}
          items={menuItems.map((item) => ({
            ...item,
            className: `menu-item-${item.key}`,
          }))}
          style={{ border: "none" }}
        />
        <Divider />
        <Space direction="vertical" size="large" style={{ padding: "0 24px" }}>
          <Space>
            <CalendarOutlined />
            <Text>Ngày sinh: {displayDob}</Text>
          </Space>
          <Space>
            <MailOutlined />
            <Text>Email: {displayEmail}</Text>
          </Space>
          <Space>
            <PhoneOutlined />
            <Text>Số điện thoại: {displayPhone}</Text>
          </Space>
        </Space>
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Avatar size="large" src={displayAvatar} icon={<UserOutlined />} />
            <div
              style={{
                marginLeft: "12px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Text strong>{displayName}</Text>
              <Text type="secondary">{studentId}</Text>
            </div>
          </div>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            danger
            onClick={handleMobileLogout}
          />
        </div>
      </div>
    </div>
  );
}
MobileDrawerContent.propTypes = {
  activeKey: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
};

export default function CheckPointPage() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const user = useSelector((s) => s.auth.user);

  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    setLoadingExams(true);
    getAllExamsForStudent()
      .then((resp) => {
        setExams(resp.data?.data || []);
      })
      .catch((err) => {
        // Failed to load exams list
        message.error("Lỗi khi tải danh sách kỳ thi.");
      })
      .finally(() => {
        setLoadingExams(false);
      });
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      setLoadingResults(true);
      getExamResults(selectedExamId)
        .then((resp) => {
          setResults(resp.data?.data || []);
        })
        .catch((err) => {
          // Failed to load exam results
          message.error("Lỗi khi tải kết quả của kỳ thi này.");
          setResults([]);
        })
        .finally(() => {
          setLoadingResults(false);
        });
    } else {
      setResults([]);
    }
  }, [selectedExamId]);

  const examOptions = useMemo(() => {
    return exams.map((exam) => ({
      label: `${exam.title} (${exam.className})`,
      value: exam.examId,
    }));
  }, [exams]);

  const columns = [
    { title: "ID Bài nộp", dataIndex: "resultId", key: "resultId", width: 100 },
    {
      title: "Thời gian nộp",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (text) => (text ? dayjs(text).format("HH:mm DD/MM/YYYY") : "N/A"),
    },
    {
      title: "Trạng thái",
      dataIndex: "gradedAt",
      key: "status",
      render: (gradedAt) =>
        gradedAt ? (
          <Tag color="green">Đã chấm</Tag>
        ) : (
          <Tag color="blue">Đang chờ</Tag>
        ),
    },
    {
      title: "Điểm số",
      dataIndex: "score",
      key: "score",
      render: (score, record) =>
        record.gradedAt
          ? score !== null
            ? parseFloat(score).toFixed(2)
            : "N/A"
          : "N/A",
    },
    {
      title: "Nhận xét",
      dataIndex: "feedback",
      key: "feedback",
      ellipsis: true,
    },
  ];

  const customPagination = {
    pageSize: 5,
    position: ["bottomRight"],
  };

  const ControlsHeader = (
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
        <BarChartOutlined
          style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
        />
        Xem điểm
      </Title>

      <Space wrap size="middle" style={{ flexWrap: "wrap" }}>
        <Space size={4} align="center">
          <Text style={{ fontWeight: 500 }}>Chọn kỳ thi:</Text>
          <Select
            style={{ width: 300, minWidth: 150 }}
            placeholder="Chọn một kỳ thi để xem điểm"
            loading={loadingExams}
            value={selectedExamId}
            options={examOptions}
            onChange={(value) => setSelectedExamId(value)}
            allowClear
          />
        </Space>
      </Space>
    </div>
  );

  const MobileHeaderContent = (
    <Header className="mobile-header">
      <Row align="middle" justify="space-between" style={{ width: "100%" }}>
        <Space size="middle" align="center">
          <img src="/images/QLDT/Logo.svg" style={{ height: 24 }} alt="Logo" />
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            Xem điểm
          </Title>
        </Space>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerVisible(true)}
        />
      </Row>
    </Header>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: "#f7f7f8" }}>
      <QlmhSider activeKey="scores" />

      <Drawer
        placement="right"
        width={320}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        <MobileDrawerContent
          activeKey="scores"
          onClose={() => setDrawerVisible(false)}
          user={user}
        />
      </Drawer>

      <Layout>
        {MobileHeaderContent}

        <Content>
          <div className="main-content">
            <div className="desktop-only">{ControlsHeader}</div>

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
              <Spin spinning={loadingResults}>
                <Table
                  dataSource={results}
                  columns={columns}
                  rowKey="resultId"
                  pagination={customPagination}
                  scroll={{ x: "max-content" }}
                  locale={{ emptyText: "Chưa có bài nộp nào cho kỳ thi này." }}
                />
              </Spin>
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
