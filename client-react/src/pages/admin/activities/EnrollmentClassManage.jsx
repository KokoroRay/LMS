// src/pages/instructor/class/ClassStudentsPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Row,
  Col,
  Space,
  Typography,
  Button,
  Select,
  Input,
  Table,
  Tag,
  Popconfirm,
  message,
  Modal,
  Form,
  Progress,
  Spin,
  Checkbox,
} from "antd";
import debounce from "lodash.debounce";

import { fetchAllClassAPI } from "../../../services/classService";
import {
  getStudentsByClass,
  addStudentToClass,
  removeStudentFromClass,
  updateStudentProgress,
} from "../../../services/enrollmentService";
import { searchStudents as searchStudentsAPI } from "../../../services/studentService";
import eventBus from "../../../utils/eventBus";

import { fetchCourseDetailAPI } from "../../../services/subjectService";
import progressService from "../../../services/progressService";
import {
  getAssignmentsBySession,
  getMySubmission,
} from "../../../services/assignmentService";
import { listQuestionsByLesson } from "../../../services/lessonQuestionService";

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE", color: "blue" },
  { value: "COMPLETED", label: "COMPLETED", color: "green" },
  { value: "CANCELLED", label: "CANCELLED", color: "red" },
];

const ensureArray = (x) => (Array.isArray(x) ? x : []);

// --- Progress Calculation Logic (adapted from LessonProgressPage) ---
const WORK_ITEM_TYPES = {
  VIDEO: "video",
  READINGS: "readings",
  HOMEWORK: "homework",
  QUIZ: "quiz",
};

const getLessonType = (l) => {
  const t = (l?.lessonType || "").toLowerCase();
  if (t && Object.values(WORK_ITEM_TYPES).includes(t)) return t;
  if (l?.videoUrl) return WORK_ITEM_TYPES.VIDEO;
  return WORK_ITEM_TYPES.READINGS;
};
// --- End of Progress Calculation Logic ---

export default function ClassStudentsPage() {
  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState({});

  // State for overall progress calculation
  const [progressMap, setProgressMap] = useState({});

  const [addOpen, setAddOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [adding, setAdding] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [stuLoading, setStuLoading] = useState(false);
  const [stuPage, setStuPage] = useState(1);
  const [stuSize, setStuSize] = useState(10);
  const [stuTotal, setStuTotal] = useState(0);
  const [stuKeyword, setStuKeyword] = useState("");
  const [stuRows, setStuRows] = useState([]);
  const [stuSelectedKeys, setStuSelectedKeys] = useState([]);
  const [hideInCurrentClass, setHideInCurrentClass] = useState(true);
  const [onlyNoClass, setOnlyNoClass] = useState(false);
  const [excludeStudentsInOtherActiveClasses, setExcludeStudentsInOtherActiveClasses] = useState(false);

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetchAllClassAPI();
      const list = ensureArray(res?.data?.data || res?.items);
      setClasses(list);
      if (!activeClassId && list.length) {
        setActiveClassId(list[0].classId ?? list[0].id);
      }
    } catch {
      message.error("Không tải được danh sách lớp.");
    }
  }, [activeClassId]);

  const fetchStudentOverallProgress = useCallback(async (studentId) => {
    try {
      // NOTE: The following service calls are placeholders and need to be implemented in the backend.
      // They need to fetch data for a *specific studentId*.

      // 1. Get progress for a specific student
      // HYPOTHETICAL SERVICE: Should accept studentId
      const userProgressList = await progressService.getUserProgress(); // Placeholder

      if (!userProgressList || userProgressList.length === 0) {
        return 0;
      }

      const courses = userProgressList.reduce((acc, progress) => {
        if (progress.courseId) {
          if (!acc[progress.courseId]) {
            acc[progress.courseId] = {
              courseId: progress.courseId,
              title: progress.courseTitle,
            };
          }
        }
        return acc;
      }, {});

      const progressMap = userProgressList.reduce((acc, progress) => {
        acc[progress.lessonId] = progress;
        return acc;
      }, {});

      const coursesWithProgress = await Promise.all(
        Object.values(courses).map(async (course) => {
          try {
            const courseDetails = await fetchCourseDetailAPI(course.courseId);
            const courseSections = Array.isArray(courseDetails)
              ? courseDetails
              : courseDetails?.sessions || [];
            
            const sectionsWithDetails = await Promise.all(
              courseSections.map(async (session) => {
                const lessonsWithQuiz = await Promise.all(
                  (session.lessons || []).map(async (lesson) => {
                    if (!Array.isArray(lesson.quizzes)) {
                      try {
                        const questions = await listQuestionsByLesson(lesson.lessonId);
                        return { ...lesson, quizzes: Array.isArray(questions) ? questions : [] };
                      } catch { return { ...lesson, quizzes: [] }; }
                    }
                    return lesson;
                  })
                );
                // HYPOTHETICAL SERVICE: Should accept studentId
                const assignments = await getAssignmentsBySession(session.sessionId);
                return { ...session, lessons: lessonsWithQuiz, assignments };
              })
            );

            const flatWorkItems = sectionsWithDetails.flatMap((session) => {
              return [
                ...(session?.lessons || []).flatMap(l => [
                  { key: `${l.lessonId}-content`, type: getLessonType(l), lessonId: l.lessonId },
                  ...(l.quizzes?.length > 0 ? [{ key: `${l.lessonId}-quiz`, type: 'quiz', lessonId: l.lessonId }] : [])
                ]),
                ...(session?.assignments || []).map(a => ({ key: a.assignmentId, type: 'homework', assignmentId: a.assignmentId }))
              ];
            });

            const allAssignmentIds = flatWorkItems.filter(item => item.type === 'homework').map(item => item.assignmentId);
            const submissionChecks = allAssignmentIds.map(async (assignmentId) => {
              try {
                // HYPOTHETICAL SERVICE: Should accept studentId
                const submission = await getMySubmission(assignmentId);
                return submission ? String(assignmentId) : null;
              } catch { return null; }
            });

            const submittedAssignmentIds = (await Promise.all(submissionChecks)).filter(Boolean);
            
            const completedFromProgress = Object.values(progressMap)
              .filter(p => p.isCompleted && p.courseId === course.courseId)
              .map(p => p.lessonId);

            let completedCount = 0;
            flatWorkItems.forEach(item => {
              if ((item.type === 'video' || item.type === 'readings' || item.type === 'quiz') && completedFromProgress.includes(item.lessonId)) {
                completedCount++;
              } else if (item.type === 'homework' && submittedAssignmentIds.includes(String(item.assignmentId))) {
                completedCount++;
              }
            });

            const totalWorkItems = flatWorkItems.length;
            return totalWorkItems > 0 ? (completedCount / totalWorkItems) * 100 : 0;
          } catch {
            return 0;
          }
        })
      );
      
      if (coursesWithProgress.length === 0) return 0;
      const totalProgress = coursesWithProgress.reduce((sum, progress) => sum + progress, 0);
      return totalProgress / coursesWithProgress.length;

    } catch (error) {
      console.error(`Failed to fetch progress for student ${studentId}`, error);
      return -1; // Indicate error
    }
  }, []);

  const loadStudents = useCallback(async (classId) => {
    if (!classId) return;
    setLoading(true);
    setRows([]);
    setProgressMap({});
    try {
      const list = await getStudentsByClass(classId);
      const studentRows = ensureArray(list);
      setRows(studentRows);
      setEdits({});
      
      // Asynchronously fetch overall progress for each student
      studentRows.forEach((student) => {
        setProgressMap(prev => ({ ...prev, [student.studentId]: { loading: true, percent: 0 } }));
        fetchStudentOverallProgress(student.studentId).then(percent => {
          setProgressMap(prev => ({ ...prev, [student.studentId]: { loading: false, percent } }));
        });
      });

    } catch {
      message.error("Không tải được danh sách học viên.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchStudentOverallProgress]);

  useEffect(() => {
    fetchClasses();
    const handleClassUpdate = () => fetchClasses();
    eventBus.on("classes-updated", handleClassUpdate);
    return () => eventBus.remove("classes-updated", handleClassUpdate);
  }, [fetchClasses]);

  useEffect(() => {
    if (activeClassId) loadStudents(activeClassId);
  }, [activeClassId, loadStudents]);

  const loadStudentPool = useCallback(
    async (
      keyword = stuKeyword,
      page = stuPage,
      size = stuSize,
      hideInClass = hideInCurrentClass,
      onlyNo = onlyNoClass,
      excludeOthers = excludeStudentsInOtherActiveClasses
    ) => {
      if (!pickerOpen) return;
      setStuLoading(true);
      try {
        const { items, total } = await searchStudentsAPI({ page, size, keyword: keyword.trim(), excludeClassId: hideInClass ? activeClassId : undefined, onlyNoClass: onlyNo, excludeStudentsInOtherActiveClasses: excludeOthers });
        setStuRows(ensureArray(items));
        setStuTotal(total);
      } catch (e) {
        message.error("Không tải được danh sách học viên.");
        setStuRows([]); setStuTotal(0);
      } finally {
        setStuLoading(false);
      }
    },
    [pickerOpen, activeClassId, stuKeyword, stuPage, stuSize, hideInCurrentClass, onlyNoClass, excludeStudentsInOtherActiveClasses]
  );
  
  const debouncedSearchStudents = useMemo(() => debounce((keyword) => {
    setStuPage(1);
    loadStudentPool(keyword, 1, stuSize, hideInCurrentClass, onlyNoClass, excludeStudentsInOtherActiveClasses);
  }, 350), [loadStudentPool, stuSize, hideInCurrentClass, onlyNoClass, excludeStudentsInOtherActiveClasses]);

  useEffect(() => {
    return () => debouncedSearchStudents.cancel?.();
  }, [debouncedSearchStudents]);

  useEffect(() => {
    if (pickerOpen) {
      loadStudentPool(stuKeyword, stuPage, stuSize, hideInCurrentClass, onlyNoClass, excludeStudentsInOtherActiveClasses);
    }
  }, [pickerOpen, stuPage, stuSize, hideInCurrentClass, onlyNoClass, loadStudentPool, stuKeyword, excludeStudentsInOtherActiveClasses]);

  const handleKeywordChange = (e) => {
    const keyword = e.target.value;
    setStuKeyword(keyword);
    debouncedSearchStudents(keyword);
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => String(r.studentId).includes(q) || (r.studentName || "").toLowerCase().includes(q));
  }, [rows, search]);

  const onChangeStatus = useCallback((studentId, status) => {
    const original = rows.find((r) => r.studentId === studentId);
    const dirty = status !== original?.status;
    setEdits((prev) => ({ ...prev, [studentId]: { status, dirty } }));
  }, [rows]);

  const onSaveRow = useCallback(async (studentId) => {
    if (!activeClassId) return;
    const original = rows.find((r) => r.studentId === studentId);
    const status = edits[studentId]?.status ?? original?.status ?? "ACTIVE";
    try {
      // Progress is no longer manually updated, only status
      await updateStudentProgress(activeClassId, studentId, { status });
      message.success("Cập nhật trạng thái thành công.");
      await loadStudents(activeClassId);
    } catch {
      message.error("Cập nhật thất bại.");
    }
  }, [activeClassId, rows, edits, loadStudents]);

  const onDeleteRow = useCallback(async (studentId) => {
    if (!activeClassId) return;
    try {
      await removeStudentFromClass(activeClassId, studentId);
      message.success("Đã xoá học viên.");
      await loadStudents(activeClassId);
    } catch {
      message.error("Xoá thất bại.");
    }
  }, [activeClassId, loadStudents]);

  const onAddSubmit = useCallback(async (vals) => {
    if (!activeClassId) return;
    const studentId = Number(vals.studentId);
    try {
      setAdding(true);
      await addStudentToClass(activeClassId, studentId);
      message.success("Thêm học viên thành công.");
      setAddOpen(false);
      addForm.resetFields();
      await loadStudents(activeClassId);
    } catch {
      message.error("Thêm học viên thất bại.");
    } finally {
      setAdding(false);
    }
  }, [activeClassId, loadStudents, addForm]);

  const onPickerConfirm = useCallback(async () => {
    if (!activeClassId || stuSelectedKeys.length === 0) return;
    try {
      let addedCount = 0;
      for (const id of stuSelectedKeys) {
        await addStudentToClass(activeClassId, id);
        addedCount++;
      }
      message.success(`Đã thêm ${addedCount} học viên.`);
      setStuSelectedKeys([]);
      loadStudents(activeClassId);
      setPickerOpen(false);
    } catch (e) {
      message.error("Thêm học viên thất bại. Có thể học viên đã tồn tại.");
    }
  }, [activeClassId, stuSelectedKeys, loadStudents]);

  const columns = useMemo(() => [
     { 
      title: "STT", 
      width: 80, 
      align: "center",
      render: (_, __, index) => (tablePage - 1) * tablePageSize + index + 1
    },
    { title: "Tên học viên", dataIndex: "studentName" },
    // {
    //   title: "Tiến độ tổng thể (%)",
    //   key: "overallProgress",
    //   render: (_, r) => {
    //     const progressInfo = progressMap[r.studentId];
    //     if (progressInfo?.loading) return <Spin size="small" />;
    //     if (progressInfo?.percent === -1) return <Text type="danger">Lỗi</Text>;
    //     return (
    //       <Progress
    //         percent={Math.round(progressInfo?.percent ?? 0)}
    //         size="small"
    //       />
    //     );
    //   },
    // },
    {
      title: "Trạng thái (lớp)",
      render: (_, r) => (
        <Select
          value={edits[r.studentId]?.status ?? r.status ?? "ACTIVE"}
          onChange={(val) => onChangeStatus(r.studentId, val)}
          options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
        />
      ),
    },
    {
      title: "Hiển thị",
      render: (_, r) => {
        const status = edits[r.studentId]?.status ?? r.status ?? "ACTIVE";
        const meta = STATUS_OPTIONS.find((s) => s.value === status);
        return <Tag color={meta?.color}>{status}</Tag>;
      },
},
    {
      title: "Thao tác",
      render: (_, r) => {
        const dirty = !!edits[r.studentId]?.dirty;
        return (
          <Space>
            <Button type="primary" disabled={!dirty} onClick={() => onSaveRow(r.studentId)}>
              Lưu
            </Button>
            <Popconfirm title="Xoá học viên?" onConfirm={() => onDeleteRow(r.studentId)}>
              <Button danger>Xoá</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ], [edits, onChangeStatus, onSaveRow, onDeleteRow, progressMap]);

  const stuColumns = [
    { title: "User ID", dataIndex: "userId", width: 80 },
    { title: "MSSV", dataIndex: "studentCode", width: 100 },
    { title: "Họ tên", render: (_, r) => r.fullName || "—" },
    { title: "Email", dataIndex: "email" },
    { title: "Lớp", render: (_, r) => r.className || <Text type="secondary">Chưa có</Text> },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Title level={3}>Quản lý học viên trong lớp</Title>

      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={12}>
          <Select style={{ width: "100%" }} value={activeClassId ?? undefined} onChange={setActiveClassId} placeholder="Chọn lớp">
            {classes.map((c) => {
              const id = c.classId ?? c.id;
              const name = c.className ?? c.name;
              return <Option key={id} value={id}>{name}</Option>;
            })}
          </Select>
        </Col>
        <Col span={12}>
          <Input placeholder="Tìm học viên..." value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
        </Col>
      </Row>

      <Space style={{ marginBottom: 12 }}>
        <Button onClick={() => loadStudents(activeClassId)} loading={loading}>
          Làm mới
        </Button>
        <Button type="primary" onClick={() => setAddOpen(true)}>
          Thêm theo ID
        </Button>
        <Button onClick={() => setPickerOpen(true)}>Chọn từ danh sách</Button>
      </Space>

      <Table
        rowKey="studentId"
        columns={columns}
        dataSource={filteredRows}
        loading={loading}
        pagination={{
          current: tablePage,
          pageSize: tablePageSize,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          onChange: (p, ps) => { setTablePage(p); setTablePageSize(ps); }
        }}
        onChange={(pagination) => {
          // safety: keep local state in sync if user interacts via sorter/filters/etc.
          setTablePage(pagination.current || 1);
          setTablePageSize(pagination.pageSize || 10);
        }}
      />

      <Modal open={addOpen} title="Thêm học viên theo ID" onCancel={() => { setAddOpen(false); addForm.resetFields(); }} footer={null}>
        <Form form={addForm} onFinish={onAddSubmit} layout="vertical">
          <Form.Item name="studentId" label="Student ID" rules={[{ required: true, message: "Vui lòng nhập Student ID" }, { validator: (_, v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Promise.resolve() : Promise.reject("ID phải là số nguyên dương")) }]}>
            <Input placeholder="VD: 101" />
          </Form.Item>
          <Space style={{ display: "flex", justifyContent: "end" }}>
            <Button onClick={() => setAddOpen(false)}>Huỷ</Button>
            <Button type="primary" htmlType="submit" loading={adding}>Thêm</Button>
          </Space>
        </Form>
      </Modal>

      <Modal open={pickerOpen} title="Chọn học viên" onCancel={() => { setPickerOpen(false); setStuSelectedKeys([]); }} onOk={onPickerConfirm} okText={`Thêm (${stuSelectedKeys.length})`} okButtonProps={{ disabled: stuSelectedKeys.length === 0 }} width={900}>
        <Space style={{ marginBottom: 8 }}>
          <Input placeholder="Nhập tên, MSSV hoặc email" onChange={handleKeywordChange} value={stuKeyword} allowClear />
          <Checkbox checked={hideInCurrentClass} onChange={(e) => setHideInCurrentClass(e.target.checked)}>Ẩn đã có trong lớp này</Checkbox>
          <Checkbox checked={onlyNoClass} onChange={(e) => setOnlyNoClass(e.target.checked)}>Chỉ người chưa có lớp</Checkbox>
          <Checkbox checked={excludeStudentsInOtherActiveClasses} onChange={(e) => setExcludeStudentsInOtherActiveClasses(e.target.checked)}>Chỉ học viên không có lớp khác</Checkbox>
        </Space>

        <Table rowKey={(r) => r.userId ?? r.id} dataSource={stuRows} columns={stuColumns} loading={stuLoading} rowSelection={{ selectedRowKeys: stuSelectedKeys, onChange: setStuSelectedKeys, }} pagination={{ current: stuPage, pageSize: stuSize, total: stuTotal, onChange: (p, ps) => { setStuPage(p); setStuSize(ps); } }} />
      </Modal>
    </div>
  );
}
