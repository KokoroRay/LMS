import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  Space,
  Typography,
  Select,
  Button,
  Row,
  Col,
  Empty,
  Spin,
  Tag,
  Tooltip,
  Grid,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

const { Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

// =========================
// DAY COLORS
// =========================
const DAY_COLORS = {
  Monday: "#3b82f6",
  Tuesday: "#06b6d4",
  Wednesday: "#22c55e",
  Thursday: "#f59e0b",
  Friday: "#a855f7",
  Saturday: "#ec4899",
  Sunday: "#ef4444",
};

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// =========================
// STATUS COLORS
// =========================
const STATUS_COLORS = {
  PRESENT: { border: "#16a34a", bg: "#f0fdf4", text: "#166534" },
  ABSENT: { border: "#dc2626", bg: "#fef2f2", text: "#991b1b" },
  PENDING: { border: "#94a3b8", bg: "#f8fafc", text: "#475569" },
};

// =========================
// SLOT CALC
// =========================
const getSlotNumber = (hour) => {
  if (hour >= 7 && hour < 9) return 1;
  if (hour >= 9 && hour < 11) return 2;
  if (hour >= 11 && hour < 13) return 3;
  if (hour >= 13 && hour < 15) return 4;
  if (hour >= 15 && hour < 17) return 5;
  if (hour >= 17 && hour < 19) return 6;
  if (hour >= 19 && hour < 21) return 7;
  return 8;
};

export default function Timetable({ rows, loading, summary }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    dayjs().year(currentYear).startOf("isoWeek")
  );

  useEffect(() => {
    setCurrentWeekStart(dayjs().year(currentYear).startOf("isoWeek"));
  }, [currentYear]);

  // =========================
  // WEEK DAYS
  // =========================
  const weekDays = useMemo(() => {
    return [...Array(7)].map((_, i) => currentWeekStart.add(i, "day"));
  }, [currentWeekStart]);

  // =========================
  // CALENDAR DATA
  // =========================
  const calendarData = useMemo(() => {
    const data = {};
    for (let i = 1; i <= 8; i++) {
      data[i] = {};
      weekDays.forEach((d) => (data[i][d.format("YYYY-MM-DD")] = []));
    }

    rows.forEach((slot) => {
      const key = dayjs(slot.date).format("YYYY-MM-DD");
      const hour = dayjs(slot.startTime, "HH:mm:ss").hour();
      const slotNum = getSlotNumber(hour);

      if (data[slotNum] && data[slotNum][key]) {
        data[slotNum][key].push(slot);
      }
    });

    return data;
  }, [rows, weekDays]);

  // =========================
  // SLOT CARD (Student)
  // =========================
  const renderSlotCard = (slot) => {
    const dayName = dayjs(slot.date).format("dddd");
    const dayColor = DAY_COLORS[dayName] || "#3b82f6";

    const statusColor =
      STATUS_COLORS[slot.attendanceStatus] || STATUS_COLORS.PENDING;

    return (
      <div
        key={slot.timetableId}
        style={{
          borderLeft: `3px solid ${dayColor}`,
          background: "#ffffff",
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Text strong style={{ fontSize: 14, color: "#334155" }}>
            {slot.courseTitle}
          </Text>

          <Text type="secondary" style={{ fontSize: 12 }}>
            <UserOutlined style={{ marginRight: 6 }} />
            {slot.teacherName}
          </Text>

          <Space size={6} wrap>
            <Tag
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 6,
                fontWeight: 600,
                border: `1px solid ${statusColor.border}`,
                background: statusColor.bg,
                color: statusColor.text,
              }}
            >
              {slot.attendanceStatus}
            </Tag>

            {slot.meetUrl && (
              <a href={slot.meetUrl} target="_blank" rel="noreferrer">
                <Tag
                  color="blue"
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <LinkOutlined style={{ marginRight: 4 }} />
                  Meet
                </Tag>
              </a>
            )}
          </Space>

          <Text style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>
            {dayjs(slot.startTime, "HH:mm:ss").format("HH:mm")} -{" "}
            {dayjs(slot.endTime, "HH:mm:ss").format("HH:mm")}
          </Text>

          {slot.attendanceNote && (
            <Tooltip title={slot.attendanceNote}>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {slot.attendanceNote}
              </Text>
            </Tooltip>
          )}
        </Space>
      </div>
    );
  };

  return (
    <div style={{ width: "100%" }}>
      {/* WEEK HEADER */}
      <Card size="small" style={{ marginBottom: 16, background: "#fafafa" }}>
        <Row justify="space-between" align="middle" gutter={[8, 8]}>
          <Col xs={24} sm={24} md={8}>
            <Space wrap>
              <Button
                icon={<LeftOutlined />}
                size="small"
                onClick={() =>
                  setCurrentWeekStart((p) => p.subtract(1, "week"))
                }
              >
                <span className="mobile-hide-text">Tuần trước</span>
                <span className="desktop-hide-text">Trước</span>
              </Button>

              <Button
                size="small"
                onClick={() =>
                  setCurrentWeekStart(
                    dayjs().year(currentYear).startOf("isoWeek")
                  )
                }
              >
                Hôm nay
              </Button>

              <Button
                icon={<RightOutlined />}
                size="small"
                onClick={() => setCurrentWeekStart((p) => p.add(1, "week"))}
              >
                <span className="mobile-hide-text">Tuần sau</span>
                <span className="desktop-hide-text">Sau</span>
              </Button>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text strong style={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              Tuần: {currentWeekStart.format("DD/MM")} -{" "}
              {currentWeekStart.add(6, "day").format("DD/MM/YYYY")}
            </Text>
          </Col>

          <Col xs={24} sm={12} md={8} style={{ textAlign: isMobile ? "left" : "right" }}>
            <Select
              size="small"
              value={currentYear}
              style={{ width: isMobile ? 80 : 100 }}
              onChange={setCurrentYear}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <Option key={y} value={y}>
                  Năm {y}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* TABLE */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid #e8e8e8",
          borderRadius: 8,
          background: "white",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Spin spinning={loading}>
          {rows.length === 0 ? (
            <Empty description="Không có lịch học" style={{ padding: isMobile ? 20 : 40 }} />
          ) : (
            <table
              style={{
                width: "100%",
                minWidth: isMobile ? 800 : 1000,
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th
                    style={{
                      width: 80,
                      padding: 10,
                      border: "1px solid #e8e8e8",
                      background: "#fafafa",
                    }}
                  >
                    Slot
                  </th>

                  {weekDays.map((d, idx) => (
                    <th
                      key={d}
                      style={{
                        padding: 10,
                        border: "1px solid #e8e8e8",
                        background: d.isSame(dayjs(), "day")
                          ? "#e6f7ff"
                          : "#fafafa",
                      }}
                    >
                      <div style={{ color: DAY_COLORS[DAY_OPTIONS[idx]] }}>
                        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][idx]}
                      </div>
                      <div style={{ fontSize: 12 }}>{d.format("DD/MM")}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((slotNum) => (
                  <tr key={slotNum}>
                    <td
                      style={{
                        padding: 8,
                        border: "1px solid #e8e8e8",
                        background: "#fafafa",
                        fontWeight: 500,
                      }}
                    >
                      Slot {slotNum}
                    </td>

                    {weekDays.map((d) => {
                      const key = d.format("YYYY-MM-DD");
                      return (
                        <td
                          key={key}
                          style={{
                            padding: 6,
                            border: "1px solid #e8e8e8",
                            verticalAlign: "top",
                            background: d.isSame(dayjs(), "day")
                              ? "#f0f9ff"
                              : "white",
                            minHeight: 130,
                            overflow: "hidden",
                          }}
                        >
                          <Space direction="vertical" style={{ width: "100%" }}>
                            {calendarData[slotNum][key].map(renderSlotCard)}
                          </Space>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Spin>
      </div>
    </div>
  );
}
