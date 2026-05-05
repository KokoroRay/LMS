// src/pages/student/homework/HomeworkSection.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Col, Row, Button, Typography, Tag, Space, message, Spin } from "antd";
import {
  UploadOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import {
  getAssignmentsBySession,
  getMySubmission,
  submitAssignment,
} from "../../services/assignmentService";
import SubmitHomeworkModal from "../../components/modal/SubmitHomeworkModal";
import { FontWeight } from "@cloudinary/url-gen/qualifiers";

const { Title, Text, Paragraph } = Typography;

const HomeworkSection = ({ sessionId, lessonId, classId }) => {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);
  const [mySubmit, setMySubmit] = useState(null);

  const fetchAssignments = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const arr = await getAssignmentsBySession(sessionId);
      const list = Array.isArray(arr) ? arr : [];
      // Chọn bài theo lessonId nếu có:
      const pick =
        list.find(
          (a) => String(a.referenceLessonId || "") === String(lessonId || "")
        ) ||
        list.find((a) => a.classId === classId) ||
        list[0] ||
        null;

      setAssignments(list);
      setActive(pick || null);

      if (pick?.assignmentId) {
        // load bài nộp của mình (nếu BE có)
        try {
          const sub = await getMySubmission(pick.assignmentId);
          setMySubmit(sub || null);
        } catch {
          /* optional */
        }
      } else {
        setMySubmit(null);
      }
    } catch (e) {
      message.error("Không tải được bài tập.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, lessonId, classId]);

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

  const onSubmitLink = async ({ githubUrl, note }) => {
    if (!active?.assignmentId) return;
    try {
      await submitAssignment(active.assignmentId, { githubUrl, note });
      message.success("Đã nộp bài thành công!");
      setOpen(false);
      // refresh submission
      try {
        const sub = await getMySubmission(active.assignmentId);
        setMySubmit(
          sub || { githubUrl, note, submittedAt: new Date().toISOString() }
        );
      } catch {
        setMySubmit({ githubUrl, note, submittedAt: new Date().toISOString() });
      }
    } catch (e) {
      message.error(e?.response?.data?.message || "Nộp bài thất bại");
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
          </Space>

          {/* Description (BE có thể trả HTML hoặc plain text) */}
          {active.description ? (
            <div
              className="homework-desc"
              // Nếu BE trả về HTML đã an toàn. Nếu không, bạn có thể render markdown ở FE.
              dangerouslySetInnerHTML={{ __html: active.description }}
            />
          ) : (
            <Paragraph type="secondary">Không có mô tả.</Paragraph>
          )}

          {/* Thông tin bài nộp của tôi (nếu có) */}
          {/* {mySubmit && (
            <div style={{ margin: "16px 0", padding: 12, background: "#fafafa", borderRadius: 8 }}>
              <Text strong>Đã nộp:</Text>{" "}
              <a href={mySubmit.githubUrl} target="_blank" rel="noreferrer">{mySubmit.githubUrl}</a>
              {mySubmit.submittedAt && (
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({dayjs(mySubmit.submittedAt).format("DD/MM/YYYY HH:mm")})
                </Text>
              )}
              {mySubmit.note && (
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary">Ghi chú: {mySubmit.note}</Text>
                </div>
              )}
            </div>
          )} */}

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
        courseName={active.courseName || "—"}
        lessonTitle={active.referenceLessonTitle || active.lessonTitle || "—"}
        defaultGithubUrl={mySubmit?.githubUrl || ""}
      />
    </Row>
  );
};

// HomeworkSection.propTypes = {
//   sessionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
//   lessonId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
//   classId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
// };

// HomeworkSection.defaultProps = {
//   lessonId: null,
//   classId: null,
// };

export default HomeworkSection;
