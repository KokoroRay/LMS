// src/pages/student/homework/HomeworkSection.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Col, Row, Button, Typography, Tag, Space, message, Spin } from "antd";
import { UploadOutlined, ClockCircleOutlined, TrophyOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

import {
  getAssignmentsBySession,
  getMySubmission,
  submitAssignment,
} from "../../services/assignmentService";
import SubmitHomeworkModal from "../../components/modal/SubmitHomeworkModal";
import DOMPurify from "dompurify";
import { selectCurrentUserId } from "../../redux/api/slices/authSlice";

const { Title, Text, Paragraph } = Typography;

const HomeworkSection = ({
  sessionId,
  lessonId,
  classId,
  assignmentId, // assignmentId thật (từ Lesson.jsx)
  onSubmitSuccess, // callback để Lesson.jsx tick hoàn thành + cập nhật sidebar
  courseName: courseNameProp,
  sessionTitle: sessionTitleProp,
}) => {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);
  const [mySubmit, setMySubmit] = useState(null);

  const studentId = useSelector(selectCurrentUserId);

  const fetchAssignments = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const arr = await getAssignmentsBySession(sessionId);
      const list = Array.isArray(arr) ? arr : [];

      // Ưu tiên assignmentId truyền xuống – đúng route /lesson/:courseId/:assignmentId/homework
      const currentAssignmentId = assignmentId || lessonId;

      const pick =
        list.find((a) => String(a.assignmentId) === String(currentAssignmentId)) ||
        list.find(
          (a) =>
            String(a.referenceLessonId || "") === String(currentAssignmentId || "")
        ) ||
        list.find((a) => a.classId === classId) ||
        list[0] ||
        null;

      setAssignments(list);
      setActive(pick || null);

      if (pick?.assignmentId) {
        try {
          const sub = await getMySubmission(pick.assignmentId);
          setMySubmit(sub || null);

          // 🔹 Nếu đã có bài đã nộp => báo cho Lesson.jsx để tick DONE + unlock Next
          if (sub && typeof onSubmitSuccess === "function") {
            onSubmitSuccess(pick.assignmentId);
          }
        } catch {
          setMySubmit(null);
        }
      } else {
        setMySubmit(null);
      }
    } catch (e) {
      console.error(e);
      message.error("Không tải được bài tập.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, lessonId, classId, assignmentId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const deadlineText = useMemo(() => {
    if (!active?.dueDate) return "Chưa có hạn chót";
    const isPast = dayjs(active.dueDate).isBefore(dayjs());
    return (
      <Text type={isPast ? "danger" : undefined} style={{ fontSize: 12 }}>
        {dayjs(active.dueDate).format("DD/MM/YYYY HH:mm")}
      </Text>
    );
  }, [active]);

  // 🔹 NỘP LINK GITHUB – dùng DTO đúng với BE + gọi callback
  const onSubmitLink = async ({ githubUrl }) => {
    if (!active?.assignmentId || !studentId) return;

    const isResubmission = !!mySubmit;

    try {
      // ❗ BE tự lấy student từ MyUserDetails, chỉ cần gửi assignmentId + githubUrl
      const submissionResult = await submitAssignment(active.assignmentId, githubUrl, classId);

      message.success(
        isResubmission ? "Đã nộp lại bài thành công!" : "Đã nộp bài thành công!"
      );
      setOpen(false);

      // Refresh lại bài nộp từ BE
      try {
        const sub = await getMySubmission(active.assignmentId);
        setMySubmit(sub || { githubUrl, submittedAt: new Date().toISOString() });
      } catch {
        setMySubmit({ githubUrl, submittedAt: new Date().toISOString() });
      }

      // 🔹 Báo ngược lên Lesson.jsx: chỉ cần NỘP THÀNH CÔNG là coi như DONE
      if (typeof onSubmitSuccess === "function") {
        onSubmitSuccess(active.assignmentId);
      }
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || "";

      // Trường hợp BE vẫn đang giữ logic "Student already submitted this assignment."
      if (status === 400 && msg.includes("Student already submitted this assignment")) {
        message.info("Bạn đã nộp bài này rồi. Đang tải lại thông tin bài đã nộp...");

        try {
          const sub = await getMySubmission(active.assignmentId);
          setMySubmit(sub || null);

          // 🔹 Nếu đã có bài trong BE rồi thì cũng báo DONE lên Lesson.jsx
          if (sub && typeof onSubmitSuccess === "function") {
            onSubmitSuccess(active.assignmentId);
          }
        } catch (err) {
          console.error("Lỗi khi load lại bài đã nộp:", err);
        }

        setOpen(false);
        return;
      }

      // Các lỗi khác (401, 500, ...)
      message.error(msg || "Nộp bài thất bại");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  if (!active) {
    return (
      <Row className="homework-row">
        <Col span={24}>
          <div className="homework-section">
            <Title level={4}>Bài tập</Title>
            <Text type="secondary">Không có bài tập cho bài học này.</Text>
          </div>
        </Col>
      </Row>
    );
  }

  // 🔹 chuẩn bị dữ liệu hiển thị lên Modal
  const modalCourseName =
    courseNameProp ||
    active.courseName ||
    active.courseTitle ||
    active.subjectTitle ||
    "—";

  const modalSessionTitle =
    sessionTitleProp ||
    active.sessionTitle ||
    active.sessionName ||
    active.lessonTitle ||
    "—";

  return (
    <Row className="homework-row">
      <Col span={24}>
        <div className="homework-section">
          {/* Header */}
          <Space style={{ marginBottom: 12 }} align="center">
            <Title level={3} style={{ margin: 0 }}>
              {active.title}
            </Title>
            <Tag color="gold" icon={<TrophyOutlined />}>
              {active.maxScore ?? 100} điểm
            </Tag>
            <Tag icon={<ClockCircleOutlined />}>Hạn: {deadlineText}</Tag>
            <Tag color={active.allowLate ? "green" : undefined}>
              {active.allowLate ? "Cho phép nộp trễ" : "Không nộp trễ"}
            </Tag>

            {/* Nếu đã có mySubmit => gắn thêm tag ĐÃ NỘP */}
            {mySubmit && <Tag color="green">ĐÃ NỘP</Tag>}
          </Space>

          {/* Mô tả */}
          {active.description ? (
            <div
              className="homework-desc"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(active.description),
              }}
            />
          ) : (
            <Paragraph type="secondary">Không có mô tả.</Paragraph>
          )}

          {/* Thông tin bài nộp của tôi */}
          {mySubmit && (
            <div
              style={{
                margin: "16px 0",
                padding: 12,
                background: "#fafafa",
                borderRadius: 8,
              }}
            >
              <Text strong>Đã nộp:</Text>{" "}
              <a href={mySubmit.githubUrl} target="_blank" rel="noreferrer">
                {mySubmit.githubUrl}
              </a>
              {mySubmit.submittedAt && (
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({dayjs(mySubmit.submittedAt).format("DD/MM/YYYY HH:mm")})
                  {mySubmit.isLate && (
                    <Tag color="red" style={{ marginLeft: 8 }}>
                      Nộp trễ
                    </Tag>
                  )}
                </Text>
              )}

              {mySubmit.feedback && (
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary">
                    Ghi chú từ giáo viên: {mySubmit.feedback}
                  </Text>
                </div>
              )}

              {mySubmit.grade !== null && mySubmit.grade !== undefined && (
                <div style={{ marginTop: 6 }}>
                  <Text
                    strong
                    style={{
                      color: mySubmit.grade > 0 ? "green" : "orange",
                    }}
                  >
                    Điểm: {mySubmit.grade} / {active.maxScore ?? 100}
                  </Text>
                  {mySubmit.gradedByName && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      (Giáo viên: {mySubmit.gradedByName})
                    </Text>
                  )}
                </div>
              )}
            </div>
          )}

          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setOpen(true)}
          >
            {mySubmit ? "Nộp lại" : "Nộp bài"}
          </Button>
        </div>
      </Col>

      <SubmitHomeworkModal
        open={open}
        onCancel={() => setOpen(false)}
        onSubmit={onSubmitLink}
        courseName={modalCourseName}
        sessionTitle={modalSessionTitle}
        defaultGithubUrl={mySubmit?.githubUrl || ""}
      />
    </Row>
  );
};

HomeworkSection.propTypes = {
  sessionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lessonId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  classId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  assignmentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSubmitSuccess: PropTypes.func,
  courseName: PropTypes.string,
  sessionTitle: PropTypes.string,
};

export default HomeworkSection;