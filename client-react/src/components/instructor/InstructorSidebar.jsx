import { useMemo, useState } from "react";
import { Layout, Menu, Typography, Grid } from "antd";
import {
  AppstoreOutlined,
  SettingOutlined,
  TeamOutlined,
  BookOutlined,
  ReadOutlined,
  ScheduleOutlined,
  SnippetsOutlined,
  CheckSquareOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  MessageOutlined,
  NotificationOutlined,
  FormOutlined,
  CommentOutlined,
  FileSearchOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
  TeamOutlined as LeaveOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function InstructorSidebar({ collapsed, onCollapse }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const basePath = "/instructor";

  const selectedKey = useMemo(() => {
    const relativePath = pathname.startsWith(basePath)
      ? pathname.substring(basePath.length)
      : "";
    const firstPart = relativePath.replace(/^\//, "").split("/")[0];
    if (!firstPart || firstPart === "") return "overview";
    if (firstPart === "don-xin-nghi") return "don-xin-nghi";
    if (firstPart === "submissions" && relativePath.split("/").length > 1) {
      return "submissions";
    }
    return firstPart;
  }, [pathname, basePath]);

  const items = [
    { key: "overview", icon: <AppstoreOutlined />, label: "Tổng Quan" },
    {
      key: "teaching",
      icon: <BookOutlined />,
      label: "Quản Lý Môn Học",
      children: [
        {
          key: "courses-list",
          icon: <ReadOutlined />,
          label: "Quản lý Môn học",
        },
        {
          key: "courses-manage",
          icon: <ReadOutlined />,
          label: "Quản lý Môn học Chi tiết",
        },
        {
          key: "my-timetable",
          icon: <CalendarOutlined />,
          label: "Điểm Danh & Thời Khóa Biểu",
        },
        {
          key: "don-xin-nghi",
          icon: <LeaveOutlined />,
          label: "Quản Lý Đơn Xin Nghỉ",
        },
      ],
    },
    {
      key: "assessment",
      icon: <CheckSquareOutlined />,
      label: "Quản Lý Bài Kiểm Tra",
      children: [
        {
          key: "submissions",
          icon: <FileSearchOutlined />,
          label: "Chấm bài kiểm tra",
        },
        {
          key: "grade",
          icon: <CheckSquareOutlined />,
          label: "Chấm bài tập",
        },

        { key: "exams", icon: <ExperimentOutlined />, label: "Bài kiểm tra" },
      ],
    },
    {
      key: "community",
      icon: <CommentOutlined />,
      label: "Community",
      children: [
        { key: "forum-posts", icon: <CommentOutlined />, label: "Diễn đàng" },
        { key: "my-articles", icon: <FormOutlined />, label: "Bài viết" },
      ],
    },
  ];

  const [openKeys, setOpenKeys] = useState(() => {
    const key = selectedKey;
    if (key === "overview") return [];
    const parent = items.find((item) =>
      item.children?.some((child) => child.key === key)
    );
    return parent ? [parent.key] : [];
  });

  const onMenuClick = ({ key }) => {
    console.log(`🎯 [SIDEBAR] Menu clicked: ${key}`);
    if (key === "overview") {
      console.log(`🎯 [SIDEBAR] Navigating to: ${basePath}`);
      navigate(basePath);
    } else {
      console.log(`🎯 [SIDEBAR] Navigating to: ${basePath}/${key}`);
      navigate(`${basePath}/${key}`);
    }
    if (!screens.lg) {
      onCollapse?.();
    }
  };

  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((k) => !openKeys.includes(k));
    const rootSubmenuKeys = items
      .filter((item) => item.children)
      .map((item) => item.key);

    if (latestOpenKey && rootSubmenuKeys.includes(latestOpenKey)) {
      setOpenKeys([latestOpenKey]);
    } else {
      setOpenKeys(keys);
    }
  };

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
      className="instructor-sidebar"
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

      <Menu
        mode="inline"
        onClick={onMenuClick}
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        items={items}
        style={{ borderRight: 0, paddingTop: 8 }}
      />
    </Sider>
  );
}
