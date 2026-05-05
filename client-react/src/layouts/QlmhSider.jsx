import PropTypes from "prop-types";
import { Layout, Menu, Avatar, Space, Divider, Typography, Button } from "antd";
import { useNavigate } from "react-router-dom";
import {
  ClockCircleOutlined,
  BarChartOutlined,
  CalendarOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  FormOutlined as LeaveRequestOutlined,
  TrophyOutlined,
  DashOutlined,
  LineChartOutlined,
  CreditCardOutlined, // ===== THÊM ICON PAYMENT =====
} from "@ant-design/icons";
import "../styles/sider.css";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

const { Sider } = Layout;
const { Text } = Typography;

export default function QlmhSider({ activeKey }) {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    navigate("/dashboard", { replace: true });
  };

  const menuItems = [
    {
      key: "overview",
      path: "/qlmh",
      icon: <ClockCircleOutlined />,
      label: "Tổng quan",
    },
    {
      key: "progress",
      path: "/qlmh/progress",
      icon: <LineChartOutlined />,
      label: "Tiến trình",
    },
    {
      key: "scores",
      path: "/qlmh/checkpoint",
      icon: <BarChartOutlined />,
      label: "Xem điểm",
    },
    {
      key: "certificates",
      path: "/qlmh/certificates",
      icon: <TrophyOutlined />,
      label: "Chứng chỉ",
    },
    {
      key: "attendance",
      path: "/qlmh/attendance",
      icon: <CalendarOutlined />,
      label: "Điểm danh",
    },
    {
      key: "submit",
      path: "/qlmh/submit",
      icon: <FileDoneOutlined />,
      label: "Đăng kí thi lại",
    },
    {
      key: "leave",
      path: "/qlmh/leave",
      icon: <LeaveRequestOutlined />,
      label: "Đơn xin nghỉ",
    },
    // ===== PAYMENT HISTORY - Lịch sử thanh toán =====
    {
      key: "payment-history",
      path: "/qlmh/payment-history",
      icon: <CreditCardOutlined />,
      label: "Lịch sử thanh toán",
    },
  ].map((item) => ({
    ...item,
    className: `menu-item-${item.key}`,
  }));

  const handleMenuClick = (e) => {
    const item = menuItems.find((item) => item.key === e.key);
    if (item) navigate(item.path);
  };

  // IMPORTANT: Ensure your routing configuration (e.g., in App.jsx or routes/index.js)
  // has a route for "/qlmh/progress" that renders the LessonProgressPage component.
  // Also, make sure the activeKey prop passed to QlmhSider is correctly derived
  // from the current URL path (e.g., using useLocation().pathname) to highlight
  // the correct menu item.

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || "Người dùng";
  const displayAvatar =
    user?.avatarUrl ||
    "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg";

  const studentId = user?.studentCode || "Đang cập nhật...!";

  const displayDob = user?.dateOfBirth
    ? dayjs(user.dateOfBirth).format("DD/MM/YYYY")
    : "Đang cập nhật...!";
  const displayEmail = user?.email || "Đang cập nhật...!";
  const displayPhone = user?.phone || "Đang cập nhật...!";

  return (
    <Sider
      width={280}
      className="custom-sider desktop-sider"
      style={{
        background: "var(--sider-bg-color, #fff)",
        borderRight: "1px solid var(--border-color, #F3F4F6)",
        height: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "16px 0 32px 0", textAlign: "center" }}>
        <img src="/images/QLMH/Logo.svg" style={{ height: 36 }} alt="Logo" />
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={handleMenuClick}
          items={menuItems}
        />
      </div>

      <div style={{ paddingBottom: "16px" }}>
        <Divider style={{ margin: "16px 0" }} />
        <div style={{ padding: "0 16px" }}>
          <Space align="center" size={12} style={{ marginBottom: "16px" }}>
            <Avatar size={48} src={displayAvatar} icon={<UserOutlined />} />
            <div>
              <Text
                style={{
                  fontWeight: 600,
                  fontSize: "15px",
                  display: "block",
                }}
              >
                {displayName}
              </Text>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                {studentId}
              </Text>
            </div>
          </Space>

          <Space
            direction="vertical"
            size={8}
            style={{ width: "100%", paddingLeft: "8px" }}
          >
            <Space size={8}>
              <CalendarOutlined
                style={{ color: "#6B7280", fontSize: "14px" }}
              />
              <Text style={{ fontSize: "13px" }}>{displayDob}</Text>
            </Space>
            <Space size={8}>
              <MailOutlined style={{ color: "#6B7280", fontSize: "14px" }} />
              <Text style={{ fontSize: "13px" }}>{displayEmail}</Text>
            </Space>
            <Space size={8}>
              <PhoneOutlined style={{ color: "#6B7280", fontSize: "14px" }} />
              <Text style={{ fontSize: "13px" }}>{displayPhone}</Text>
            </Space>
          </Space>

          <Divider style={{ margin: "16px 0" }} />

          <Button
            type="text"
            icon={<LogoutOutlined style={{ fontSize: "18px" }} />}
            size="large"
            danger
            className="logout-button"
            style={{
              fontWeight: 600,
              height: "48px",
              width: "100%",
              display: "flex",
              alignItems: "center",
              paddingLeft: "16px",
              borderRadius: "12px",
            }}
            onClick={handleLogout}
          >
            <span className="ant-menu-title-content">Dashboard</span>
          </Button>
        </div>
      </div>
    </Sider>
  );
}

QlmhSider.propTypes = { activeKey: PropTypes.string.isRequired };
