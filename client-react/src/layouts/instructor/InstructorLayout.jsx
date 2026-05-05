import { Layout, Drawer, Grid } from "antd";
import { useState } from "react";
import InstructorHeader from "../../components/instructor/InstructorHeader";
import InstructorSidebar from "../../components/instructor/InstructorSidebar";

const { Content } = Layout;
const { useBreakpoint } = Grid;

export default function InstructorLayout({ children }) {
  const screens = useBreakpoint();
  const isDesktop = screens.lg;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileMenuClick = () => {
    setMobileOpen(false);
  };

  const sidebarComponent = (
    <InstructorSidebar
      collapsed={collapsed}
      onCollapse={!isDesktop ? handleMobileMenuClick : setCollapsed}
    />
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {isDesktop && sidebarComponent}

      {!isDesktop && (
        <Drawer
          rootClassName="admin-drawer"
          placement="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width={256}
          bodyStyle={{ padding: 0 }}
          maskStyle={{ backdropFilter: "blur(2px)" }}
        >
          <InstructorSidebar
            collapsed={false}
            onCollapse={handleMobileMenuClick}
          />
        </Drawer>
      )}

      <Layout style={{ background: "#FAFAFC" }}>
        <InstructorHeader
          collapsed={collapsed}
          onToggleSidebar={() =>
            isDesktop ? setCollapsed((c) => !c) : setMobileOpen(true)
          }
        />

        <Content className="admin-content" style={{ background: "#FAFAFC" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
