import { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Divider,
  Dropdown,
  message,
  Grid,
  Typography,
  Space,
  Badge,
  Button,
} from "antd";
import {
  HomeOutlined,
  BookOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  KeyOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import ".././styles/header.css";
import HeaderSearch from "./HeaderSearch";
import MobileHamburger from ".././layouts/MobileHamBurGer";
import MobileDrawer from ".././layouts/MobileDrawer";
import { logout } from "../redux/api/slices/authSlice";
import ChangePasswordModal from "../components/modal/ChangePasswordModal";
import NotificationDropdown from "../components/notification/NotificationDropdown";

const { Header: AntHeader } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const Header = ({ onSearch }) => {
  const [current, setCurrent] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const screens = useBreakpoint();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const onScroll = () => {
      const s = window.scrollY > 0;
      setScrolled(s);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onClick = (e) => {
    setCurrent(e.key);
  };

  const handleLogout = () => {
    dispatch(logout());
    message.success("Đăng xuất thành công!");
    navigate("/login", { replace: true });
  };

  const menuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <NavLink to="/profile">Profile</NavLink>,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
      label: "Log out",
    },
  ];

  const onMenuClick = ({ key }) => {
    if (key === "logout") {
      handleLogout();
    }
    if (key === "change-password") {
      setPasswordModalOpen(true);
    }
  };

  const items = [
    {
      label: <NavLink to="/">Trang Chủ</NavLink>,
      key: "home",
      icon: <HomeOutlined />,
    },
    {
      label: <NavLink to="/blog">Bài Viết</NavLink>,
      key: "blog",
      icon: <BookOutlined />,
    },
    {
      label: <NavLink to="/forum">Diễn Đàn</NavLink>,
      key: "forum",
      icon: <MessageOutlined />,
    },
  ];

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || "Student";

  const displayRole = user?.role?.description || "Student";

  return (
    <AntHeader
      className={`app-header${scrolled ? " scrolled" : ""}`}
      style={{ lineHeight: "normal", padding: 0 }}
    >
      <div
        className="header-container"
        style={{ height: "100%", display: "flex", alignItems: "center" }}
      >
        <div className="header-inner">
          <div className="header-left">
            <img
              src="/images/LogoManKai.svg"
              alt="Logo"
              className="header-logo"
            />
            <Divider type="vertical" className="header-divider" />
            <Menu
              onClick={onClick}
              selectedKeys={[current]}
              mode="horizontal"
              items={items}
              className="header-menu"
              style={{
                border: "none",
                background: "transparent",
                lineHeight: "normal",
                minWidth: "450px",
              }}
            />
          </div>

          <div className="header-actions">
            <HeaderSearch onSearch={onSearch} />
            <MobileHamburger onClick={() => setDrawerOpen(true)} />
            <NotificationDropdown />
            <Dropdown
              menu={{ items: menuItems, onClick: onMenuClick }}
              trigger={["click"]}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar
                  size={38}
                  src={user?.avatarUrl || "https://i.pravatar.cc/100?img=12"}
                  icon={<UserOutlined />}
                  className="header-avatar-clickable"
                />
                {screens.lg && (
                  <div style={{ lineHeight: 1 }}>
                    <div style={{ fontWeight: 600 }}>{displayName}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {displayRole}
                    </Text>
                  </div>
                )}
              </Space>
            </Dropdown>
          </div>
        </div>
      </div>
      <div className="header-bottom-bar" />

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        avatarUrl={user?.avatarUrl}
      />
      <ChangePasswordModal
        key={passwordModalOpen ? 'open' : 'closed'}
        visible={passwordModalOpen}
        onCancel={() => setPasswordModalOpen(false)}
      />
    </AntHeader>
  );
};

export default Header;
