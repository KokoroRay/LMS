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
  Tag,
  message,
  Typography,
  Popconfirm,
  Row,
  Col,
  Divider,
  Tooltip,
  Empty,
} from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LinkOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

import { fetchAllClassAPI } from "../../../services/classService"; // Giả định tồn tại
import {
  getTimetableByClass,
  createTimetable,
  updateTimetable,
  deleteTimetable,
} from "../../../services/timetableService"; // Đã sửa đổi

dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

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

const toLocalLdt = (v) => (v ? dayjs(v).format("YYYY-MM-DD[T]HH:mm:ss") : null);
const DOW = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const dayNameFromDayjs = (djs) => (dayjs.isDayjs(djs) ? DOW[djs.day()] : null);

export default function TimetablePage() {
  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    dayjs().startOf("isoWeek")
  );
  const [deleting, setDeleting] = useState(false);

  // Load class
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAllClassAPI();
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setClasses(list);
        if (!activeClassId && list.length) setActiveClassId(list[0].classId);
      } catch (e) {
        console.error(e);
        message.error("Không tải được danh sách lớp.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTimetable = useCallback(async (classId) => {
    if (!classId) return;
    setLoading(true);
    try {
      const data = await getTimetableByClass(classId);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      message.error("Không tải được thời khoá biểu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeClassId) loadTimetable(activeClassId);
  }, [activeClassId, loadTimetable]);

  // open create
  const onOpenCreate = useCallback(() => {
    if (!activeClassId) return message.warning("Hãy chọn lớp trước.");
    setEditing(null);
    form.resetFields();
    // gợi ý khung giờ hôm nay 08:00-10:00
    const start = dayjs().hour(8).minute(0).second(0);
    const end = dayjs().hour(10).minute(0).second(0);
    form.setFieldsValue({
      dayOfWeek: null,
      dateTimeRange: [start, end],
      timezone: "UTC",
      meetUrl: undefined,
      note: undefined,
    });
    setOpen(true);
  }, [activeClassId, form]);

  // open edit
  const onOpenEdit = useCallback(
    (record) => {
      setEditing(record);
      form.resetFields();
      // record có startDateTime/endDateTime từ BE
      const start = record.startDateTime ? dayjs(record.startDateTime) : null;
      const end = record.endDateTime ? dayjs(record.endDateTime) : null;
      form.setFieldsValue({
        dayOfWeek: record.dayOfWeek ?? (start ? dayNameFromDayjs(start) : null),
        dateTimeRange: start && end ? [start, end] : [],
        meetUrl: record.meetUrl || undefined,
        timezone: record.timezone || "UTC",
        note: record.note || undefined,
      });
      setOpen(true);
    },
    [form]
  );

  // submit
  const onFinish = async (values) => {
    const [start, end] = values.dateTimeRange || [];
    if (!start || !end) {
      return message.warning(
        "Vui lòng chọn khoảng thời gian bắt đầu/kết thúc."
      );
    }
    if (!dayjs(end).isAfter(dayjs(start))) {
      return message.warning("Thời gian kết thúc phải sau thời gian bắt đầu.");
    }

    // Lấy dayOfWeek: ưu tiên user chọn; nếu không, tự tính từ start
    const computed = values.dayOfWeek || dayNameFromDayjs(start);
    const dayOfWeek = computed?.trim();
    if (!dayOfWeek) {
      return message.warning("Không xác định được ngày trong tuần.");
    }

    const dto = {
      dayOfWeek: values.dayOfWeek || dayNameFromDayjs(start),
      startDateTime: dayjs(start).format("YYYY-MM-DD[T]HH:mm:ss"),
      endDateTime: dayjs(end).format("YYYY-MM-DD[T]HH:mm:ss"),
      meetUrl: values.meetUrl?.trim() || null,
      timezone: values.timezone?.trim() || "UTC",
      note: values.note?.trim() || null,
    };

    try {
      if (editing?.timetableId) {
        // Truyền activeClassId cho hàm updateTimetable
        await updateTimetable(activeClassId, editing.timetableId, dto);
        message.success("Cập nhật thời khoá biểu thành công");
      } else {
        // Truyền activeClassId cho hàm createTimetable
        await createTimetable(activeClassId, dto);
        message.success("Thêm thời khoá biểu thành công");
      }
      setOpen(false);
      loadTimetable(activeClassId);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "Lưu thời khoá biểu thất bại";
      message.error(msg);
    }
  };

  const onDeleteInModal = useCallback(async () => {
    if (!editing?.timetableId || !activeClassId) return;
    try {
      setDeleting(true);
      // Truyền activeClassId cho hàm deleteTimetable
      await deleteTimetable(activeClassId, editing.timetableId);
      message.success("Đã xoá slot thời khoá biểu");
      setOpen(false);
      loadTimetable(activeClassId);
    } catch (e) {
      console.error(e);
      message.error("Xoá thất bại");
    } finally {
      setDeleting(false);
    }
  }, [activeClassId, editing, loadTimetable]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.classId === activeClassId),
    [classes, activeClassId]
  );

  // Generate week calendar
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(currentWeekStart.add(i, "day"));
    }
    return days;
  }, [currentWeekStart]);

  // Group slots by day and time slot
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

      // Determine slot number based on time
      let slotNum = 1;
      if (hour >= 7 && hour < 9) slotNum = 1;
      else if (hour >= 9 && hour < 10) slotNum = 2;
      else if (hour >= 10 && hour < 12) slotNum = 3;
      else if (hour >= 12 && hour < 13) slotNum = 4;
      else if (hour >= 13 && hour < 15) slotNum = 5;
      else if (hour >= 15 && hour < 17) slotNum = 6;
      else if (hour >= 17 && hour < 19) slotNum = 7;
      else slotNum = 8;

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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onOpenCreate}
                disabled={!activeClassId}
              >
                Thêm slot
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
                  >
                    Class ID: #{selectedClass.classId}
                  </Text>
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

        {/* Week Navigation */}
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

        {/* Timetable Calendar View */}
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
                          >
                            -
                          </div>
                        ) : (
                          <Space
                            direction="vertical"
                            size={4}
                            style={{ width: "100%" }}
                          >
                            {slots.map((slot) => (
                              <Card
                                key={slot.timetableId}
                                size="small"
                                style={{
                                  cursor: "pointer",
                                  borderLeft: `3px solid ${
                                    DAY_COLORS[slot.dayOfWeek || "Monday"]
                                  }`,
                                  background: "#fff9f0",
                                }}
                                bodyStyle={{ padding: "8px 12px" }}
                                hoverable
                                onClick={() => onOpenEdit(slot)}
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
                                    {selectedClass?.className || "Class"}
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
                                        Meet
                                      </a>
                                    </Tag>
                                  )}
                                  <Text
                                    style={{ fontSize: 11, color: "#52c41a" }}
                                  >
                                    ({dayjs(slot.startDateTime).format("HH:mm")}
                                    -{dayjs(slot.endDateTime).format("HH:mm")})
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

        {/* Note section */}
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
        // AntD v5: dùng destroyOnHidden thay cho destroyOnClose để khỏi warning
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
          {/* Cho phép chọn hoặc bỏ trống để tự tính từ startDateTime */}
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
            label="Khoảng thời gian (ngày + giờ)"
            name="dateTimeRange"
            rules={[
              { required: true, message: "Chọn thời gian bắt đầu/kết thúc" },
            ]}
          >
            <RangePicker
              showTime
              style={{ width: "100%" }}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>

          <Form.Item label="Meet URL" name="meetUrl">
            <Input
              placeholder="https://meet.google.com/..."
              prefix={<LinkOutlined />}
              allowClear
            />
          </Form.Item>

          <Form.Item label="Timezone" name="timezone" initialValue="UTC">
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
