import { MenuOutlined } from "@ant-design/icons";

const MobileHamburger = ({ onClick, className = "" }) => {
  return (
    <button
      className={`hamburger-btn ${className}`}
      aria-label="Open menu"
      onClick={onClick}
    >
      <MenuOutlined />
    </button>
  );
};

export default MobileHamburger;
