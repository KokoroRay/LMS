import { Drawer, Avatar, Divider, message } from "antd";
import {
  HomeOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  ReadOutlined,
  MessageOutlined,
} from "@ant-design/icons";

import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/api/slices/authSlice";

const MobileDrawer = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || "Người dùng";
  const displayEmail = user?.email || "email@example.com";
  const displayAvatar =
    user?.avatarUrl ||
    "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg";

  const handleLogout = () => {
    try {
      onClose();
      dispatch(logout());
      message.success("Đã đăng xuất thành công");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  return (
    <Drawer
      className="mobile-drawer"
      placement="right"
      open={open}
      onClose={onClose}
      width={Math.min(
        typeof window !== "undefined" ? window.innerWidth * 0.86 : 320,
        420
      )}
      closeIcon={false}
      styles={{ body: { padding: 0 } }}
    >
      <div className="mobile-drawer-inner">
        <div className="mobile-drawer-header">
          <img
            src="/images/LogoManKai.svg"
            alt="Logo"
            className="drawer-logo"
          />
        </div>
        <div className="mobile-drawer-content">
          <NavLink to="/" className="drawer-item" onClick={onClose}>
            <HomeOutlined />
            <span>Trang chủ</span>
          </NavLink>
          <NavLink to="/elearning" className="drawer-item" onClick={onClose}>
            <ReadOutlined />
            <span>Bài học</span>
          </NavLink>
          <NavLink to="/blog" className="drawer-item" onClick={onClose}>
            <BookOutlined />
            <span>Bài viết</span>
          </NavLink>
          <NavLink to="/forum" className="drawer-item" onClick={onClose}>
            <MessageOutlined />
            <span>Diễn Đàn</span>
          </NavLink>
          <Divider style={{ margin: 0 }} />
          <NavLink to="/profile" className="drawer-link" onClick={onClose}>
            Hồ sơ của tôi
          </NavLink>
          <NavLink to="/courses" className="drawer-link" onClick={onClose}>
            Khóa học của tôi
          </NavLink>
        </div>
        <div className="mobile-drawer-footer">
          <div className="drawer-profile">
            <Avatar size={48} src={displayAvatar} icon={<UserOutlined />} />
            <div className="drawer-profile-text">
              <div className="name">{displayName}</div>
              <div className="email">{displayEmail}</div>
            </div>
            <button
              className="logout-btn"
              aria-label="Logout"
              onClick={handleLogout}
            >
              <LogoutOutlined />
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default MobileDrawer;
