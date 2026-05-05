import { Avatar, Divider, message } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
  ReadOutlined, // Đã sửa: Xóa alias "as ReadBookOutlined"
} from "@ant-design/icons";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/api/slices/authSlice";

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy thông tin user đang đăng nhập từ Redux store
  const user = useSelector((state) => state.auth.user);

  // Sử dụng thông tin từ `user` của Redux để hiển thị
  // Cung cấp giá trị mặc định phòng trường hợp `user` chưa kịp tải
  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || "Người dùng";
  const displayEmail = user?.email || "email@example.com";
  // API của bạn trả về `avatarUrl`, nên ta dùng key này
  const displayAvatar =
    user?.avatarUrl ||
    "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=256&auto=format&fit=crop";

  const handleLogout = (e) => {
    e.preventDefault();
    try {
      // Gọi action `logout` từ Redux để xóa state và token
      dispatch(logout());
      message.success("Đã đăng xuất thành công");
      // Điều hướng về trang login
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
      // Ngay cả khi có lỗi, vẫn cố gắng dọn dẹp state và điều hướng
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  return (
    <div style={{ width: 300 }}>
      {/* Thông tin người dùng */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}
      >
        <div style={{ position: "relative" }}>
          <Avatar size={56} src={displayAvatar} icon={<UserOutlined />} />
          <span
            style={{
              position: "absolute",
              right: 2,
              bottom: 2,
              width: 12,
              height: 12,
              background: "#18c964",
              border: "2px solid #fff",
              borderRadius: "50%",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
            {displayName}
          </div>
          <div style={{ color: "#8c8c8c", fontSize: 14 }}>{displayEmail}</div>
        </div>
      </div>

      <Divider style={{ margin: 0 }} />

      {/* Danh sách liên kết */}
      <div
        style={{
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          className="dropdown-row-item"
          onClick={() => navigate('/profile')}
        >
          <ProfileOutlined style={{ fontSize: 16, marginRight: 10 }} />
          <span>Hồ sơ của tôi</span>
        </div>

        <div
          className="dropdown-row-item"
          onClick={() => navigate('/message')}
        >
          <ProfileOutlined style={{ fontSize: 16, marginRight: 10 }} />
          <span>Tin nhắn</span>
        </div>

        <div
          className="dropdown-row-item"
          onClick={() => navigate('/courses')}
        >
          <ReadOutlined style={{ fontSize: 16, marginRight: 10 }} />
          <span>Khóa học của tôi</span>
        </div>
      </div>

      <Divider style={{ margin: 0 }} />

      {/* Đăng xuất */}
      <a
        href="/login"
        onClick={handleLogout}
        className="dropdown-row"
        style={{
          padding: 12,
          display: "flex",
          alignItems: "center",
          color: "#b42318",
          fontWeight: 700,
          fontSize: 16,
          cursor: "pointer",
          textDecoration: "none",
        }}
      >
        <LogoutOutlined style={{ marginRight: 10 }} /> Đăng xuất
      </a>
    </div>
  );
};

export default ProfileDropdown;
