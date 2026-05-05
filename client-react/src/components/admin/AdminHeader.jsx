import {
  Layout,
  Row,
  Col,
  Button,
  Space,
  Avatar,
  Badge,
  Dropdown,
  Typography,
  Breadcrumb,
  Grid,
  message,
} from "antd";
import {
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  HomeOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/api/slices/authSlice";

const { Header } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

function buildCrumbs(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const items = [];
  let acc = "";
  parts.forEach((p, i) => {
    acc += `/${p}`;
    const last = i === parts.length - 1;
    items.push({
      title: last ? (
        <Text strong style={{ textTransform: "capitalize" }}>
          {p}
        </Text>
      ) : (
        <Link to={acc}>{p}</Link>
      ),
    });
  });
  return items.length ? items : [{ title: <Text strong>admin</Text> }];
}

export default function AdminHeader({ collapsed, onToggleSidebar }) {
  const { pathname } = useLocation();
  const screens = useBreakpoint();
  const isDesktop = screens.lg;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    message.success("Đăng xuất thành công!");
    navigate("/login", { replace: true });
  };

  const menu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        danger: true,
        label: "Log out",
      },
    ],
    onClick: ({ key }) => {
      if (key === "logout") {
        handleLogout();
      }
    },
  };

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username ||
        (user?.username === "admin" ? "System Admin" : "Admin");
  const displayRole = user?.role?.description || "Administrator";

  return (
    <Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 64,
        padding: 0,
        background: "rgba(255,255,255,.9)",
        backdropFilter: "saturate(180%) blur(8px)",
        borderBottom: "1px solid #F0F2F5",
      }}
    >
      <div
        style={{
          width: "100%",
          margin: "0 auto",
          padding: screens.xs ? "0 12px" : "0 24px",
          height: 64,
        }}
      >
        <Row
          align="middle"
          wrap={false}
          gutter={screens.xs ? 8 : 16}
          style={{ height: "100%" }}
        >
          <Col
            flex="1 1 auto"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <Button
              type="text"
              aria-label="Toggle menu"
              icon={
                isDesktop ? (
                  collapsed ? (
                    <MenuUnfoldOutlined />
                  ) : (
                    <MenuFoldOutlined />
                  )
                ) : (
                  <MenuOutlined />
                )
              }
              onClick={onToggleSidebar}
              style={{
                width: 40,
                height: 40,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
              }}
            />

            {screens.sm && (
              <Space size={8} style={{ marginLeft: 6 }}>
                <HomeOutlined style={{ color: "#8c8c8c" }} />
                <Breadcrumb items={buildCrumbs(pathname)} />
              </Space>
            )}
          </Col>

          <Col
            flex="none"
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Space size="middle" align="center">
              <Badge count={3} size="small" offset={[0, 2]}>
                <Button type="text" size="large" icon={<BellOutlined />} />
              </Badge>
              <Dropdown
                menu={menu}
                trigger={["click"]}
                placement="bottomRight"
                arrow
              >
                <Space style={{ cursor: "pointer" }}>
                  <Avatar
                    size={36}
                    src={user?.avatarUrl || "https://i.pravatar.cc/100?img=12"}
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
            </Space>
          </Col>
        </Row>
      </div>
    </Header>
  );
}
