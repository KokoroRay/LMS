import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Select,
  Spin,
  message,
  List,
  Input,
  Alert,
} from "antd";
import {
  ClockCircleOutlined,
  FileDoneOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import "../../styles/sider.css";
import Donut from "../../components/chart/Donut";
import { getMyEnrolledCourses } from "../../services/subjectService";
import { fetchAllPointAPI } from "../../services/pointService";
import { fetchMyAttendanceSummary } from "../../services/attendanceService";


const { Content, Header } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;



export default function StudentOverview() {
  const user = useSelector((state) => state.auth.user);
  const studentId = user?.userId || user?.id;

  const [loading, setLoading] = useState(true); // Unified loading state
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [failedCoursesCount, setFailedCoursesCount] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [summary, setSummary] = useState([]);

  // Donut chart data
  const [attendanceData, setAttendanceData] = useState({
    percent: 0,
    condition: false,
  });


  const overallSummary = useMemo(() => {
    if (!summary || summary.length === 0)
      return {
        totalSessions: 0,
        totalAttended: 0,
        totalAbsent: 0,
        attendedRate: 0,
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
    const attendedRate = totalSessions
      ? (totalAttended / totalSessions) * 100
      : 0;

    return {
      totalSessions,
      totalAttended,
      totalAbsent,
      attendedRate: Math.round(attendedRate),
    };
  }, [summary]);

  // Fetch all overview data
  useEffect(() => {
    const loadData = async () => {
      if (!studentId) return;

      setLoading(true);
      try {
        const [enrolledRes, pointsRes, attendanceRes] = await Promise.all([
          getMyEnrolledCourses(),
          fetchAllPointAPI(studentId),
          fetchMyAttendanceSummary(),
        ]);

        // Courses
        const courses = Array.isArray(enrolledRes) ? enrolledRes : [];
        setEnrolledCourses(courses);
        if (courses.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(courses[0].courseId);
        }

        // Points - xử lý an toàn để tránh lỗi
        try {
          const points = Array.isArray(pointsRes?.data) ? pointsRes.data : [];
          // Đếm số môn có status FAIL
          const failedCount = points.filter((item) => item && item.status === 'FAIL').length;
          setFailedCoursesCount(failedCount);
        } catch (error) {
          console.warn('Không thể tải dữ liệu điểm, đặt số môn học lại = 0');
          setFailedCoursesCount(0);
        }

        // Attendance
        setSummary(attendanceRes || []);
      } catch (error) {
        console.error("Error loading overview data:", error);
        message.error("Không thể tải dữ liệu tổng quan.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentId]);

  // Update attendance chart when summary is ready
  useEffect(() => {
    const isConditionMet = overallSummary.attendedRate >= 80; // Example: 80% for eligibility
    setAttendanceData({
      percent: overallSummary.attendedRate,
      condition: isConditionMet,
    });
  }, [overallSummary]);

  // Placeholder for fetching dynamic donut chart data based on selected subject
  const fetchDonutDataForSubject = useCallback(async (subjectId) => {
    if (!subjectId) return;

    // --- Placeholder logic ---
    // In a real application, you would make an API call here for other stats
    // --- End Placeholder logic ---
  }, []);

  useEffect(() => {
    fetchDonutDataForSubject(selectedSubjectId);
  }, [selectedSubjectId, fetchDonutDataForSubject]);

  const ControlsHeader = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        marginTop: 16,
        padding: "16px 24px",
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow:
          "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
        flexWrap: "wrap",
        gap: 12,
      }}
      className="responsive-header-box"
    >
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
        <ClockCircleOutlined
          style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
        />
        <span className="mobile-hide-text">Tổng quan</span>
      </Title>

      <Space wrap size="middle" style={{ flexWrap: "wrap" }}>
        {" "}
      </Space>
    </div>
  );

  return (
    <Spin spinning={loading} size="large" tip="Đang tải dữ liệu...">
      <div className="main-content">
        {ControlsHeader}

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 16,
                background: "linear-gradient(120deg, #1F1C3A, #3B3175)",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                minHeight: 140,
              }}
              styles={{ body: { padding: 18 } }}
            >
              <Row justify="space-between" align="middle">
                <Text
                  style={{
                    color: "#b6b6d6",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  Môn học theo lộ trình
                </Text>
                <span style={{ position: "relative", zIndex: 1 }}>
                  <FileDoneOutlined
                    style={{ color: "#fff", opacity: 0.3, fontSize: 20 }}
                  />
                </span>
              </Row>
              <Title
                level={1}
                style={{ 
                  color: "#fff", 
                  margin: "8px 0 0", 
                  zIndex: 1,
                  fontSize: "clamp(32px, 5vw, 56px)",
                }}
              >
                {`${enrolledCourses.length}`}
              </Title>
              <div
                style={{
                  position: "absolute",
                  bottom: "-120px",
                  right: "-39px",
                  width: "196px",
                  height: "196px",
                  background:
                    "radial-gradient(circle, rgb(120 110 180) 0%, rgba(100, 90, 160, 0.25) 20%, rgb(85 80 145) 40%, rgb(65 60 115 / 0%) 85%, transparent 100%)",
                  borderRadius: "50%",
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-75px",
                  right: "-2px",
                  width: "124px",
                  height: "124px",
                  background:
                    "radial-gradient(circle, transparent 0%, transparent 38%, rgb(70 60 124), rgba(145, 135, 200, 0.95) 42%, rgba(115, 105, 170, 0.5) 75%, rgba(85, 80, 140, 0.35) 70%, transparent 100%)",
                  borderRadius: "50%",
                  zIndex: 1,
                }}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 16,
                background: "linear-gradient(120deg, #7F1D1D, #B91C1C)",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                minHeight: 140,
              }}
              styles={{ body: { padding: 18 } }}
            >
              <Row justify="space-between" align="middle">
                <Text
                  style={{
                    color: "#ffd6d6",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  Môn học lại
                </Text>
                <span style={{ position: "relative", zIndex: 1 }}>
                  <ReloadOutlined
                    style={{ color: "#fff", opacity: 0.3, fontSize: 20 }}
                  />
                </span>
              </Row>
              <Title
                level={1}
                style={{ 
                  color: "#fff", 
                  margin: "8px 0 0", 
                  zIndex: 1,
                  fontSize: "clamp(32px, 5vw, 56px)",
                }}
              >
                {`${failedCoursesCount}`}
              </Title>
              <div
                style={{
                  position: "absolute",
                  bottom: "-120px",
                  right: "-39px",
                  width: "196px",
                  height: "196px",
                  background:
                    "radial-gradient(circle, rgb(220, 100, 100) 0%, rgb(232 77 77 / 0%) 25%, rgb(217 177 177 / 26%) 55%, rgb(165 43 43) 90%)",
                  borderRadius: "50%",
                  zIndex: 0,
                }}
              />

              <div
                style={{
                  position: "absolute",
                  bottom: "-75px",
                  right: "-2px",
                  width: "124px",
                  height: "124px",
                  background:
                    "radial-gradient(circle, transparent 0%, #b92828 38%, rgb(193 53 53), rgb(255 166 166 / 61%) 42%, rgb(196 53 53 / 47%) 75%, rgb(153 29 29) 70%, transparent 100%)",
                  borderRadius: "50%",
                  zIndex: 1,
                }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          style={{ marginTop: 16, borderRadius: 16 }}
          styles={{ body: { padding: 16 } }}
          variant="borderless"
        >
          <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
            <Space>
              {/* <Select
                value={selectedSubjectId}
                onChange={setSelectedSubjectId}
                style={{ width: 180, marginRight: 8 }}
                placeholder="Chọn môn học"
              >
                {enrolledCourses.map((course) => (
                  <Option key={course.courseId} value={course.courseId}>
                    {course.title}
                  </Option>
                ))}
              </Select> */}
              {/* <Tag color={attendanceData.condition ? "green" : "red"}>
                {attendanceData.condition
                  ? "Đủ điều kiện"
                  : "Không đủ điều kiện"}
              </Tag> */}
            </Space>
            {/* <Button>Chi tiết điểm</Button> */}
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Donut
                percent={attendanceData.percent}
                color="#22C55E"
                label="Tỉ lệ đi học"
                legend={[
                  {
                    dot: "#22C55E",
                    text: `Đi học: ${overallSummary.totalAttended}`,
                  },
                  {
                    dot: "#D9D9D9",
                    text: `Nghỉ: ${overallSummary.totalAbsent}`,
                  },
                ]}
              />
            </Col>
            <Col xs={24} lg={16}>
              <Card
                variant="borderless"
                style={{ borderRadius: 16, height: '100%' }}
                styles={{ body: { padding: 16 } }}
              >
                <Title level={5}>Môn học đã đăng ký</Title>
                {enrolledCourses.length > 0 ? (
                  <List
                    size="small"
                    dataSource={enrolledCourses}
                    renderItem={(item) => (
                      <List.Item style={{ marginBottom: 8, padding: 0, borderBottom: 'none' }}>
                        <div
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: '#f0f2f5',
                            borderRadius: 8,
                            border: '1px solid #d9d9d9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography.Text strong>{item.title}</Typography.Text>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text>Chưa có môn học nào được đăng ký.</Text>
                )}
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </Spin>
  );
}
