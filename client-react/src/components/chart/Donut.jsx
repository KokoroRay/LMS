import PropTypes from "prop-types";
import { Card, Row, Typography, Space, Progress, Grid } from "antd";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function Donut({ percent, color, trail, label, legend }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const size = isMobile ? 120 : 160;
  
  return (
    <Card variant="outlined" style={{ borderRadius: 16 }}>
      <Row align="middle" justify="space-between">
        <Title level={5} style={{ margin: 0, fontSize: isMobile ? "0.875rem" : "1rem" }}>
          {label}
        </Title>
      </Row>
      <div
        style={{ display: "grid", placeItems: "center", padding: "8px 0 4px" }}
      >
        <Progress
          type="circle"
          percent={percent}
          size={size}
          strokeColor={color}
          trailColor={trail}
          strokeWidth={isMobile ? 10 : 12}
          format={() => `${percent}%`}
        />
      </div>
      <Space size={10} wrap>
        {legend.map((it) => (
          <Space key={it.text} size={6}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: it.dot,
                display: "inline-block",
              }}
            />
            <Text type="secondary" style={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              {it.text}
            </Text>
          </Space>
        ))}
      </Space>
    </Card>
  );
}

Donut.propTypes = {
  percent: PropTypes.number,
  color: PropTypes.string,
  trail: PropTypes.string,
  label: PropTypes.string,
  legend: PropTypes.arrayOf(
    PropTypes.shape({ dot: PropTypes.string, text: PropTypes.string })
  ),
};

Donut.defaultProps = {
  percent: 0,
  color: "#1677ff",
  trail: "#f5f5f5",
  label: "",
  legend: [],
};
