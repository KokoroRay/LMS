import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Button,
  Space,
  Modal,
  Table,
  Input,
  Select,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Tooltip,
  Avatar,
} from "antd";
import {
  CalendarOutlined,
  ReloadOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

import {
  getInstructorTimetable,
  getTimetableByClass,
  fetchInstructorClassesAPI,
} from "../../../services/timetableService";
import {
  fetchAttendanceListAPI,
  saveAttendanceAPI,
} from "../../../services/attendanceService";

dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const { Option } = Select;

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAY_COLORS = {
  Monday: "blue",
  Tuesday: "cyan",
  Wednesday: "green",
  Thursday: "orange",
  Friday: "purple",
  Saturday: "magenta",
  Sunday: "red",
};

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

const getAttendanceColumns = (handleAttendanceChange, handleNoteChange) => [
  {
    title: "Mã SV",
    dataIndex: "studentId",
    key: "studentId",
    width: 100,
    render: (id) => <Text strong>{`SV#${id}`}</Text>,
  },
  {
    title: "Tên sinh viên",
    dataIndex: "studentName",
    key: "studentName",
    ellipsis: true,
    render: (name, record) => (
      <Space>
        <Avatar icon={<UserOutlined />} size="small" />
        {name}
      </Space>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (text, record) => (
      <Select
        value={text}
        style={{ width: "100%" }}
        onChange={(value) => handleAttendanceChange(record.key, value)}
      >
        <Option value="PRESENT" style={{ color: "green" }}>
          Có mặt
        </Option>
        <Option value="ABSENT" style={{ color: "red" }}>
          Vắng
        </Option>
        <Option value="PENDING" style={{ color: "gray" }}>
          Chưa điểm danh
        </Option>
      </Select>
    ),
  },
  {
    title: "Ghi chú",
    dataIndex: "note",
    key: "note",
    render: (text, record) => (
      <Input
        defaultValue={text}
        onChange={(e) => handleNoteChange(record.key, e.target.value)}
        placeholder="Lý do vắng mặt..."
        size="small"
      />
    ),
  },
];

function AttendanceModal({
  isModalVisible,
  handleCancel,
  session,
  attendanceData,
  originalData,
  handleAttendanceChange,
  handleNoteChange,
  handleSaveAttendance,
  loadingAttendance,
}) {
  const columns = getAttendanceColumns(
    handleAttendanceChange,
    handleNoteChange
  );

  const hasChanges = useMemo(
    () => JSON.stringify(attendanceData) !== JSON.stringify(originalData),
    [attendanceData, originalData]
  );

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Điểm danh: {session.courseTitle || "..."} | Ngày:{" "}
          {session.date || "..."}
        </Title>
      }
      open={isModalVisible}
      onCancel={handleCancel}
      width={900}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Đóng
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loadingAttendance}
          onClick={handleSaveAttendance}
          disabled={!hasChanges}
        >
          Lưu Điểm Danh
        </Button>,
      ]}
    >
      <Table
        dataSource={attendanceData}
        loading={loadingAttendance}
        pagination={{ pageSize: 10 }}
        size="middle"
        rowKey="studentId"
        columns={columns}
        scroll={{ y: 400 }}
      />
    </Modal>
  );
}

export default function InstructorTimetablePage() {
  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    dayjs().startOf("isoWeek")
  );

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAttendanceData, setCurrentAttendanceData] = useState([]);
  const [originalAttendanceData, setOriginalAttendanceData] = useState([]);
  const [currentSession, setCurrentSession] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingClasses(true);
      try {
        const list = await fetchInstructorClassesAPI();
        const validatedList = Array.isArray(list) ? list : [];
        setClasses(validatedList);
        setActiveClassId(0);
      } catch (e) {
        const errorMessage =
          e.response?.data?.message ||
          e.message ||
          "Không tải được danh sách lớp.";
        message.error(errorMessage);
      } finally {
        setLoadingClasses(false);
      }
    })();
  }, []);

  const loadTimetable = useCallback(async (classId) => {
    const numericClassId = Number(classId);
    setLoading(true);
    try {
      let data;
      if (numericClassId && numericClassId !== 0) {
        data = await getTimetableByClass(numericClassId);
      } else {
        data = await getInstructorTimetable();
      }

      const normalizedSlots = (data || []).map((slot) => ({
        ...slot,
        date: dayjs(slot.date).format("YYYY-MM-DD"),
        // Vấn đề 2: Đảm bảo sử dụng startDateTime/endDateTime từ BE
        startDateTime:
          slot.startDateTime ||
          dayjs(`${slot.date} ${slot.startTime}`).toISOString(),
        endDateTime:
          slot.endDateTime ||
          dayjs(`${slot.date} ${slot.endTime}`).toISOString(),
      }));

      setRows(normalizedSlots);
    } catch (e) {
      const errorMessage =
        e.response?.data?.message ||
        e.message ||
        "Không tải được thời khoá biểu.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimetable(activeClassId);
  }, [activeClassId, loadTimetable, refreshKey]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.classId === activeClassId),
    [classes, activeClassId]
  );

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(currentWeekStart.add(i, "day"));
    }
    return days;
  }, [currentWeekStart]);

  const calendarData = useMemo(() => {
    const data = {};
    const MAX_SLOTS = 8;

    for (let slotNum = 1; slotNum <= MAX_SLOTS; slotNum++) {
      data[slotNum] = {};
      weekDays.forEach((day) => {
        const dayKey = day.format("YYYY-MM-DD");
        data[slotNum][dayKey] = [];
      });
    }

    rows.forEach((row) => {
      if (!row.startDateTime) return;

      const start = dayjs(row.startDateTime);
      const dayKey = start.format("YYYY-MM-DD");
      const hour = start.hour();

      let slotNum = getSlotNumber(hour);

      if (data[slotNum] && data[slotNum][dayKey]) {
        data[slotNum][dayKey].push(row);
      }
    });

    return data;
  }, [rows, weekDays]);

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => prev.subtract(1, "week"));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => prev.add(1, "week"));
  };

  const goToToday = () => {
    setCurrentWeekStart(dayjs().startOf("isoWeek"));
  };

  const handleOpenAttendance = useCallback(async (slot) => {
    setLoadingAttendance(true);
    setCurrentSession({
      timetableId: slot.timetableId,
      courseTitle: slot.courseTitle,
      date: dayjs(slot.startDateTime).format("DD/MM/YYYY"),
      sessionId: slot.sessions?.[0]?.sessionId,
    });

    try {
      const data = await fetchAttendanceListAPI(slot.timetableId);
      const dataWithKeys = data.map((record) => ({
        ...record,
        key: record.studentId.toString(),
        note: record.note || "",
      }));

      setCurrentAttendanceData(dataWithKeys);
      setOriginalAttendanceData(dataWithKeys);
      setIsModalVisible(true);
    } catch (e) {
      const errorMessage =
        e.response?.data?.message ||
        e.message ||
        "Không tải được danh sách điểm danh.";
      message.error(errorMessage);
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const handleAttendanceChange = useCallback((key, value) => {
    setCurrentAttendanceData((prev) =>
      prev.map((item) => (item.key === key ? { ...item, status: value } : item))
    );
  }, []);

  const handleNoteChange = useCallback((key, value) => {
    setCurrentAttendanceData((prev) =>
      prev.map((item) => (item.key === key ? { ...item, note: value } : item))
    );
  }, []);

  const handleSaveAttendance = useCallback(async () => {
    setLoadingAttendance(true);
    try {
      const recordsToSave = currentAttendanceData.map((record) => ({
        studentId: record.studentId,
        status: record.status,
        note: record.note,
      }));

      const saveDTO = {
        timetableId: currentSession.timetableId, // ✔ ĐÚNG BE
        records: recordsToSave, // ✔ KHÔNG CÒN sessionId
      };

      await saveAttendanceAPI(saveDTO);

      message.success(
        `Đã lưu điểm danh thành công cho buổi học ${currentSession.courseTitle}!`
      );

      setIsModalVisible(false);
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      const errorMessage =
        e.response?.data?.message || e.message || "Lưu điểm danh thất bại";
      message.error(errorMessage);
    } finally {
      setLoadingAttendance(false);
    }
  }, [currentSession, currentAttendanceData]);

  return (
    <div style={{ padding: 24, minHeight: "100vh" }}>
      <Card
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 24 }}
        >
          <Col>
            <Space align="center" size={12}>
              <CalendarOutlined style={{ fontSize: 24, color: "#fa8c16" }} />
              <Title level={3} style={{ margin: 0 }}>
                Thời khoá biểu
              </Title>
            </Space>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setRefreshKey((prev) => prev + 1)}
              loading={loading || loadingClasses}
            >
              Làm mới
            </Button>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <Row style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Text strong>Bộ lọc lớp học:</Text>
              <Select
                showSearch
                placeholder="Chọn lớp học hoặc xem tất cả"
                style={{ width: "100%" }}
                value={activeClassId}
                onChange={setActiveClassId}
                optionFilterProp="label"
                loading={loadingClasses}
                size="large"
              >
                <Option key="all" value={0} label="Tất cả các lớp">
                  <Text strong>Tất cả các lớp</Text>
                </Option>
                {classes.map((c) => (
                  <Option key={c.classId} value={c.classId} label={c.className}>
                    <Text strong>{c.className}</Text>
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>

        {activeClassId !== 0 && selectedClass && (
          <Card
            size="small"
            style={{
              marginBottom: 16,
              background: "linear-gradient(135deg, #fa8c16 0%, #ffc53d 100%)",
              border: "none",
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: 600 }}>
              Lớp đang xem: {selectedClass.className}
            </Text>
          </Card>
        )}

        <Card size="small" style={{ marginBottom: 16, background: "#fafafa" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="small">
                <Button
                  icon={<LeftOutlined />}
                  onClick={goToPreviousWeek}
                  size="small"
                >
                  Tuần trước
                </Button>
                <Button onClick={goToToday} size="small">
                  Hôm nay
                </Button>
                <Button
                  icon={<RightOutlined />}
                  iconPosition="end"
                  onClick={goToNextWeek}
                  size="small"
                >
                  Tuần sau
                </Button>
              </Space>
            </Col>
            <Col>
              <Text strong style={{ fontSize: 16 }}>
                Tuần: {currentWeekStart.format("DD/MM")} -{" "}
                {currentWeekStart.add(6, "day").format("DD/MM/YYYY")}
              </Text>
            </Col>
            <Col>
              <Select
                value={currentWeekStart.year()}
                onChange={(year) => {
                  setCurrentWeekStart(dayjs().year(year).startOf("isoWeek"));
                }}
                style={{ width: 100 }}
                size="small"
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => dayjs().year() - 2 + i
                ).map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e8e8e8",
            borderRadius: 8,
            background: "white",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 1000,
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th
                  style={{
                    padding: "12px 8px",
                    border: "1px solid #e8e8e8",
                    width: 80,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Slot
                </th>
                {weekDays.map((day, idx) => {
                  const dayName = [
                    "MON",
                    "TUE",
                    "WED",
                    "THU",
                    "FRI",
                    "SAT",
                    "SUN",
                  ][idx];
                  const isToday = day.isSame(dayjs(), "day");
                  return (
                    <th
                      key={day.format("YYYY-MM-DD")}
                      style={{
                        padding: "12px 8px",
                        border: "1px solid #e8e8e8",
                        background: isToday ? "#e6f7ff" : "#fafafa",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          color: DAY_COLORS[DAY_OPTIONS[idx]] || "#1890ff",
                        }}
                      >
                        {dayName}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: "normal",
                          color: "#666",
                        }}
                      >
                        {day.format("DD/MM")}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((slotNum) => (
                <tr key={slotNum}>
                  <td
                    style={{
                      padding: "8px",
                      border: "1px solid #e8e8e8",
                      textAlign: "center",
                      fontWeight: 500,
                      background: "#fafafa",
                    }}
                  >
                    Slot {slotNum}
                  </td>
                  {weekDays.map((day) => {
                    const dayKey = day.format("YYYY-MM-DD");
                    const slots = calendarData[slotNum]?.[dayKey] || [];
                    const isToday = day.isSame(dayjs(), "day");

                    return (
                      <td
                        key={dayKey}
                        style={{
                          padding: 4,
                          border: "1px solid #e8e8e8",
                          verticalAlign: "top",
                          background: isToday ? "#f0f9ff" : "white",
                          minHeight: 80,
                          cursor: "default",
                          transition: "background 0.2s",
                        }}
                      >
                        {slots.length === 0 ? (
                          <div
                            style={{
                              textAlign: "center",
                              color: "#ccc",
                              padding: 20,
                              fontSize: 20,
                            }}
                          ></div>
                        ) : (
                          <Space
                            direction="vertical"
                            size={4}
                            style={{ width: "100%" }}
                          >
                            {slots.map((slot) => {
                              const sessionStart = dayjs(slot.startDateTime);
                              const isFutureSession = sessionStart.isAfter(
                                dayjs()
                              );

                              return (
                                <Card
                                  key={slot.timetableId}
                                  size="small"
                                  style={{
                                    cursor: "default",
                                    borderLeft: `3px solid ${
                                      DAY_COLORS[slot.dayOfWeek || "Monday"]
                                    }`,
                                    background: "#fff9f0",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                    transition: "background 0.2s",
                                  }}
                                  bodyStyle={{ padding: "8px 12px" }}
                                >
                                  <Space
                                    direction="vertical"
                                    size={2}
                                    style={{ width: "100%" }}
                                  >
                                    <Text
                                      strong
                                      style={{ fontSize: 12, color: "#fa8c16" }}
                                    >
                                      {slot.courseTitle || "N/A"}
                                    </Text>
                                    <Text
                                      type="secondary"
                                      ellipsis
                                      style={{ fontSize: 11 }}
                                    >
                                      <UserOutlined
                                        style={{ marginRight: 4 }}
                                      />
                                      {slot.teacherName || "Chưa gán"}
                                    </Text>
                                    {slot.meetUrl && (
                                      <Tag
                                        color="blue"
                                        style={{
                                          fontSize: 11,
                                          padding: "0 4px",
                                        }}
                                      >
                                        <a
                                          href={slot.meetUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <LinkOutlined
                                            style={{ marginRight: 2 }}
                                          />{" "}
                                          Link
                                        </a>
                                      </Tag>
                                    )}
                                    <Text
                                      style={{ fontSize: 11, color: "#52c41a" }}
                                    >
                                      (
                                      {dayjs(slot.startDateTime).format(
                                        "HH:mm"
                                      )}{" "}
                                      -{" "}
                                      {dayjs(slot.endDateTime).format("HH:mm")})
                                    </Text>
                                    {slot.note && (
                                      <Tooltip title={slot.note}>
                                        <Text
                                          type="secondary"
                                          ellipsis
                                          style={{ fontSize: 11 }}
                                        >
                                          {slot.note}
                                        </Text>
                                      </Tooltip>
                                    )}

                                    <Divider style={{ margin: "4px 0" }} />
                                    <Tooltip
                                      title={
                                        isFutureSession
                                          ? "Buổi học chưa diễn ra"
                                          : "Điểm danh"
                                      }
                                    >
                                      <Button
                                        type="dashed"
                                        size="small"
                                        block
                                        onClick={() =>
                                          handleOpenAttendance(slot)
                                        }
                                        disabled={isFutureSession}
                                      >
                                        Điểm danh
                                      </Button>
                                    </Tooltip>
                                  </Space>
                                </Card>
                              );
                            })}
                          </Space>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Divider />

        <Card size="small" style={{ background: "#fafafa", marginTop: 16 }}>
          <Text strong>Chú thích:</Text>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
            <li>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Chọn lớp học từ bộ lọc để xem lịch chi tiết của lớp đó.
              </Text>
            </li>
            <li>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Lịch chỉ hiển thị các môn học mà bạn được phân công.
              </Text>
            </li>
          </ul>
        </Card>
      </Card>

      <AttendanceModal
        isModalVisible={isModalVisible}
        handleCancel={() => setIsModalVisible(false)}
        session={currentSession}
        attendanceData={currentAttendanceData}
        originalData={originalAttendanceData}
        handleAttendanceChange={handleAttendanceChange}
        handleNoteChange={handleNoteChange}
        handleSaveAttendance={handleSaveAttendance}
        loadingAttendance={loadingAttendance}
      />
    </div>
  );
}
