import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout, Card, Typography, message, AutoComplete, Input } from "antd";
import { useDispatch } from "react-redux";
import { logout } from "../../../redux/api/slices/authSlice";

import { listSubjects } from "../../../services/subjectService";
import { listSessionsByCourse } from "../../../services/sessionService";
import { listLessonsBySession } from "../../../services/lessonService";
import { getAssignmentsBySession } from "../../../services/assignmentService";
import { listQuestionsByLesson } from "../../../services/lessonQuestionService";
import { getMyClasses } from "../../../services/classService";

import SessionList from "../../../components/instructor/Course/SessionList";
import SessionModal from "../../../components/instructor/Course/SessionModal";
import LessonModal from "../../../components/instructor/Course/LessonModal";
import LessonDetailModal from "../../../components/instructor/Course/LessonDetailModal";
import AssignmentDetailModal from "../../../components/instructor/Course/AssignmentDetailModal";
import AssignmentModal from "../../../components/instructor/Course/AssignmentModal";
import QuizDetailModal from "../../../components/instructor/Course/quiz/QuizDetailModal";
import QuizModal from "../../../components/instructor/Course/quiz/QuizModal";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function CourseDashboardPage() {
  const { courseId: courseIdParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();



  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [openSessions, setOpenSessions] = useState(new Set());

  const [keyword, setKeyword] = useState("");

  const [modal, setModal] = useState({
    session: false,
    lesson: false,
    quiz: false,
    viewLesson: false,
    viewQuiz: false,
    assignment: false,
    viewAssignment: false,
  });
  const [editing, setEditing] = useState({});
  const [context, setContext] = useState({
    sessionId: null,
    lessonId: null,
    currentUserId: 1,
  });

  const [, setClasses] = useState([]);
  const [, setDefaultClassId] = useState(null);

  const isNavigatingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await listSubjects();
        const arr = Array.isArray(list) ? list : [];

        setCourses(arr);
      } catch (error) {
        console.error("Lỗi tải danh sách Khóa học:", error);

        message.error("Không tải được nội dung môn học");
      }
    })();

    (async () => {
      try {
        const cls = await getMyClasses();
        setClasses(Array.isArray(cls) ? cls : []);
        if (cls?.length) setDefaultClassId(cls[0].classId);
      } catch (error) {
        console.error("Lỗi tải danh sách Lớp học:", error);
        setClasses([]);
      }
    })();
  }, []); 
  useEffect(() => {
    if (courses.length === 0 || !courseIdParam) return;

    const fromUrl = Number(courseIdParam);
    if (fromUrl && fromUrl !== courseId) {

      const match = courses.find(
        (x) => (x.courseId ?? x.subjectId) === fromUrl
      );
      if (match) {
        setCourseId(fromUrl);
        setKeyword(
          match.title || match.courseName || match.name || String(fromUrl)
        );
      } else {
        console.warn(`Course with id ${fromUrl} not found in loaded courses.`);
      }
    }
  }, [courses, courseIdParam, courseId]); 


  const loadStructure = async (cid = courseId) => {
    if (!cid) return;
    setLoading(true);
    try {
      const sess = await listSessionsByCourse(cid);
      const sessionsArr = Array.isArray(sess) ? sess : [];

      const composed = await Promise.all(
        sessionsArr.map(async (s) => {
          const sessionId = s.sessionId;
          if (!sessionId) return { ...s, lessons: [], assignments: [] };

          const lessons = await listLessonsBySession(sessionId).then((r) =>
            Array.isArray(r) ? r : []
          );

          let assigns = [];
          try {
            assigns = await getAssignmentsBySession(sessionId).then((r) =>
              Array.isArray(r) ? r : []
            );
          } catch (error) {
            console.error(
              `Assignments API Error for Session ${sessionId}:`,
              error
            );
          }

          const sessionAssignments = assigns.filter(
            (a) => !a?.referenceLessonId
          );

          const lessonsWithContent = await Promise.all(
            lessons.map(async (l) => {
              const lessonId = l.lessonId;
              let quizzes = [];
              try {
                if (lessonId) {
                  quizzes = await listQuestionsByLesson(lessonId).then((r) =>
                    Array.isArray(r) ? r : []
                  );
                }
              } catch (error) {
                console.error(`Lỗi tải Quiz cho Lesson ID ${lessonId}:`, error);
              }
              return { ...l, quizzes };
            })
          );

          const lessonsSorted = lessonsWithContent
            .slice()
            .sort((a, b) => (a?.orderIndex ?? 0) - (b?.orderIndex ?? 0));

          return {
            ...s,
            title: s?.title ?? s?.name ?? `Session #${sessionId}`,
            position: s?.position ?? 0,
            lessons: lessonsSorted,
            assignments: sessionAssignments || [],
          };
        })
      );

      composed.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      setSessions(composed);
      if (composed[0]?.sessionId)
        setOpenSessions(new Set([composed[0].sessionId]));
    } catch (error) {
      console.error("LỖI TẢI CẤU TRÚC KHÓA HỌC (API lỗi):", error);

      if (error?.response?.status === 401) {
        message.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        dispatch(logout());
        navigate("/login", { replace: true });
        return;
      }

      message.error("Không tải được dữ liệu chương/bài (Kiểm tra Console).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadStructure();
    }
  }, [courseId]);

  const handleCourseChange = (id) => {
    console.log(`[DetailSubject] handleCourseChange: ${courseId} -> ${id}`);
    setCourseId(id);
    setSessions([]);
    setOpenSessions(new Set());
  };

  const options = useMemo(() => {
    console.log(
      `[DetailSubject] Creating options. Courses count: ${courses.length}, keyword: "${keyword}"`
    );
    const kw = (keyword || "").toLowerCase().trim();
    const list = courses.map((c) => {
      const id = c.courseId ?? c.subjectId;
      const title = c.title || c.courseName || c.name || `Khoá #${id}`;
      const slug = c.slug || "";
      return { id, title, slug };
    });

    const filtered = kw
      ? list.filter(
          (x) =>
            x.title.toLowerCase().includes(kw) ||
            String(x.id).includes(kw) ||
            x.slug.toLowerCase().includes(kw)
        )
      : list;

    const result = filtered.slice(0, 20).map((x) => ({
      value: String(x.id),
      label: (
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
        >
          <span
            style={{
              fontWeight: 500,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {x.title}
          </span>
          <span style={{ color: "#888" }}>#{x.id}</span>
        </div>
      ),
    }));

    console.log(`[DetailSubject] Generated ${result.length} options:`, result);
    return result;
  }, [courses, keyword]);

  const onSelectCourse = (val) => {
    console.log(`[DetailSubject] onSelectCourse called with: ${val}`);
    const id = Number(val);
    const found = courses.find((c) => (c.courseId ?? c.subjectId) === id);
    console.log(`[DetailSubject] Found course:`, found);

    if (found) {
      handleCourseChange(id);
      setKeyword(found.title || found.courseName || found.name || String(id));
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 16 }}>
        <Card
          title={
            <Title level={4} style={{ margin: 0 }}>
              TRANG CẤU TRÚC CHI TIẾT KHÓA HỌC
            </Title>
          }
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Text strong>Tìm khóa học:</Text>
            <AutoComplete
              style={{ minWidth: 360, maxWidth: 520, flex: "1 1 360px" }}
              options={options}
              onSelect={onSelectCourse}
              value={keyword}
              onSearch={(val) => {
                console.log(`[DetailSubject] onSearch: ${val}`);
                setKeyword(val);
              }}
              onChange={(val) => {
                console.log(`[DetailSubject] onChange: ${val}`);
                setKeyword(val);
              }}
              placeholder="Gõ tên/slug/ID khóa học để tìm…"
              filterOption={false}
              allowClear
            >
              <Input />
            </AutoComplete>

            {courseId && (
              <Text type="secondary">
                Đang xem: <b>#{courseId}</b>
              </Text>
            )}
          </div>
        </Card>

        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              resize: "horizontal",
              overflow: "auto",
              minWidth: "100%",
              maxWidth: "100%",
            }}
          >
            <SessionList
              {...{
                courses,
                courseId,
                setCourseId: handleCourseChange,
                sessions,
                openSessions,
                setOpenSessions,
                loading,
                loadStructure,
                setModal,
                setEditing,
                setContext,
                newQuizType: true,
              }}
            />
          </div>
        </div>
      </Content>

      <SessionModal
        {...{
          modal,
          setModal,
          editing,
          setEditing,
          courseId,
          loadStructure,
          sessions,
        }}
      />
      <LessonModal
        {...{ modal, setModal, editing, setEditing, context, loadStructure }}
      />

      <AssignmentModal
        {...{
          modal,
          setModal,
          editing,
          setEditing,
          context,
          courseId,
          loadStructure,
        }}
      />

      <QuizModal
        {...{ modal, setModal, editing, setEditing, context, loadStructure }}
      />

      <LessonDetailModal {...{ modal, setModal, editing }} />

      <AssignmentDetailModal {...{ modal, setModal, editing }} />

      <QuizDetailModal {...{ modal, setModal, editing, loadStructure }} />
    </Layout>
  );
}
