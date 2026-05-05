import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Progress,
  Table,
  Button,
  Space,
  Tabs,
  Input,
  Select,
  DatePicker,
  Divider,
  Spin,
  message,
  Avatar,
  Statistic,
  List,
  Rate,
  Empty,
} from "antd";
import {
  CreditCardOutlined,
  FileTextOutlined,
  ReadOutlined,
  ExperimentOutlined,
  ScheduleOutlined,
  NotificationOutlined,
  BookOutlined,
  PlayCircleOutlined,
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  WalletOutlined,
  StarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "../../styles/dashboard.css";

// ===== Services =====
import { fetchAllSubjectAPI } from "../../services/subjectService";
import { listSessions } from "../../services/sessionService";
import { listLessonsBySession } from "../../services/lessonService";
import { getTimetableByClass } from "../../services/timetableService";
import { fetchAllClassAPI } from "../../services/classService";
import { getStudents } from "../../services/studentService";
import { fetchAllTeacherAPI } from "../../services/instructorService";
import { listAllSurveys, getSurveyStatistics } from "../../services/courseServey";
import api from "../../services/authService";
import { getAllReEnrollmentsAPI } from "../../services/re-registerService";
import { getAllPaymentsAPI } from "../../services/paymentService"; // ===== THÊM IMPORT =====

/* ------------------ Helpers ------------------ */
const toArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
};

// Helper tách số rating từ key của optionCounts
const extractRating = (rawOption) => {
  if (rawOption == null) return 0;

  // VD: "4.5 | Comment: tốt" -> "4.5"
  const numStr = String(rawOption).split("|")[0].trim();

  // Phòng khi dùng dấu phẩy thập phân "4,5"
  const normalized = numStr.replace(",", ".");

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
};

// Helper to calculate average rating from optionCounts
const calculateAverage = (optionCounts) => {
  if (!optionCounts || typeof optionCounts !== "object") return 0;

  let totalScore = 0;
  let totalVotes = 0;

  for (const [option, count] of Object.entries(optionCounts || {})) {
    const rating = extractRating(option);  
    const c = Number(count) || 0;

    totalScore += rating * c;
    totalVotes += c;
  }

  return totalVotes > 0 ? totalScore / totalVotes : 0;
};


const { Title, Text } = Typography;
const DATE_FORMAT = "DD/MM/YYYY";
const sumBy = (arr, pick) =>
  arr.reduce((s, x) => s + (Number(pick(x)) || 0), 0);
const VND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

/* ------------------ Main Component ------------------ */
export default function AdminDashBoard() {
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [evaluationRankings, setEvaluationRankings] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(true);
  
  // ===== ALL PAYMENTS STATE - Lưu dữ liệu từ payments/all =====
  const [allPayments, setAllPayments] = useState([]);

  // ===== LOAD DATA =====
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setErr(null);
      try {
        const [
          coursesRes,
          classesRes,
          examsRes,
          sessionsRes,
          paymentsRes,
          invoicesRes,
          couponsRes,
          announcementsRes,
          studentsRes,
          teachersRes,
          allPaymentsRes, // ===== API PAYMENTS/ALL =====
        ] = await Promise.allSettled([
          fetchAllSubjectAPI(),
          fetchAllClassAPI(),
          api.get("/exams"),
          listSessions(),
          api.get("/payments"),
          api.get("/invoices"),
          api.get("/coupons"),
          api.get("/announcements"),
          api.get("/admin/students", { params: { page: 0, size: 1 } }),
          fetchAllTeacherAPI(),
          getAllPaymentsAPI(), // ===== GỌI API PAYMENTS/ALL =====
        ]);

        if (!mounted) return;

        const _courses =
          coursesRes.status === "fulfilled" ? toArray(coursesRes.value) : [];
        const _classes =
          classesRes.status === "fulfilled" ? toArray(classesRes.value) : [];
        const _exams =
          examsRes.status === "fulfilled" ? toArray(examsRes.value) : [];
        const _sessions =
          sessionsRes.status === "fulfilled" ? toArray(sessionsRes.value) : [];
        const _payments =
          paymentsRes.status === "fulfilled" ? toArray(paymentsRes.value) : [];
        const _invoices =
          invoicesRes.status === "fulfilled" ? toArray(invoicesRes.value) : [];
        const _coupons =
          couponsRes.status === "fulfilled" ? toArray(couponsRes.value) : [];
        const _anncs =
          announcementsRes.status === "fulfilled"
            ? toArray(announcementsRes.value)
            : [];

        // ===== PAYMENTS/ALL - Xử lý và lưu dữ liệu từ payments/all =====
        const _allPayments =
          allPaymentsRes.status === "fulfilled"
            ? toArray(allPaymentsRes.value)
            : [];
        
        console.log("===== ALL PAYMENTS FROM /payments/all ======");
        console.log("All payments data:", _allPayments);
        console.log("Total payments:", _allPayments.length);
        if (_allPayments.length > 0) {
          console.log("First payment:", _allPayments[0]);
          console.log("First payment keys:", Object.keys(_allPayments[0]));
        }

        // ===== REENROLLMENT REVENUE - Xử lý dữ liệu reenrollments =====
        // const _reenrollments =
        //   reenrollmentsRes.status === "fulfilled"
        //     ? toArray(reenrollmentsRes.value)
        //     : [];
        // setReenrollments(_reenrollments);

        let studentsTotal = 0;
        if (studentsRes.status === "fulfilled") {
          console.log(
            "Students API Success - Full Response:",
            studentsRes.value
          );

          const pageData = studentsRes.value?.data?.data;
          console.log("Page Data:", pageData);

          studentsTotal =
            pageData?.totalElements ||
            pageData?.total ||
            pageData?.totalCount ||
            0;

          console.log("Students Total Found:", studentsTotal);
        } else {
          console.error(" Students API Failed:", studentsRes.reason);
        }

        const teachersData =
          teachersRes.status === "fulfilled" ? toArray(teachersRes.value) : [];
        const teachersTotal = teachersData.length;
        console.log("Teachers Total:", teachersTotal);

        setCourses(_courses);
        setClasses(_classes);
        setExams(_exams);
        setSessions(_sessions);
        setPayments(_payments);
        setInvoices(_invoices);
        setCoupons(_coupons);
        setAnnouncements(_anncs);
        setStudentCount(studentsTotal);
        setTeacherCount(teachersTotal);
        
        // ===== SET ALL PAYMENTS STATE =====
        setAllPayments(_allPayments);

        try {
          const take = Math.min(_sessions.length, 10);
          const subset = _sessions.slice(0, take);
          const tasks = subset.map((s) =>
            listLessonsBySession(s.sessionId ?? s.id)
              .then(toArray)
              .catch(() => [])
          );
          const allLessons = (await Promise.allSettled(tasks)).flatMap((r) =>
            r.status === "fulfilled" ? r.value : []
          );
          setLessons(allLessons);
        } catch {
          setLessons([]);
        }
      } catch (e) {
        if (mounted) {
          setErr(e?.message || "Failed to load dashboard data");
          message.error("Không thể tải dữ liệu dashboard");
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

  useEffect(() => {
    async function loadEvaluationData() {
        setLoadingRankings(true);
        try {
            const allSurveys = await listAllSurveys();
            if (!allSurveys || allSurveys.length === 0) {
                setEvaluationRankings([]);
                setLoadingRankings(false);
                return;
            }
            
            const reportPromises = allSurveys.map(async (survey) => {
                try {
                    const stats = await getSurveyStatistics(survey.surveyId);
                    const ratingStats = (stats || []).filter(s => s.questionType === 'RATING' && s.totalResponses > 0);
                    let surveyAverage = 0;
                    if (ratingStats.length > 0) {
                        const avgRatings = ratingStats.map(stat => calculateAverage(stat.optionCounts));
                        surveyAverage = avgRatings.reduce((sum, avg) => sum + avg, 0) / avgRatings.length;
                    }
                    const submissions = stats.length > 0 ? Math.max(0, ...stats.map(s => s.totalResponses || 0)) : 0;
                    return {
                        courseId: survey.courseId,
                        avgScore: surveyAverage,
                        submissions,
                    };
                } catch {
                    return null;
                }
            });

            const reports = (await Promise.all(reportPromises)).filter(Boolean);
            
            const courseScores = reports.reduce((acc, report) => {
                if (!acc[report.courseId]) {
                    acc[report.courseId] = { totalScore: 0, count: 0, submissions: 0 };
                }
                if (report.submissions > 0 && report.avgScore > 0) {
                    acc[report.courseId].totalScore += report.avgScore;
                    acc[report.courseId].count += 1;
                }
                acc[report.courseId].submissions += report.submissions;
                return acc;
            }, {});

            const rankedCourses = Object.keys(courseScores).map(courseId => {
                const scoreData = courseScores[courseId];
                return {
                    courseId,
                    avgRating: scoreData.count > 0 ? scoreData.totalScore / scoreData.count : 0,
                    submissions: scoreData.submissions,
                };
            })
            .filter(course => course.avgRating > 0)
            .sort((a, b) => b.avgRating - a.avgRating);

            setEvaluationRankings(rankedCourses);
        } catch (e) {
            console.error("Failed to load evaluation rankings", e);
        } finally {
            setLoadingRankings(false);
        }
    }

    if (courses.length > 0) {
        loadEvaluationData();
    }
  }, [courses]);

  // ===== REMOVE REENROLLMENT REVENUE - Không cần nữa =====
  // const reenrollmentRevenue = useMemo(() => {
  //   // Lọc các reenrollments có status PAYMENT_SUCCESS
  //   const successReenrollments = reenrollments.filter(
  //     (r) => (r.status || "").toString().toUpperCase() === "PAYMENT_SUCCESS"
  //   );
    
  //   // Tính tổng giá từ các reenrollments thành công
  //   // Có thể dùng price, amount, hoặc total tùy vào cấu trúc API
  //   const total = sumBy(successReenrollments, (r) => 
  //     r.price ?? r.amount ?? r.total ?? 0
  //   );
    
  //   return total;
  // }, [reenrollments]);

  const overview = useMemo(() => {
    // ===== TÍNH REVENUE TỪ PAYMENTS/ALL CÓ STATUS SUCCESS =====
    // Lọc các payments có status SUCCESS từ allPayments
    const successPayments = allPayments.filter(
      (p) => (p.status || "").toString().toUpperCase() === "SUCCESS"
    );
    
    console.log("===== REVENUE CALCULATION ======");
    console.log("Total allPayments:", allPayments.length);
    console.log("Success payments count:", successPayments.length);
    if (successPayments.length > 0) {
      console.log("Sample success payment:", successPayments[0]);
    }
    
    // Tính tổng revenue từ payments thành công
    // Có thể dùng amount, total, hoặc price tùy vào cấu trúc API
    const revenue = sumBy(successPayments, (p) => 
      p.amount ?? p.total ?? p.price ?? 0
    );
    
    console.log("Total Revenue:", revenue);
    
    const levelPercent = Math.min(
      100,
      Math.round((sessions.length / Math.max(1, courses.length * 8)) * 100)
    );

    return {
      classCount: classes.length,
      courseCount: courses.length,
      examCount: exams.length,
      sessionsCount: sessions.length,
      lessonsCount: lessons.length,
      studentCount,
      teacherCount,
      revenue, // ===== REVENUE TỪ PAYMENTS/ALL CÓ STATUS SUCCESS =====
      levelPercent,
    };
  }, [
    classes,
    courses,
    exams,
    sessions,
    lessons,
    allPayments, // ===== DÙNG allPayments THAY VÌ payments =====
    studentCount,
    teacherCount,
  ]);
  
  const courseMap = useMemo(() => {
    return (courses || []).reduce((acc, course) => {
        acc[course.courseId] = course.title;
        return acc;
    }, {});
  }, [courses]);

  const coursesCols = [
    {
      title: "ID",
      dataIndex: "courseId",
      width: 80,
      render: (_, r) => r.courseId ?? r.id ?? r.course_id ?? "-",
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
    {
      title: "Price",
      dataIndex: "price",
      width: 120,
      render: (v) => (v != null ? VND(v) : "—"),
    },
  ];

  const classesCols = [
    {
      title: "ID",
      dataIndex: "classId",
      width: 80,
      render: (_, r) => r.classId ?? r.id ?? r.class_id ?? "-",
    },
    // {
    //   title: "Course",
    //   dataIndex: "courseId",
    //   width: 100,
    //   render: (_, r) => r.course?.courseId ?? r.courseId ?? r.course_id ?? "-",
    // },
    {
      title: "Class Name",
      dataIndex: "className",
      ellipsis: true,
      render: (_, r) => r.className ?? r.name ?? r.class_name ?? "-",
    },
    // {
    //   title: "Teacher",
    //   dataIndex: "teacher",
    //   width: 150,
    //   render: (_, r) => r.teacher?.name ?? r.teacherName ?? r.teacher ?? "—",
    // },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (s) => <Tag>{s || "—"}</Tag>,
    },
    {
      title: "Start",
      dataIndex: "start",
      width: 120,
      render: (_, r) => {
        const date = r.start ?? r.startDate ?? r.start_time;
        return dayjs(date).isValid() ? dayjs(date).format(DATE_FORMAT) : "—";
      },
    },
    {
      title: "End",
      dataIndex: "end",
      width: 120,
      render: (_, r) => {
        const date = r.end ?? r.endDate ?? r.end_time;
        return dayjs(date).isValid() ? dayjs(date).format(DATE_FORMAT) : "—";
      },
    },
  ];

  const examsCols = [
    {
      title: "ID",
      dataIndex: "examId",
      width: 80,
      render: (_, r) => r.examId ?? r.id ?? r.exam_id ?? "-",
    },
    // {
    //   title: "Class",
    //   dataIndex: "classId",
    //   width: 100,
    //   render: (_, r) => r.classId ?? r.class_id ?? r.class?.classId ?? "-",
    // },
    { title: "Title", dataIndex: "title", ellipsis: true },
    // {
    //   title: "Duration",
    //   dataIndex: "duration_minutes",
    //   width: 100,
    //   render: (v, r) => `${v ?? r.duration ?? 0} min`,
    // },
    {
      title: "Start",
      dataIndex: "start_time",
      width: 140,
      render: (v, r) => {
        const date = v ?? r.startTime;
        return dayjs(date).isValid()
          ? dayjs(date).format("YYYY-MM-DD HH:mm")
          : "—";
      },
    },
    {
      title: "End",
      dataIndex: "end_time",
      width: 140,
      render: (v, r) => {
        const date = v ?? r.endTime;
        return dayjs(date).isValid()
          ? dayjs(date).format("YYYY-MM-DD HH:mm")
          : "—";
      },
    },
    {
      title: "Published",
      dataIndex: "published",
      width: 100,
      render: (v) => (
        <Tag color={v ? "green" : "default"}>{v ? "Yes" : "No"}</Tag>
      ),
    },
  ];

  const lessonsCols = [
    { title: "ID", dataIndex: "lessonId", width: 80, render: (v) => v ?? "-" },
    {
      title: "Session",
      dataIndex: "sessionId",
      width: 100,
      render: (v, r) => <Tag color="blue">#{r.sessionId ?? "-"}</Tag>,
    },
    { title: "Title", dataIndex: "title", ellipsis: true },
    {
      title: "Video",
      dataIndex: "videoUrl",
      width: 80,
      align: "center",
      render: (v) =>
        v ? (
          <a href={v} target="_blank" rel="noreferrer">
            <PlayCircleOutlined style={{ fontSize: 18 }} />
          </a>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    // {
    //   title: "Duration (min)",
    //   dataIndex: "durationMinutes",
    //   width: 120,
    //   align: "right",
    //   render: (v) => v ?? 0,
    //   sorter: (a, b) => (a.durationMinutes ?? 0) - (b.durationMinutes ?? 0),
    // },
    // {
    //   title: "Order",
    //   dataIndex: "orderIndex",
    //   width: 90,
    //   align: "right",
    //   render: (v) => v ?? 0,
    //   sorter: (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    // },
  ];

  const paymentsCols = [
    {
      title: "ID",
      dataIndex: "payment_id",
      width: 80,
      render: (_, r) => r.payment_id ?? r.id ?? "-",
    },
    {
      title: "Student",
      dataIndex: "student",
      render: (_, r) => r.student?.name ?? r.studentName ?? r.student ?? "—",
    },
    {
      title: "Course",
      dataIndex: "course_id",
      width: 100,
      render: (_, r) => r.courseId ?? r.course_id ?? r.course?.courseId ?? "—",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 140,
      render: (v, r) => VND(v ?? r.total),
    },
    {
      title: "Method",
      dataIndex: "method",
      width: 120,
      render: (v) => v ?? "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (s) => {
        const upper = String(s).toUpperCase();
        return (
          <Tag
            color={
              upper === "SUCCESS" ? "green" : s === "PENDING" ? "gold" : "red"
            }
          >
            {s ?? "—"}
          </Tag>
        );
      },
    },
  ];

  const invoicesCols = [
    {
      title: "ID",
      dataIndex: "invoice_id",
      width: 80,
      render: (_, r) => r.invoice_id ?? r.id ?? "-",
    },
    {
      title: "Payment",
      dataIndex: "payment_id",
      width: 100,
      render: (_, r) => r.payment_id ?? r.paymentId ?? "—",
    },
    {
      title: "Code",
      dataIndex: "invoice_code",
      render: (_, r) => r.invoice_code ?? r.code ?? "—",
    },
    {
      title: "Issued",
      dataIndex: "issued_date",
      width: 140,
      render: (_, r) => {
        const date = r.issued_date ?? r.issuedAt;
        return dayjs(date).isValid() ? dayjs(date).format(DATE_FORMAT) : "—";
      },
    },
  ];

  const couponsCols = [
    {
      title: "ID",
      dataIndex: "coupon_id",
      width: 80,
      render: (_, r) => r.coupon_id ?? r.id ?? "-",
    },
    { title: "Code", dataIndex: "code" },
    {
      title: "Discount %",
      dataIndex: "discount_percent",
      width: 120,
      render: (v, r) => `${v ?? r.percent ?? r.discount ?? 0}%`,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (s) => (
        <Tag color={s === "ACTIVE" ? "green" : "default"}>{s ?? "—"}</Tag>
      ),
    },
  ];

  const announcementsCols = [
    {
      title: "ID",
      dataIndex: "announcement_id",
      width: 80,
      render: (_, r) => r.announcement_id ?? r.id ?? "-",
    },
    {
      title: "Scope",
      dataIndex: "scope",
      width: 120,
      render: (v) => v ?? "—",
    },
    { title: "Title", dataIndex: "title", ellipsis: true },
    {
      title: "By",
      dataIndex: "created_by",
      width: 150,
      render: (_, r) => r.created_by ?? r.createdBy ?? "—",
    },
    {
      title: "At",
      dataIndex: "created_at",
      width: 140,
      render: (_, r) => {
        const date = r.created_at ?? r.createdAt;
        return dayjs(date).isValid()
          ? dayjs(date).format("YYYY-MM-DD HH:mm")
          : "—";
      },
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
          Admin Dashboard
        </Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                ...cardStyle,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>
                    Lớp học
                  </span>
                }
                value={overview.classCount}
                valueStyle={{ color: "#fff", fontSize: 32, fontWeight: 700 }}
                prefix={<ScheduleOutlined />}
              />
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                Số lớp đang hoạt động
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                ...cardStyle,
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>
                    Môn học
                  </span>
                }
                value={overview.courseCount}
                valueStyle={{ color: "#fff", fontSize: 32, fontWeight: 700 }}
                prefix={<ReadOutlined />}
              />
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                Tổng số môn học
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                ...cardStyle,
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>Bài Thi</span>
                }
                value={overview.examCount}
                valueStyle={{ color: "#fff", fontSize: 32, fontWeight: 700 }}
                prefix={<ExperimentOutlined />}
              />
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                Bài thi khả dụng
              </Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={8}>
            <Card style={cardStyle} bodyStyle={{ padding: 24 }}>
              <Spin spinning={loadingRankings}>
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Title level={5} style={{ margin: 0 }}>
                            Bản xếp hạng đánh giá môn học
                        </Title>
                        <StarOutlined style={{ fontSize: 20, color: "#fadb14" }} />
                    </div>
                    {evaluationRankings.length > 0 ? (
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                            <List
                                itemLayout="horizontal"
                                dataSource={evaluationRankings}
                                renderItem={(item, index) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<Avatar size="small">{index + 1}</Avatar>}
                                            title={courseMap[item.courseId] || `Course ${item.courseId}`}
                                            description={`${item.submissions} reviews`}
                                        />
                                        <Rate allowHalf disabled value={item.avgRating} style={{fontSize: 14}} />
                                    </List.Item>
                                )}
                            />
                        </div>
                    ) : (
                        <Empty description="No evaluation data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                </Space>
              </Spin>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              style={{
                ...cardStyle,
                background: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Title level={5} style={{ margin: 0, color: "#991B1B" }}>
                    Tổng số học sinh
                  </Title>
                  <Avatar
                    size={48}
                    icon={<UserOutlined />}
                    style={{ background: "#DC2626", fontSize: 24 }}
                  />
                </div>
                <Statistic
                  value={overview.studentCount}
                  valueStyle={{
                    color: "#991B1B",
                    fontSize: 36,
                    fontWeight: 700,
                  }}
                />
                <Text
                  type="secondary"
                  style={{ fontSize: 13, color: "#991B1B" }}
                >
                  Tổng số tài khoản học sinh
                </Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              style={{
                ...cardStyle,
                background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Title level={5} style={{ margin: 0, color: "#065F46" }}>
                    Tổng số giáo viên
                  </Title>
                  <Avatar
                    size={48}
                    icon={<TeamOutlined />}
                    style={{ background: "#10B981", fontSize: 24 }}
                  />
                </div>
                <Statistic
                  value={overview.teacherCount}
                  valueStyle={{
                    color: "#065F46",
                    fontSize: 36,
                    fontWeight: 700,
                  }}
                />
                <Text
                  type="secondary"
                  style={{ fontSize: 13, color: "#065F46" }}
                >
                  Tổng số tài khoản giáo viên
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card
              style={{
                ...cardStyle,
                background: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Row justify="space-between" align="middle">
                <Space size={16}>
                  <Avatar
                    size={56}
                    icon={<WalletOutlined />}
                    style={{ background: "#0284C7" }}
                  />
                  <div>
                    <Text style={{ fontSize: 14, color: "#0369A1" }}>
                      Total Revenue
                    </Text>
                    <Title level={3} style={{ margin: 0, color: "#0C4A6E" }}>
                      {VND(overview.revenue)}
                    </Title>
                  </div>
                </Space>
                <Tag
                  color="success"
                  style={{ fontSize: 14, padding: "4px 12px" }}
                >
                  Success Payments:{" "}
                  {
                    allPayments.filter(  // ===== ĐỔI TỪ payments SANG allPayments =====
                      (p) =>
                        (p.status || "").toString().toUpperCase() === "SUCCESS"
                    ).length
                  }
                </Tag>
              </Row>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: "32px 0" }} />
        <Title level={4} style={{ marginBottom: 16 }}>
          Data Management
        </Title>

        <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
          <Tabs
            defaultActiveKey="courses"
            tabBarStyle={{ padding: "0 24px", marginBottom: 0 }}
            items={[
              {
                key: "courses",
                label: (
                  <Space>
                    <ReadOutlined /> Courses ({courses.length})
                  </Space>
                ),
                children: (
                  <div style={{ padding: 24 }}>
                    <Table
                      size="middle"
                      rowKey={(r) => r.courseId ?? r.id ?? r.course_id}
                      columns={coursesCols}
                      dataSource={courses}
                      pagination={{ pageSize: 10, showSizeChanger: false }}
                    />
                  </div>
                ),
              },
              {
                key: "classes",
                label: (
                  <Space>
                    <ScheduleOutlined /> Classes ({classes.length})
                  </Space>
                ),
                children: (
                  <div style={{ padding: 24 }}>
                    <Table
                      size="middle"
                      rowKey={(r) => r.classId ?? r.id ?? r.class_id}
                      columns={classesCols}
                      dataSource={classes}
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                    />
                  </div>
                ),
              },
              {
                key: "exams",
                label: (
                  <Space>
                    <ExperimentOutlined /> Exams ({exams.length})
                  </Space>
                ),
                children: (
                  <div style={{ padding: 24 }}>
                    <Table
                      size="middle"
                      rowKey={(r) => r.examId ?? r.id ?? r.exam_id}
                      columns={examsCols}
                      dataSource={exams}
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                    />
                  </div>
                ),
              },
              {
                key: "lessons",
                label: (
                  <Space>
                    <BookOutlined /> Lessons ({lessons.length})
                  </Space>
                ),
                children: (
                  <div style={{ padding: 24 }}>
                    <Table
                      size="middle"
                      rowKey={(r) => r.lessonId ?? `${r.sessionId}-${r.title}`}
                      columns={lessonsCols}
                      dataSource={lessons}
                      pagination={{
                        pageSize: 15,
                        showSizeChanger: true,
                        showTotal: (t) => `${t} lessons`,
                      }}
                    />
                  </div>
                ),
              },
              {
                key: "payments",
                label: (
                  <Space>
                    <CreditCardOutlined /> Payments ({payments.length})
                  </Space>
                ),
                children: (
                  <div style={{ padding: 24 }}>
                    <Table
                      size="middle"
                      rowKey={(r) => r.payment_id ?? r.id}
                      columns={paymentsCols}
                      dataSource={payments}
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                    />
                  </div>
                ),
              },
              // {
              //   key: "invoices",
              //   label: (
              //     <Space>
              //       <FileTextOutlined /> Invoices ({invoices.length})
              //     </Space>
              //   ),
              //   children: (
              //     <div style={{ padding: 24 }}>
              //       <Table
              //         size="middle"
              //         rowKey={(r) => r.invoice_id ?? r.id}
              //         columns={invoicesCols}
              //         dataSource={invoices}
              //         pagination={{ pageSize: 10, showSizeChanger: true }}
              //       />
              //     </div>
              //   ),
              // },
              // {
              //   key: "coupons",
              //   label: (
              //     <Space>
              //       <Tag color="gold" /> Coupons ({coupons.length})
              //     </Space>
              //   ),
              //   children: (
              //     <div style={{ padding: 24 }}>
              //       <Table
              //         size="middle"
              //         rowKey={(r) => r.coupon_id ?? r.id}
              //         columns={couponsCols}
              //         dataSource={coupons}
              //         pagination={{ pageSize: 10, showSizeChanger: true }}
              //       />
              //     </div>
              //   ),
              // },
              // {
              //   key: "announcements",
              //   label: (
              //     <Space>
              //       <NotificationOutlined /> Announcements (
              //       {announcements.length})
              //     </Space>
              //   ),
              //   children: (
              //     <div style={{ padding: 24 }}>
              //       <Table
              //         size="middle"
              //         rowKey={(r) => r.announcement_id ?? r.id}
              //         columns={announcementsCols}
              //         dataSource={announcements}
              //         pagination={{ pageSize: 10, showSizeChanger: true }}
              //       />
              //     </div>
              //   ),
              // },
            ]}
          />
        </Card>
      </Spin>
    </div>
  );
}
