import React from "react";
import PropTypes from "prop-types";
import {
  Layout,
  Button,
  Typography,
  Menu,
  Divider,
  Space,
  Avatar,
  Row,
  message,
} from "antd";
import {
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
  CreditCardOutlined, // ===== THÊM ICON PAYMENT =====
  LineChartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/api/slices/authSlice";
import dayjs from "dayjs";

const { Text } = Typography;

export default function MobileDrawerContent({ activeKey, onClose }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

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
      label: "Đăng kí học lại",
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
    dispatch(logout());
    message.success("Đăng xuất thành công!");
    navigate("/dashboard", { replace: true });
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Row
        justify="space-between"
        align="middle"
        style={{ padding: "16px 24px" }}
      >
        <img src="/images/QLMH/Logo.svg" style={{ height: 28 }} alt="Logo" />
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
};
