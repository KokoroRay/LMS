import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Tag,
  message,
  Typography,
  Popconfirm,
  Row,
  Col,
  Divider,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LinkOutlined,
  GlobalOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

import { fetchAllClassAPI } from "../../../services/classService";
import { getCoursesByCategoryId } from "../../../services/subjectService";
import {
  getAdminTimetableByClass,
  createTimetable,
  updateTimetable,
  deleteTimetable,
} from "../../../services/timetableService";

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

const slotTimeMap = {
  1: { start: "07:00:00", end: "09:00:00" },
  2: { start: "09:00:00", end: "11:00:00" },
  3: { start: "11:00:00", end: "13:00:00" },
  4: { start: "13:00:00", end: "15:00:00" },
  5: { start: "15:00:00", end: "17:00:00" },
  6: { start: "17:00:00", end: "19:00:00" },
  7: { start: "19:00:00", end: "21:00:00" },
  8: { start: "21:00:00", end: "23:00:00" },
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

const DOW_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const dayNameFromDayjs = (djs) =>
  dayjs.isDayjs(djs) ? DOW_FULL[djs.day()] : null;

const disabledDate = (current) => {
  return current && current.isBefore(dayjs().startOf("day"));
};

const disabledRangeTime = (time, type, form) => {
  const selectedDate = form.getFieldValue("date");

  if (selectedDate && selectedDate.isSame(dayjs(), "day")) {
    const now = dayjs();
    const currentHour = now.hour();
    const currentMinute = now.minute();

    const disabledHours = Array.from({ length: currentHour }, (_, i) => i);

    if (type === "start") {
      return {
        disabledHours: () => disabledHours,
        disabledMinutes: (selectedHour) => {
          if (selectedHour === currentHour) {
            return Array.from({ length: currentMinute }, (_, i) => i);
          }
          return [];
        },
      };
    }
  }
  return {};
};

export default function AdminTimeTableManage() {
  const [classes, setClasses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    dayjs().startOf("isoWeek")
  );
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedClass = useMemo(
    () => classes.find((c) => c.classId === activeClassId),
    [classes, activeClassId]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAllClassAPI();
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setClasses(list);
        if (list.length) setActiveClassId(Number(list[0].classId));
      } catch (e) {
        message.error("Không tải được danh sách lớp.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeClassId || !classes.length) {
      setFilteredCourses([]);
      return;
    }

    const findAndFetchSubjects = async () => {
      setLoadingCourses(true);
      const selectedClass = classes.find((c) => c.classId === activeClassId);
      if (!selectedClass || !selectedClass.categoryId) {
        setFilteredCourses([]);
        setLoadingCourses(false);
        return;
      }

      try {
        const subjects = await getCoursesByCategoryId(selectedClass.categoryId);
        setFilteredCourses(subjects);
      } catch (e) {
        message.error("Lỗi khi tải các môn học cho chuyên ngành này.");
        setFilteredCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };
    findAndFetchSubjects();
  }, [activeClassId, classes]);

  const loadTimetable = useCallback(async (classId) => {
    const numericClassId = Number(classId);
    if (!numericClassId || isNaN(numericClassId)) return;

    setLoading(true);
    try {
      const data = await getAdminTimetableByClass(numericClassId);
      const normalizedSlots = (data || []).map((slot) => ({
        ...slot,
        date: dayjs(slot.date).format("YYYY-MM-DD"),
        startDateTime:
          dayjs(slot.date).format("YYYY-MM-DD") + "T" + slot.startTime,
        endDateTime: dayjs(slot.date).format("YYYY-MM-DD") + "T" + slot.endTime,
      }));

      setRows(normalizedSlots);
    } catch (e) {
      message.error("Không tải được thời khoá biểu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeClassId) loadTimetable(activeClassId);
  }, [activeClassId, loadTimetable, refreshKey]);

  const onOpenCreate = useCallback(
    (datejs, slotNum) => {
      if (!activeClassId) return message.warning("Hãy chọn lớp trước.");
      if (filteredCourses.length === 0) {
        return message.warning(
          "Không có môn học nào phù hợp với chuyên ngành của lớp này."
        );
      }
      setEditing(null);
      form.resetFields();

      const defaultTime = slotTimeMap[slotNum] || slotTimeMap[3];
      let start = datejs
        .hour(dayjs(defaultTime.start, "HH:mm:ss").hour())
        .minute(0)
        .second(0);
      let end = datejs
        .hour(dayjs(defaultTime.end, "HH:mm:ss").hour())
        .minute(0)
        .second(0);

      if (datejs.isSame(dayjs(), "day") && start.isBefore(dayjs())) {
        start = dayjs().add(5, "minutes").startOf("minute");
        end = start.add(2, "hours");
      }

      form.setFieldsValue({
        dayOfWeek: dayNameFromDayjs(datejs),
        courseId: null,
        date: datejs,
        timeRange: [start, end],
        timezone: "Asia/Ho_Chi_Minh",
        meetUrl: undefined,
        note: undefined,
      });
      setOpen(true);
    },
    [activeClassId, form, filteredCourses]
  );

  const onOpenEdit = useCallback(
    (record) => {
      setEditing(record);
      form.resetFields();

      const {
        date,
        startTime,
        endTime,
        courseId,
        meetUrl,
        timezone,
        note,
        dayOfWeek,
        startDateTime,
        endDateTime,
      } = record;

      const start = startDateTime
        ? dayjs(startDateTime)
        : date && startTime
        ? dayjs(`${date} ${startTime}`)
        : null;
      const end = endDateTime
        ? dayjs(endDateTime)
        : date && endTime
        ? dayjs(`${date} ${endTime}`)
        : null;

      form.setFieldsValue({
        dayOfWeek: dayOfWeek,
        courseId: courseId,
        date: date ? dayjs(date) : null,
        timeRange: start && end ? [start, end] : [],
        meetUrl: meetUrl || undefined,
        timezone: timezone || "Asia/Ho_Chi_Minh",
        note: note || undefined,
      });
      setOpen(true);
    },
    [form]
  );

  const onFinish = async (values) => {
    const {
      date,
      timeRange,
      dayOfWeek: manualDayOfWeek,
      meetUrl,
      timezone,
      note,
      courseId,
    } = values;
    const [start, end] = timeRange || [];

    if (!date || !start || !end) {
      return message.warning("Vui lòng chọn ngày và khoảng thời gian.");
    }
    if (!dayjs(end).isAfter(dayjs(start))) {
      return message.warning("Thời gian kết thúc phải sau thời gian bắt đầu.");
    }

    const dayOfWeek = manualDayOfWeek || dayNameFromDayjs(date);
    if (!dayOfWeek) {
      return message.warning("Không xác định được ngày trong tuần.");
    }

    const numericClassId = Number(activeClassId);
    if (isNaN(numericClassId) || numericClassId === 0) {
      return message.error("Lỗi: Không tìm thấy ID lớp học hợp lệ (classId).");
    }

    const dto = {
      classId: numericClassId,
      courseId: courseId,
      dayOfWeek: dayOfWeek,
      date: date.format("YYYY-MM-DD"),
      startTime: start.format("HH:mm:ss"),
      endTime: end.format("HH:mm:ss"),
      meetUrl: meetUrl?.trim() || null,
      timezone: timezone?.trim() || "UTC",
      note: note?.trim() || null,
    };

    try {
      if (editing?.timetableId) {
        await updateTimetable(numericClassId, editing.timetableId, dto);
        message.success("Cập nhật thời khoá biểu thành công");
      } else {
        await createTimetable(numericClassId, dto);
        message.success("Thêm thời khoá biểu thành công");
      }
      setOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      const backendMessage = e?.response?.data?.message;

      const msg =
        backendMessage ||
        "Lưu thời khoá biểu thất bại. Vui lòng kiểm tra móc thời gian";

      message.error(msg);
    }
  };

  const onDeleteInModal = useCallback(async () => {
    if (!editing?.timetableId || !activeClassId) return;
    try {
      setDeleting(true);
      await deleteTimetable(activeClassId, editing.timetableId);
      message.success("Đã xoá slot thời khoá biểu");
      setOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      message.error("Xoá thất bại");
    } finally {
      setDeleting(false);
    }
  }, [editing, activeClassId]);

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
      if (!row.date || !row.startTime) return;

      const start = dayjs(row.startDateTime || `${row.date} ${row.startTime}`);
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
              <CalendarOutlined style={{ fontSize: 24, color: "#1890ff" }} />
              <Title level={3} style={{ margin: 0 }}>
                Quản lý Thời khoá biểu
              </Title>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => activeClassId && loadTimetable(activeClassId)}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <Row style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Text strong>Chọn lớp học:</Text>
              <Select
                showSearch
                placeholder="Chọn lớp học để xem thời khoá biểu"
                style={{ width: "100%" }}
                value={activeClassId ?? undefined}
                onChange={setActiveClassId}
                optionFilterProp="label"
                size="large"
              >
                {classes.map((c) => (
                  <Option
                    key={c.classId}
                    value={c.classId}
                    label={`${c.className || "Class"} (#${c.classId})`}
                  >
                    <Space direction="vertical" size={0}>
                      <Text strong>{c.className || `Class #${c.classId}`}</Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>

        {selectedClass && (
          <Card
            size="small"
            style={{
              marginBottom: 16,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <Space direction="vertical" size={4}>
                  <Text
                    style={{ color: "white", fontSize: 16, fontWeight: 600 }}
                  >
                    {selectedClass.className}
                  </Text>
                  <Text
                    style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}
                  ></Text>
                </Space>
              </Col>
              <Col>
                <Tag
                  color="white"
                  style={{ color: "#667eea", fontWeight: 500 }}
                >
                  {selectedClass.status || "SCHEDULED"}
                </Tag>
              </Col>
            </Row>
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
                  Giờ
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
                          background: isToday
                            ? "#f0f9ff"
                            : slots.length === 0
                            ? "#fcfcfc"
                            : "white",
                          minHeight: 80,
                          cursor:
                            slots.length === 0 && activeClassId
                              ? "pointer"
                              : "default",
                          transition: "background 0.2s",
                        }}
                        onClick={() => {
                          if (slots.length === 0 && activeClassId) {
                            onOpenCreate(day, slotNum);
                          } else if (slots.length > 0) {
                            onOpenEdit(slots[0]);
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (slots.length === 0 && activeClassId)
                            e.currentTarget.style.background = "#e6f7ff";
                        }}
                        onMouseLeave={(e) => {
                          if (slots.length === 0 && activeClassId)
                            e.currentTarget.style.background = isToday
                              ? "#f0f9ff"
                              : "#fcfcfc";
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
                            {/* HIỂN THỊ CHỈ 1 SLOT ĐẦU TIÊN TRÁNH CHỒNG CHÉO */}
                            {slots.slice(0, 1).map((slot) => (
                              <Card
                                key={slot.timetableId}
                                size="small"
                                style={{
                                  cursor: "pointer",
                                  borderLeft: `3px solid ${
                                    DAY_COLORS[slot.dayOfWeek || "MONDAY"]
                                  }`,
                                  background: "#fff9f0",
                                }}
                                bodyStyle={{ padding: "8px 12px" }}
                                hoverable
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenEdit(slot);
                                }}
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
                                    {slot.teacherName || "Chưa gán"}
                                  </Text>
                                  {slot.meetUrl && (
                                    <Tag
                                      color="blue"
                                      style={{ fontSize: 11, padding: "0 4px" }}
                                    >
                                      <a
                                        href={slot.meetUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Meet Link
                                      </a>
                                    </Tag>
                                  )}
                                  <Text
                                    style={{ fontSize: 11, color: "#52c41a" }}
                                  >
                                    (
                                    {dayjs(slot.startTime, "HH:mm:ss").format(
                                      "HH:mm"
                                    )}
                                    -
                                    {dayjs(slot.endTime, "HH:mm:ss").format(
                                      "HH:mm"
                                    )}
                                    )
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
                                </Space>
                              </Card>
                            ))}
                            {/* CẢNH BÁO NẾU CÓ TRÙNG LỊCH */}
                            {slots.length > 1 && (
                              <Tooltip
                                title={`Có ${slots.length} môn học được xếp cùng giờ. Vui lòng kiểm tra xung đột.`}
                              >
                                <Tag
                                  color="red"
                                  style={{
                                    width: "100%",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                    cursor: "help",
                                    marginTop: 4,
                                  }}
                                >
                                  ⚠️ Xung đột lịch ({slots.length} mục)
                                </Tag>
                              </Tooltip>
                            )}
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
                Click vào ô lịch để chỉnh sửa hoặc xóa
              </Text>
            </li>
            <li>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Các hoạt động trong bảng không bao gồm hoạt động ngoại khóa
              </Text>
            </li>
          </ul>
        </Card>
      </Card>

      <Modal
        open={open}
        centered
        width={720}
        title={
          <Space size={8}>
            <CalendarOutlined style={{ color: "#1890ff" }} />
            <span>
              {editing
                ? "Cập nhật slot thời khoá biểu"
                : "Thêm slot thời khoá biểu"}
            </span>
          </Space>
        }
        destroyOnHidden
        onCancel={() => setOpen(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setOpen(false)}
            disabled={deleting}
          >
            Huỷ
          </Button>,

          editing?.timetableId && (
            <Popconfirm
              key="delete-pop"
              title="Xác nhận xoá"
              description="Bạn có chắc muốn xoá slot này?"
              okText="Xoá"
              okButtonProps={{ danger: true, loading: deleting }}
              cancelText="Huỷ"
              onConfirm={() => onDeleteInModal()}
              disabled={deleting}
            >
              <Button
                key="delete"
                danger
                icon={<DeleteOutlined />}
                disabled={deleting}
              >
                Xoá
              </Button>
            </Popconfirm>
          ),

          <Button
            key="ok"
            type="primary"
            onClick={() => form.submit()}
            disabled={deleting}
          >
            {editing ? "Cập nhật" : "Tạo mới"}
          </Button>,
        ].filter(Boolean)}
      >
        <Divider style={{ margin: "16px 0" }} />
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item label="Thứ trong tuần (tuỳ chọn)" name="dayOfWeek">
            <Select
              allowClear
              placeholder="Để trống sẽ tự tính theo ngày bắt đầu"
            >
              {DAY_OPTIONS.map((d) => (
                <Option key={d} value={d}>
                  <Tag color={DAY_COLORS[d]}>{d}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Môn học"
            name="courseId"
            rules={[{ required: true, message: "Chọn môn học" }]}
          >
            <Select
              showSearch
              placeholder={
                loadingCourses ? "Đang tải môn học..." : "Chọn môn học"
              }
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              disabled={filteredCourses.length === 0 || loadingCourses}
            >
              {filteredCourses.map((course) => (
                <Option key={course.courseId} value={course.courseId}>
                  {course.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Ngày"
            name="date"
            rules={[{ required: true, message: "Chọn ngày" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              disabledDate={disabledDate}
            />
          </Form.Item>

          <Form.Item
            label="Khoảng thời gian"
            name="timeRange"
            rules={[
              { required: true, message: "Chọn thời gian bắt đầu/kết thúc" },
            ]}
          >
            <TimePicker.RangePicker
              style={{ width: "100%" }}
              format="HH:mm:ss"
              disabledTime={(time, type) => disabledRangeTime(time, type, form)}
              minuteStep={5}
            />
          </Form.Item>

          <Form.Item label="Meet URL" name="meetUrl">
            <Input
              placeholder="https://meet.google.com/..."
              prefix={<LinkOutlined />}
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Timezone"
            name="timezone"
            initialValue="Asia/Ho_Chi_Minh"
          >
            <Input
              placeholder="VD: UTC, Asia/Ho_Chi_Minh"
              prefix={<GlobalOutlined />}
              allowClear
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea
              rows={3}
              placeholder="Nhập ghi chú hoặc thông tin bổ sung..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
