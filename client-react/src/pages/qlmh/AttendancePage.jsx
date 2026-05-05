import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Typography, Space, Card, Button, Spin, Tag } from "antd";
import {
  ReloadOutlined,
  CarryOutOutlined,
  MinusCircleOutlined,
  PercentageOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import Timetable from "../../components/timetable/Timetable";
import dayjs from "dayjs";

import { getStudentTimetableWithAttendance } from "../../services/timetableService";
import { fetchMyAttendanceSummary } from "../../services/attendanceService";

const { Title } = Typography;

export default function AttendancePage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const overallSummary = useMemo(() => {
    if (!summary || summary.length === 0)
      return {
        totalSessions: 0,
        totalAttended: 0,
        totalAbsent: 0,
        absentRate: 0,
      };

    const totalSessions = summary.reduce(
      (s, x) => s + (x.totalSessions || 0),
      0
    );
    const totalAttended = summary.reduce(
      (s, x) => s + (x.attendedSessions || 0),
      0
    );
    const totalAbsent = summary.reduce(
      (s, x) => s + (x.absentSessions || 0),
      0
    );

    return {
      totalSessions,
      totalAttended,
      totalAbsent,
      absentRate: totalSessions
        ? ((totalAbsent / totalSessions) * 100).toFixed(0)
        : 0,
    };
  }, [summary]);

  const loadStudentSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const list = await fetchMyAttendanceSummary();
      setSummary(list);
    } catch {
      setSummary([]);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadStudentTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudentTimetableWithAttendance();
      const normalized = (data || []).map((slot) => ({
        ...slot,
        date: slot.date ? dayjs(slot.date).format("YYYY-MM-DD") : null,
        attendanceStatus: slot.attendanceStatus || "PENDING",
        attendanceNote: slot.attendanceNote || "",
        startDateTime:
          slot.startDateTime ||
          dayjs(`${slot.date} ${slot.startTime}`).toISOString(),
        endDateTime:
          slot.endDateTime ||
          dayjs(`${slot.date} ${slot.endTime}`).toISOString(),
      }));

      setRows(normalized);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudentTimetable();
    loadStudentSummary();
  }, [loadStudentTimetable, loadStudentSummary, refreshKey]);

  const ControlsHeader = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        padding: "16px 24px",
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.02)",
        flexWrap: "wrap",
        gap: 12,
      }}
      className="responsive-header-box"
    >
      {/* LEFT */}
      <Space align="center">
        <Title
          level={4}
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            fontSize: "1.25rem",
            flexShrink: 0,
          }}
        >
          <ScheduleOutlined
            style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
          />
          <span className="mobile-hide-text">Thời khóa biểu</span>
          <span className="desktop-hide-text">TKB</span>
        </Title>
      </Space>

      {/* RIGHT (SUMMARY + REFRESH) */}
      <Space size="large" wrap>
        <Space wrap>
          <Tag
            icon={<CarryOutOutlined />}
            color="success"
            style={{ padding: "4px 10px", fontSize: 14 }}
          >
            Đi học: {overallSummary.totalAttended}
          </Tag>

          <Tag
            icon={<MinusCircleOutlined />}
            color="error"
            style={{ padding: "4px 10px", fontSize: 14 }}
          >
            Nghỉ: {overallSummary.totalAbsent}
          </Tag>

          <Tag
            icon={<PercentageOutlined />}
            color="processing"
            style={{ padding: "4px 10px", fontSize: 14 }}
          >
            Tỉ lệ nghỉ: {overallSummary.absentRate}%
          </Tag>
        </Space>

        <Button
          icon={<ReloadOutlined />}
          loading={loading || loadingSummary}
          onClick={() => setRefreshKey((p) => p + 1)}
          size="small"
          className="mobile-button"
        >
          <span className="mobile-hide-text">Làm mới</span>
          <span className="desktop-hide-text">Tải lại</span>
        </Button>
      </Space>
    </div>
  );

  return (
    <div className="main-content" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {ControlsHeader}

      <Card
        bordered={false}
        style={{ borderRadius: 8 }}
        bodyStyle={{ padding: 12 }}
      >
        <Timetable rows={rows} loading={loading} summary={overallSummary} />
      </Card>
    </div>
  );
}
