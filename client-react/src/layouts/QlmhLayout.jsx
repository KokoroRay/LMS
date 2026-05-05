import { useState } from "react";
import PropTypes from "prop-types";
import { Layout, Button, Drawer, Row, Space, Typography, Grid } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { Outlet } from "react-router-dom";
import QlmhSider from "./QlmhSider";
import MobileDrawerContent from "./MobileDrawerContent";
import "../styles/sider.css";

const { Header, Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

function MobileHeader({ onOpenDrawer, title }) {
  return (
    <Header className="mobile-header">
      <Row align="middle" justify="space-between" style={{ width: "100%" }}>
        <Space size="middle" align="center">
          <img src="/images/QLMH/Logo.svg" style={{ height: 24 }} alt="Logo" />
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            {title}
          </Title>
        </Space>
        <Button type="text" icon={<MenuOutlined />} onClick={onOpenDrawer} />
      </Row>
    </Header>
  );
}

MobileHeader.propTypes = {
  onOpenDrawer: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default function QlmhLayout({ activeKey, title }) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint is 768px

  return (
    <Layout style={{ minHeight: "100vh", background: "#f7f7f8" }}>
      {/* Desktop Sidebar - chỉ hiển thị trên desktop */}
      {!isMobile && <QlmhSider activeKey={activeKey} />}

      {/* Mobile Drawer */}
      <Drawer
        placement="right"
        width={320}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        <MobileDrawerContent
          activeKey={activeKey}
          onClose={() => setDrawerVisible(false)}
        />
      </Drawer>

      <Layout style={{ height: "100vh", overflow: "hidden" }}>
        {/* Mobile Header - chỉ hiển thị trên mobile */}
        {isMobile && (
          <MobileHeader
            title={title}
            onOpenDrawer={() => setDrawerVisible(true)}
          />
        )}

        <Content
          style={{
            overflowY: "auto",
            padding: 0,
            margin: 0,
            height: "100%",
            width: "100%",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

QlmhLayout.propTypes = {
  activeKey: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};
