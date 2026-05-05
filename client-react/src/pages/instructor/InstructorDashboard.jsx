import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Table,
  Space,
  Tabs,
  Spin,
  message,
  Avatar,
  Statistic,
  List,
} from "antd";
import {
  ReadOutlined,
  ExperimentOutlined,
  ScheduleOutlined,
  UserOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  BookOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "../../styles/dashboard.css";
import api from "../../services/authService";

const { Title, Text } = Typography;
const DATE_FORMAT = "DD/MM/YYYY";
const VND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

export default function InstructorDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get("/instructors/me/dashboard-summary");
        if (mounted) {
          setData(res.data);
        }
      } catch (e) {
        if (mounted) {
          const errorMsg =
            e?.response?.data?.message || "Hiện tại Chưa có dữ liệu";
          setErr(errorMsg);
          message.error("Không thể tải dữ liệu dashboard: " + errorMsg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const overview = useMemo(() => {
    if (!data) {
      return {
        classCount: 0,
        examCount: 0,
        totalStudents: 0,
        upcomingSchedules: 0,
      };
    }
    return data.overview;
  }, [data]);

  const courses = data?.myCourses || [];
  const classes = data?.myClasses || [];
  const exams = data?.myExams || [];
  const scheduleList = data?.scheduleList || [];

  const coursesCols = [
    {
      title: "ID",
      dataIndex: "courseId",
      width: 80,
      render: (v) => v ?? "-",
    },
    { title: "Title", dataIndex: "title", ellipsis: true },
    { title: "Level", dataIndex: "level", width: 120 },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (s) => (
        <Tag
          color={s === "PUBLISHED" ? "blue" : s === "DRAFT" ? "default" : "red"}
        >
          {s || "—"}
        </Tag>
      ),
    },
  ];

  const classesCols = [
    {
      title: "ID",
      dataIndex: "classId",
      width: 80,
      render: (v) => v ?? "-",
    },
    {
      title: "Class Name",
      dataIndex: "className",
      ellipsis: true,
    },
    {
      title: "Students",
      dataIndex: "currentStudents",
      width: 100,
      align: "center",
      render: (v) => v ?? 0,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (s) => <Tag>{s || "—"}</Tag>,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      width: 120,
      render: (v) => (dayjs(v).isValid() ? dayjs(v).format(DATE_FORMAT) : "—"),
    },
  ];

  const examsCols = [
    {
      title: "ID",
      dataIndex: "examId",
      width: 80,
      render: (v) => v ?? "-",
    },
    {
      title: "Class",
      dataIndex: "className",
      width: 120,
      render: (v) => v ?? "-",
    },
    { title: "Title", dataIndex: "title", ellipsis: true },
    {
      title: "Duration",
      dataIndex: "durationMinutes",
      width: 100,
      render: (v) => `${v ?? 0} min`,
    },
    {
      title: "Published",
      dataIndex: "isPublished",
      width: 100,
      render: (v) => (
        <Tag color={v ? "green" : "default"}>{v ? "Yes" : "No"}</Tag>
      ),
    },
  ];

  const cardStyle = {
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    height: "100%",
  };

  return (
    <div className="admin-dashboard" style={{ padding: "24px" }}>
      {err && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#fee",
            color: "#b91c1c",
            borderRadius: 8,
          }}
        >
          Lỗi: {String(err)}
        </div>
      )}

      <Spin spinning={loading}>
        <Title level={2} style={{ marginBottom: 24 }}>
          Instructor Dashboard
        </Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                ...cardStyle,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>
                    My Classes
                  </span>
                }
                value={overview.classCount}
                valueStyle={{ color: "#fff", fontSize: 32, fontWeight: 700 }}
                prefix={<ScheduleOutlined />}
              />
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                Số lớp đang dạy
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                ...cardStyle,
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>
                    Total Students
                  </span>
                }
                value={overview.totalStudents}
                valueStyle={{ color: "#fff", fontSize: 32, fontWeight: 700 }}
                prefix={<UserOutlined />}
              />
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                Học sinh trong lớp
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                ...cardStyle,
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>
                    My Exams
                  </span>
                }
                value={overview.examCount}
                valueStyle={{ color: "#fff", fontSize: 32, fontWeight: 700 }}
                prefix={<ExperimentOutlined />}
              />
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                Bài thi (đã publish)
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                ...cardStyle,
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>
                    Upcoming
                  </span>
                }
                value={overview.upcomingSchedules}
                valueStyle={{ color: "#fff", fontSize: 32, fontWeight: 700 }}
                prefix={<CalendarOutlined />}
              />
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                Lịch học sắp tới
              </Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={16}>
            <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
              <Tabs
                defaultActiveKey="courses"
                tabBarStyle={{ padding: "0 24px", marginBottom: 0 }}
                items={[
                  {
                    key: "courses",
                    label: (
                      <Space>
                        <ReadOutlined /> My Courses ({courses.length})
                      </Space>
                    ),
                    children: (
                      <div style={{ padding: "0 24px 24px 24px" }}>
                        <Table
                          size="middle"
                          rowKey={"courseId"}
                          columns={coursesCols}
                          dataSource={courses}
                          pagination={{ pageSize: 5 }}
                        />
                      </div>
                    ),
                  },
                  {
                    key: "classes",
                    label: (
                      <Space>
                        <ScheduleOutlined /> My Classes ({classes.length})
                      </Space>
                    ),
                    children: (
                      <div style={{ padding: "0 24px 24px 24px" }}>
                        <Table
                          size="middle"
                          rowKey={"classId"}
                          columns={classesCols}
                          dataSource={classes}
                          pagination={{ pageSize: 5 }}
                        />
                      </div>
                    ),
                  },
                  {
                    key: "exams",
                    label: (
                      <Space>
                        <ExperimentOutlined /> My Exams ({exams.length})
                      </Space>
                    ),
                    children: (
                      <div style={{ padding: "0 24px 24px 24px" }}>
                        <Table
                          size="middle"
                          rowKey={"examId"}
                          columns={examsCols}
                          dataSource={exams}
                          pagination={{ pageSize: 5 }}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card {...cardStyle}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                Upcoming Schedule
              </Title>
              <List
                itemLayout="horizontal"
                dataSource={scheduleList}
                renderItem={(it) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<CalendarOutlined />}
                          style={{ background: "#FFF7ED", color: "#92400E" }}
                        />
                      }
                      title={
                        <span style={{ fontWeight: 600 }}>{it.title}</span>
                      }
                      description={
                        <Text type="secondary">
                          {dayjs(it.date).format("ddd, DD/MM/YYYY")} -{" "}
                          {it.startTime}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}
