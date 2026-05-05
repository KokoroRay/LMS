import { useMemo, useState } from "react";
import { Layout, Menu, Badge, Typography, Grid } from "antd";
import {
  AppstoreOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  ReadOutlined,
  ScheduleOutlined,
  MessageOutlined,
  NotificationOutlined,
  FormOutlined,
  CommentOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
  UserSwitchOutlined,
  WarningOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const { Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function AdminSidebar({ collapsed, onCollapse }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const { user } = useSelector((state) => state.auth);

  const selectedKey = useMemo(() => {
    if (pathname === "/admin" || pathname === "/admin/") {
      return "overview";
    }
    const rest = pathname.replace(/^\/admin\/?/, "");
    return rest.split("/")[0];
  }, [pathname]);

  const defaultOpenKeys = useMemo(() => {
    return [selectedKey];
  }, [selectedKey]);

  const [openKeys, setOpenKeys] = useState(defaultOpenKeys);

  const onMenuClick = ({ key }) => {
    if (key === "overview") {
      navigate("/admin");
    } else {
      navigate(`/admin/${key}`);
    }
    if (!screens.lg) {
      onCollapse(true);
    }
  };

  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    const rootSubmenuKeys = [
      "user-mgmt",
      "academy",
      "acction",
      "feadback-post",
      "communications",
      "billing",
    ];

    if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };

  const items = [
    { key: "overview", icon: <AppstoreOutlined />, label: "Tổng Quan" },
    {
      key: "user-mgmt",
      icon: <TeamOutlined />,
      label: "Quản Lý Người Dùng",
      children: [
        { key: "student", icon: <UserOutlined />, label: "Quản Lý Học Sinh" },

        {
          key: "instructors",
          icon: <UserSwitchOutlined />,
          label: "Quản Lý Giáo Viên",
        },
      ],
    },

    {
      key: "academy",
      icon: <BookOutlined />,
      label: "Quản Lý Môn Học",
      children: [
        {
          key: "admin-categories",
          icon: <FolderOpenOutlined />,
          label: "Khóa Học",
        },

        { key: "admin-courses", icon: <ReadOutlined />, label: "Môn Học" },

        { key: "classes", icon: <ScheduleOutlined />, label: "Lớp Học" },
      ],
    },
    {
      key: "acction",
      icon: <CheckSquareOutlined />,
      label: "Quản Lý Hoạt Động ",
      children: [
        {
          key: "admin-certificates",
          icon: <TrophyOutlined />,
          label: "Quản lý Chứng chỉ",
        },

        {
          key: "admin-timetable",
          icon: <CalendarOutlined />,
          label: "Thời Khóa Biểu",
        },

        {
          key: "admin-enrollments",
          icon: <TeamOutlined />,
          label: "Sự Tham Gia Lớp Học",
        },
      ],
    },
    {
      key: "feadback-post",
      icon: <CommentOutlined />,
      label: "Quản Lý Diễn Đàn",
      children: [
        {
          key: "admin-evaluation",
          icon: <MessageOutlined />,
          label: "Đánh Giá Khóa Học",
        },

        { key: "post", icon: <ReadOutlined />, label: "Bài Viết" },

        { key: "admin-reports", icon: <WarningOutlined />, label: "Báo Cáo" },
      ],
    },
    {
      key: "billing",
      icon: <CreditCardOutlined />,
      label: "Thanh Toán",
      children: [
        { key: "payments", icon: <CreditCardOutlined />, label: "Thanh Toán" },

      ],
    },
  ];

  return (
    <Sider
      width={256}
      collapsedWidth={screens.lg ? 64 : 0}
      collapsible={screens.lg}
      trigger={null}
      collapsed={collapsed}
      onCollapse={onCollapse}
      style={{
        background: "#fff",
        borderRight: "1px solid #f0f2f5",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 10,
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
          borderBottom: "1px solid #f0f2f5",
        }}
      >
        <img
          src="/images/LogoManKai.svg"
          alt="Mankai Logo"
          style={{
            height: 36,
            width: "auto",
            objectFit: "contain",
            opacity: collapsed ? 0 : 1,
            transition: "opacity 0.3s",
          }}
        />
      </div>

      <div
        style={{
          padding: collapsed ? "16px 12px" : 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Badge color="#F59E0B" />
        {!collapsed && (
          <Title level={4} style={{ margin: 0, whiteSpace: "nowrap" }}>
            Hello,{" "}
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.username || "Admin"}
          </Title>
        )}
      </div>
      <Menu
        mode="inline"
        onClick={onMenuClick}
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        items={items}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
}
