// src/pages/instructor/assignment/AssignmentGradePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Collapse,
  List,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Empty,
  InputNumber,
  Space,
  Select,
} from "antd";
import dayjs from "dayjs";

import {
  getSubmissionsByAssignment,
  gradeSubmission,
  getAssignmentsBySession,
} from "../../../services/assignmentService";
import { getMyCourses } from "../../../services/subjectService";
import { listSessionsByCourse } from "../../../services/sessionService";
import { useSelector } from "react-redux";
import { selectCurrentUserId } from "../../../redux/api/slices/authSlice";
import {
  BookOutlined,
  CalendarOutlined,
  ContainerOutlined,
  EditOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const AssignmentGradePage = () => {
  // Data states
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState({}); // { [courseId]: [...] }
  const [assignments, setAssignments] = useState({}); // { [sessionId]: [...] }
  const [submissions, setSubmissions] = useState([]);
  const [allAssignmentsForSelectedCourse, setAllAssignmentsForSelectedCourse] =
    useState([]); // New state to hold flattened assignments for selected course

  // Stats bài tập: { [assignmentId]: { total, graded, ungraded } }
  const [assignmentStats, setAssignmentStats] = useState({});

  // Loading states
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState({}); // { [courseId]: boolean }
  const [loadingAssignments, setLoadingAssignments] = useState({}); // { [sessionId]: boolean }
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingSelectedCourse, setLoadingSelectedCourse] = useState(false);

  // Modal states
  const [submissionsModal, setSubmissionsModal] = useState({
    open: false,
    assignment: null,
  });
  const [gradeModal, setGradeModal] = useState({ open: false, record: null });

  // Course đang chọn
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const teacherId = useSelector(selectCurrentUserId);

  /* -------------------- Helpers -------------------- */

  // Giữ lại lần nộp mới nhất cho mỗi học sinh
  const keepLatestSubmissionPerStudent = (list = []) => {
    const map = {};

    list.forEach((item) => {
      const sid = item.studentId;
      if (!sid) return;

      const existing = map[sid];

      if (!existing) {
        map[sid] = item;
      } else {
        const existingTime = existing.submittedAt
          ? dayjs(existing.submittedAt)
          : null;
        const currentTime = item.submittedAt
          ? dayjs(item.submittedAt)
          : null;

        // Nếu bài mới có submittedAt muộn hơn thì thay
        if (
          !existingTime ||
          (currentTime && currentTime.isAfter(existingTime))
        ) {
          map[sid] = item;
        }
      }
    });

    // Trả về array chỉ gồm bản mới nhất của từng học sinh
    return Object.values(map);
  };

  // Tính và set thống kê cho 1 assignment
  const setStatsForAssignment = (assignmentId, submissionList) => {
    const latestOnly = keepLatestSubmissionPerStudent(submissionList || []);
    const total = latestOnly.length;
    const graded = latestOnly.filter(
      (s) => s.grade !== null && s.grade !== undefined
    ).length;
    const ungraded = total - graded;
    setAssignmentStats((prev) => ({
      ...prev,
      [assignmentId]: { total, graded, ungraded },
    }));
  };

  // Fetch stats từ server cho 1 assignment
  const refreshStatsFromServer = async (assignmentId) => {
    try {
      const list = await getSubmissionsByAssignment(assignmentId);
      const rawList = Array.isArray(list) ? list : [];
      setStatsForAssignment(assignmentId, rawList);
    } catch (err) {
      console.error("Không thể lấy thống kê cho assignment", assignmentId, err);
    }
  };

  /* -------------------- Data Fetching -------------------- */

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const list = await getMyCourses();
      setCourses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách khóa học.");
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCourseToggle = useCallback(
    async (courseId) => {
      if (!courseId) return [];

      // Nếu đã có trong state thì trả lại luôn
      if (sessions[courseId]) return sessions[courseId];

      setLoadingSessions((prev) => ({ ...prev, [courseId]: true }));
      try {
        const data = await listSessionsByCourse(courseId);
        const list = data || [];
        setSessions((prev) => ({ ...prev, [courseId]: list }));
        return list;
      } catch (err) {
        console.error(err);
        message.error(`Không thể tải các chương cho khóa học ${courseId}.`);
        return [];
      } finally {
        setLoadingSessions((prev) => ({ ...prev, [courseId]: false }));
      }
    },
    [sessions]
  );

  const handleSessionToggle = useCallback(
    async (sessionId) => {
      if (!sessionId) return [];
      // Nếu đã có assignment cho session này rồi thì thôi
      if (assignments[sessionId]) return assignments[sessionId];

      setLoadingAssignments((prev) => ({ ...prev, [sessionId]: true }));
      try {
        const data = await getAssignmentsBySession(sessionId);
        const list = data || [];
        setAssignments((prev) => ({ ...prev, [sessionId]: list }));
        return list;
      } catch (err) {
        console.error(err);
        message.error(`Không thể tải bài tập cho chương ${sessionId}.`);
        return [];
      } finally {
        setLoadingAssignments((prev) => ({ ...prev, [sessionId]: false }));
      }
    },
    [assignments]
  );

  // Khi chọn 1 môn: load sessions, assignments và thống kê bài đã/ chưa chấm
  const handleCourseChange = useCallback(
    async (value) => {
      setSelectedCourseId(value || null);
      setAllAssignmentsForSelectedCourse([]); // Clear previous assignments

      if (!value) return;

      setLoadingSelectedCourse(true);
      try {
        const sessionList = await handleCourseToggle(value);
        const currentCourse = courses.find((c) => c.courseId === value);
        const courseTitle = currentCourse ? currentCourse.title : "N/A";

        let collectedAssignments = [];
        let updatedAssignmentsBySession = {};

        // Fetch assignments for all sessions concurrently and collect them
        const assignmentsPromises = sessionList.map(async (s) => {
          const assignmentsForThisSession = await getAssignmentsBySession(
            s.sessionId
          ); // Directly call API
          updatedAssignmentsBySession[s.sessionId] =
            assignmentsForThisSession || [];
          (assignmentsForThisSession || []).forEach((a) =>
            collectedAssignments.push({
              ...a,
              sessionTitle: s.title,
              courseTitle: courseTitle,
            })
          );
        });
        await Promise.all(assignmentsPromises);

        setAssignments((prev) => ({ ...prev, ...updatedAssignmentsBySession })); // Update assignments state globally
        setAllAssignmentsForSelectedCourse(collectedAssignments); // Store flattened list

        // Lấy thống kê bài nộp cho từng assignment (đã chấm / chưa chấm)
        const statsEntries = await Promise.all(
          collectedAssignments.map(async (a) => {
            try {
              const list = await getSubmissionsByAssignment(a.assignmentId);
              const rawList = Array.isArray(list) ? list : [];
              const latestOnly = keepLatestSubmissionPerStudent(rawList);
              const total = latestOnly.length;
              const graded = latestOnly.filter(
                (s) => s.grade !== null && s.grade !== undefined
              ).length;
              const ungraded = total - graded;
              return [a.assignmentId, { total, graded, ungraded }];
            } catch (err) {
              console.error("Err stats assignment", a.assignmentId, err);
              return [a.assignmentId, { total: 0, graded: 0, ungraded: 0 }];
            }
          })
        );

        const statsMap = {};
        statsEntries.forEach(([id, stat]) => {
          statsMap[id] = stat;
        });
        setAssignmentStats((prev) => ({ ...prev, ...statsMap }));
      } finally {
        setLoadingSelectedCourse(false);
      }
    },
    [handleCourseToggle, courses, keepLatestSubmissionPerStudent]
  );

  /* -------------------- Modal: submissions -------------------- */

  const openSubmissionsModal = async (assignment) => {
    setSubmissionsModal({ open: true, assignment });
    setLoadingSubmissions(true);
    try {
      const list = await getSubmissionsByAssignment(assignment.assignmentId);

      const rawList = Array.isArray(list) ? list : [];
      const latestOnly = keepLatestSubmissionPerStudent(rawList);

      // sort theo thời gian nộp mới nhất
      latestOnly.sort((a, b) => {
        const ta = a.submittedAt ? dayjs(a.submittedAt).valueOf() : 0;
        const tb = b.submittedAt ? dayjs(b.submittedAt).valueOf() : 0;
        return tb - ta; // mới nhất lên trên
      });

      setSubmissions(latestOnly);
      // update stats cho assignment này
      setStatsForAssignment(assignment.assignmentId, rawList);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách bài nộp.");
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const closeSubmissionsModal = () => {
    setSubmissionsModal({ open: false, assignment: null });
    setSubmissions([]);
  };

  /* -------------------- Modal: grade -------------------- */

  const openGradeModal = (record) => {
    setGradeModal({ open: true, record });
  };

  const closeGradeModal = () => {
    setGradeModal({ open: false, record: null });
  };

  const handleGradeSubmit = async (values) => {
    const record = gradeModal.record;
    if (!record) return;

    try {
      await gradeSubmission(record.submissionId, {
        grade: values.grade,
        feedback: values.feedback || "",
      });

      message.success("Chấm điểm thành công.");
      closeGradeModal();
      // refresh danh sách bài nộp trong modal
      if (submissionsModal.assignment) {
        await openSubmissionsModal(submissionsModal.assignment);
      }
      // refresh thống kê bài tập tương ứng
      if (submissionsModal.assignment?.assignmentId) {
        await refreshStatsFromServer(submissionsModal.assignment.assignmentId);
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi chấm điểm, vui lòng thử lại.");
    }
  };

  /* -------------------- Render helpers -------------------- */

  const renderAssignmentStatusTag = (assignmentId) => {
    const stat = assignmentStats[assignmentId];
    if (!stat) {
      return <Tag>Chưa có dữ liệu</Tag>;
    }

    if (stat.total === 0) {
      return <Tag>Chưa có bài nộp</Tag>;
    }

    if (stat.ungraded > 0) {
      return (
        <Tag color="red">
          Còn {stat.ungraded} bài chưa chấm / {stat.total} bài
        </Tag>
      );
    }

    return (
      <Tag color="green">
        Đã chấm xong ({stat.total} bài)
      </Tag>
    );
  };

  const submissionColumns = [
    {
      title: "Học sinh",
      dataIndex: "studentName",
      key: "studentName",
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: "Link GitHub",
      dataIndex: "githubUrl",
      key: "githubUrl",
      render: (url) =>
        url ? (
          <a href={url} target="_blank" rel="noreferrer">
            {url}
          </a>
        ) : (
          <Text type="secondary">Chưa có</Text>
        ),
    },
    {
      title: "Thời gian nộp",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (t) =>
        t ? dayjs(t).format("DD/MM/YYYY HH:mm") : <Text type="secondary">—</Text>,
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, r) =>
        r.isLate ? (
          <Tag color="red">Nộp trễ ({r.lateMinutes} phút)</Tag>
        ) : (
          <Tag color="green">Đúng hạn</Tag>
        ),
    },
    {
      title: "Điểm",
      dataIndex: "grade",
      key: "grade",
      render: (g) =>
        g !== null && g !== undefined ? (
          <Text strong style={{ color: "green" }}>
            {g}
          </Text>
        ) : (
          <Tag color="orange">Chưa chấm</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, r) => (
        <Button
          icon={<EditOutlined />}
          type="primary"
          onClick={() => openGradeModal(r)}
        >
          {r.grade == null ? "Chấm điểm" : "Sửa điểm"}
        </Button>
      ),
    },
  ];

  /* -------------------- JSX -------------------- */

  // Tính tổng overview cho course đang chọn
  const overview = allAssignmentsForSelectedCourse.reduce(
    (acc, assignment) => {
      const s = assignmentStats[assignment.assignmentId];
      // Only count assignments that actually have stats
      if (s) {
        acc.totalAssignments += 1;
        if (s.ungraded > 0) acc.assignmentsHasUngraded += 1;
        if (s.ungraded === 0 && s.total > 0) acc.assignmentsFullyGraded += 1;
      }
      return acc;
    },
    {
      totalAssignments: 0,
      assignmentsHasUngraded: 0,
      assignmentsFullyGraded: 0,
    }
  );

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 16 }}>
        Chấm điểm bài tập
      </Title>

      {/* Chọn môn + search */}
      <Spin spinning={loadingCourses}>
        {courses.length > 0 ? (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <Text strong>Chọn môn để chấm bài:</Text>
              <Select
                allowClear
                showSearch
                placeholder="Chọn môn học"
                style={{ width: "100%", marginTop: 8 }}
                value={selectedCourseId}
                onChange={handleCourseChange}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {courses.map((course) => (
                  <Option key={course.courseId} value={course.courseId}>
                    {course.title}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Overview bài tập đã/ chưa chấm của môn đang chọn */}
            {selectedCourseId && (
              <Space size="middle" wrap>
                <Tag color="blue">
                  Tổng số bài tập: {overview.totalAssignments}
                </Tag>
                <Tag color="red">
                  Bài tập còn bài chưa chấm: {overview.assignmentsHasUngraded}
                </Tag>
                <Tag color="green">
                  Bài tập đã chấm xong: {overview.assignmentsFullyGraded}
                </Tag>
              </Space>
            )}

            {/* Danh sách bài tập của môn đang chọn (hiển thị phẳng) */}
            {selectedCourseId ? (
              <Spin spinning={loadingSelectedCourse}>
                <List
                  itemLayout="vertical"
                  dataSource={allAssignmentsForSelectedCourse}
                  renderItem={(item) => (
                    <List.Item
                      key={item.assignmentId}
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <div style={{ width: "100%" }}>
                        {/* Tiêu đề & Tag session */}
                        <div style={{ marginBottom: 12 }}>
                          <Space>
                            <ContainerOutlined style={{ fontSize: 20 }} />
                            <Text strong style={{ fontSize: 16 }}>
                              {item.title}
                            </Text>
                            <Tag color="blue">{item.sessionTitle}</Tag>
                          </Space>
                        </div>

                        {/* Mô tả */}
                        <div
                          className="ant-list-item-meta-description-html"
                          style={{ marginBottom: 24, color: "rgba(0, 0, 0, 0.45)" }}
                          dangerouslySetInnerHTML={{
                            __html: item.description || "Chưa có mô tả.",
                          }}
                        />

                        {/* Footer: Hạn chót (Trái) - Trạng thái & Button (Phải) */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          {/* Mũi tên chỉ: Hạn chót nằm góc dưới trái */}
                          <Text type="secondary">
                            Hạn chót:{" "}
                            {item.dueDate
                              ? dayjs(item.dueDate).format("DD/MM/YYYY HH:mm")
                              : "—"}
                          </Text>

                          {/* Ô đen trong hình: Trạng thái & Nút nằm bên phải */}
                          <Space>
                            {renderAssignmentStatusTag(item.assignmentId)}
                            <Button
                              type="primary"
                              onClick={() => openSubmissionsModal(item)}
                            >
                              Xem bài nộp
                            </Button>
                          </Space>
                        </div>
                      </div>
                    </List.Item>
                  )}
                  locale={{
                    emptyText: <Empty description="Không có bài tập phù hợp." />,
                  }}
                />
              </Spin>
            ) : (
              <Empty description="Hãy chọn một môn để xem danh sách bài tập." />
            )}
          </Space>
        ) : (
          !loadingCourses && (
            <Empty description="Không tìm thấy khóa học nào." />
          )
        )}
      </Spin>

      {/* Modal danh sách bài nộp */}
      <Modal
        open={submissionsModal.open}
        title={`Bài nộp cho: ${submissionsModal.assignment?.title || ""}`}
        onCancel={closeSubmissionsModal}
        footer={[
          <Button key="back" onClick={closeSubmissionsModal}>
            Đóng
          </Button>,
        ]}
        width={1000}
        destroyOnClose
      >
        {submissionsModal.assignment &&
          assignmentStats[submissionsModal.assignment.assignmentId] && (
            <Space direction="vertical" style={{ marginBottom: 16 }}>
              <Text strong>Thống kê bài nộp:</Text>
              <Space>
                <Tag color="blue">
                  Tổng số bài nộp:{" "}
                  {assignmentStats[submissionsModal.assignment.assignmentId].total}
                </Tag>
                <Tag color="green">
                  Đã chấm:{" "}
                  {assignmentStats[submissionsModal.assignment.assignmentId].graded}
                </Tag>
                <Tag color="red">
                  Chưa chấm:{" "}
                  {assignmentStats[submissionsModal.assignment.assignmentId].ungraded}
                </Tag>
              </Space>
            </Space>
          )}
        <Table
          loading={loadingSubmissions}
          columns={submissionColumns}
          dataSource={submissions}
          rowKey="submissionId"
          pagination={{ pageSize: 5 }}
        />
      </Modal>

      {/* Modal chấm điểm */}
      {gradeModal.open && (
        <Modal
          open={gradeModal.open}
          title={`Chấm điểm - ${gradeModal.record?.studentName}`}
          onCancel={closeGradeModal}
          footer={null}
          destroyOnClose
        >
          <Form
            layout="vertical"
            initialValues={{
              grade: gradeModal.record?.grade ?? null,
              feedback: gradeModal.record?.feedback ?? "",
            }}
            onFinish={handleGradeSubmit}
          >
            <Form.Item
              label="Điểm"
              name="grade"
              rules={[
                { required: true, message: "Vui lòng nhập điểm" },
                {
                  type: "number",
                  min: 0,
                  max: 100,
                  message: "Điểm từ 0 - 100",
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Nhận xét" name="feedback">
              <Input.TextArea
                rows={3}
                placeholder="Nhận xét cho học sinh (không bắt buộc)"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              Lưu điểm
            </Button>
          </Form>
        </Modal>
      )}
    </Card>
  );
};

export default AssignmentGradePage;