import { MenuOutlined } from "@ant-design/icons";
import { Layout } from "antd";

const { Sider } = Layout;

const SideBar = () => {
  return (
    <Sider width={56} className="bg-white border-l border-gray-200">
      <div className="flex justify-center items-center h-full">
        <MenuOutlined style={{ fontSize: "24px", color: "#fa541c" }} />
      </div>
    </Sider>
  );
};

export default SideBar;
