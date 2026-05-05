// src/pages/lesson/Lesson.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ClockCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Col, Row, Typography, Layout, Space, Button, Spin } from "antd";
import "../../styles/lesson.css";

import VideoPlayerSection from "../../components/lesson/VideoPlayerSection";
import CourseDescriptionSection from "../../components/lesson/CourseDescriptionSection";
import NavigationSidebarSection from "../../components/lesson/NavigationSidebarSection";
import HomeworkSection from "../../components/lesson/HomeworkSection";
import QuizSection from "../../components/lesson/QuizSection";
import {
  fetchCourseDetailAPI,
  getCourseByIdAPI,
} from "../../services/subjectService";
import {
  listQuestionsByLesson,
  getQuizAttemptHistory, // Still needed for initial quiz loading if backend doesn't provide
} from "../../services/lessonQuestionService";
import {
  getAssignmentsBySession,
  getMySubmission, // Still needed for initial assignment loading if backend doesn't provide
} from "../../services/assignmentService";
import progressService from "../../services/progressService";
import ProgressFireworks from "../../components/lesson/ProgressFireworks";
import { checkEnrollmentStatus } from "../../services/enrollmentService";
import PaymentModal from "../../components/modal/PaymentModal";
import CourseSurvey from "../../components/modal/CourseSurvey";
import {
  getSurveyByCourse,
  checkIfUserHasEvaluated,
} from "../../services/courseServey";

const { Text } = Typography;
const { Content, Sider } = Layout;

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

// Helper to create a consistent key for work items
const getWorkItemKey = (item) => {
  if (item.type === WORK_ITEM_TYPES.HOMEWORK) {
    // Homework keys might use assignmentId or a generated ID
    return `${String(item?.assignmentId || item.lessonId)}-${WORK_ITEM_TYPES.HOMEWORK}-session`;
  }
  // For quizzes, videos, readings, lessonId is used
  return `${String(item.lessonId)}-${item.type}`;
};




const Lesson = () => {
  const { courseId, lessonId, type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [courseTitle, setCourseTitle] = useState("");



  const currentQuizId = location.state?.quizId || null;
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState(
    lessonId ? parseInt(lessonId, 10) : null
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [courseSections, setCourseSections] = useState([]);
  const [isSectionsLoading, setIsSectionsLoading] = useState(false);
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState([]);
  const [passedQuizWorkItemKeys, setPassedQuizWorkItemKeys] = useState(new Set());

  const [progressMap, setProgressMap] = useState({}); // Stores progress for all work items
  const [completedWorkItems, setCompletedWorkItems] = useState(new Set()); // Derived from progressMap


  const [hasSubmittedSurvey, setHasSubmittedSurvey] = useState(false);
  const [isSurveyModalVisible, setIsSurveyModalVisible] = useState(false);
  const [surveyToDisplayId, setSurveyToDisplayId] = useState(null);

  const flatWorkItems = useMemo(() => {
    return courseSections.flatMap((session) => {
      const sessionItems = [];
      (session?.lessons || []).forEach((lesson) => {
        const lessonType = getLessonType(lesson);
        const baseItem = {
          lessonId: String(lesson?.lessonId ?? ""),
          title: lesson?.title || `Lesson ${lesson?.lessonId}`,
        };

        // Add video/reading item
        sessionItems.push({
          key: getWorkItemKey({ ...baseItem, type: lessonType }),
          type: lessonType,
          ...baseItem,
        });

        // Add quiz item if quizzes exist
        if (Array.isArray(lesson?.quizzes) && lesson.quizzes.length > 0) {
          sessionItems.push({
            key: getWorkItemKey({ ...baseItem, type: WORK_ITEM_TYPES.QUIZ }),
            type: WORK_ITEM_TYPES.QUIZ,
            ...baseItem,
            title: `[Quiz] ${baseItem.title}`, // Prefix for quiz
          });
        }
      });
      (session?.assignments || []).forEach((assignment, idx) => {
        const assignmentIdStr = String(
          assignment?.assignmentId ?? `a-${session?.sessionId}-${idx}`
        );
        sessionItems.push({
          key: getWorkItemKey({
            assignmentId: assignmentIdStr,
            type: WORK_ITEM_TYPES.HOMEWORK,
          }),
          type: WORK_ITEM_TYPES.HOMEWORK,
          lessonId: assignmentIdStr, // Using assignmentId as lessonId for routing
          assignmentId: assignment?.assignmentId,
          title: `[Assignment] ${
            assignment?.title || `Session Assignment ${idx + 1}`
          }`,
        });
      });
      return sessionItems;
    });
  }, [courseSections]);

  // Lấy thông tin khoá học riêng để có title chuẩn, không phụ thuộc sessions
  useEffect(() => {
    if (!courseId) return;

    const fetchCourseInfo = async () => {
      try {
        const info = await getCourseByIdAPI(courseId);
        const titleFromInfo = info?.title || info?.courseTitle || "";
        if (titleFromInfo) {
          setCourseTitle(titleFromInfo);
        }
      } catch (error) {
        console.error("Failed to fetch course info:", error);
      }
    };

    fetchCourseInfo();
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;

    setIsLoading(true);
    setCourseSections([]);

    const verifyEnrollment = async () => {
      try {
        const response = await checkEnrollmentStatus(courseId);
        const enrolled = response.data.isEnrolled;
        setIsEnrolled(enrolled);

        if (enrolled) {
          loadSessions(courseId);
        }
      } catch (error) {
        console.error("Failed to check enrollment status:", error);
        setIsEnrolled(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEnrollment();
  }, [courseId]);

  useEffect(() => {
    if (!isEnrolled || !courseId) return;

    const checkSurveyStatus = async () => {
      try {
        const hasEvaluated = await checkIfUserHasEvaluated(courseId);
        setHasSubmittedSurvey(hasEvaluated);
      } catch (error) {
        console.error("Could not check for prior survey submissions", error);
      }
    };

    checkSurveyStatus();
  }, [courseId, isEnrolled]);

  // Load user progress for the entire course
  useEffect(() => {
    if (!courseId || !isEnrolled) return;

    progressService
      .getUserProgress() // Use getUserProgress like LessonProgressPage
      .then((progressList) => {
        const list = Array.isArray(progressList) ? progressList : [];
        const newProgressMap = {};
        list.forEach((progress) => {
          // Filter by courseId
          if (String(progress.courseId) === String(courseId)) {
            // progressMap keyed by lessonId, stores the progress object
            newProgressMap[progress.lessonId] = progress;
          }
        });
        setProgressMap(newProgressMap);
      })
      .catch((err) => console.error("Failed to load progress:", err));
  }, [courseId, isEnrolled]);


  // Derive completedWorkItems from all sources
  useEffect(() => {
    if (!isEnrolled) {
      setCompletedWorkItems(new Set());
      return;
    }

    // 1. Get completed assignments for this attempt (from submittedAssignmentIds)
    const completedAssignments = flatWorkItems
      .filter(
        (item) =>
          item.type === WORK_ITEM_TYPES.HOMEWORK &&
          submittedAssignmentIds.includes(String(item.assignmentId))
      )
      .map((item) => item.key);

    // 2. Get completed quizzes (from passedQuizWorkItemKeys)
    const completedQuizzes = [...passedQuizWorkItemKeys];

    // 3. Get completed Video/Reading from progressMap
    const completedContentItems = new Set();
    const completedLessonIds = Object.keys(progressMap).filter(
      (id) => progressMap[id].isCompleted
    );

    completedLessonIds.forEach((lessonId) => {
      // Find the actual lesson object in courseSections to determine its type
      let lessonObj = null;
      for (const session of courseSections) {
        lessonObj = session.lessons?.find(l => String(l.lessonId) === lessonId);
        if (lessonObj) break;
      }

      if (lessonObj) {
        const lessonType = getLessonType(lessonObj); // Determine if it's video or readings
        // Only consider video or readings, as quizzes have their own tracking
        if (lessonType === WORK_ITEM_TYPES.VIDEO || lessonType === WORK_ITEM_TYPES.READINGS) {
          completedContentItems.add(`${lessonId}-${lessonType}`);
        }
      }
    });

    // 4. Combine all sources
    setCompletedWorkItems(
      new Set([
        ...completedAssignments,
        ...completedQuizzes,
        ...completedContentItems,
      ])
    );
  }, [
    progressMap,
    flatWorkItems,
    submittedAssignmentIds,
    isEnrolled,
    passedQuizWorkItemKeys,
    courseSections // Added courseSections dependency for lessonObj lookup
  ]);


  const markLessonItemAsDone = (workItemKey) => {
    const [id] = workItemKey.split("-");
    const lessonIdNum = parseInt(id, 10);
    if (!isNaN(lessonIdNum)) {
      progressService
        .updateProgressImmediate(lessonIdNum, 9999, true)
        .then((updatedProgress) => {
          if (updatedProgress) {
            setProgressMap((prev) => ({
              ...prev,
              [updatedProgress.lessonId]: updatedProgress,
            }));
          }
        })
        .catch((err) => {
          console.error("Failed to update progress:", err);
        });
    }
  };

  const handleQuizPass = () => {
    if (currentWorkItemKey) {
      markLessonItemAsDone(currentWorkItemKey); // This handles updating progressMap for quizzes
      // Also update passedQuizWorkItemKeys for local state consistency
      setPassedQuizWorkItemKeys(
        (prev) => new Set(prev).add(currentWorkItemKey)
      );
    }
  };

  const handleVideoEnd = (lessonIdNum) => {
    progressService
      .updateProgressImmediate(lessonIdNum, 9999, true)
      .then((updatedProgress) => {
        if (updatedProgress) {
          setProgressMap((prev) => ({
            ...prev,
            [updatedProgress.lessonId]: updatedProgress,
          }));
        }
      })
      .catch((err) => {
        console.error("Failed to update progress on video end:", err);
      });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    setCurrentLessonId(lessonId ? parseInt(lessonId, 10) : null);
  }, [lessonId]);

  const loadSessions = async (cid) => {
    setIsSectionsLoading(true);
    try {
      const data = await fetchCourseDetailAPI(cid);

      // Nếu backend có trả title/courseTitle trong structure thì tận dụng luôn
      const rootTitle = data?.courseTitle || data?.title || "";
      if (rootTitle) {
        setCourseTitle(rootTitle);
      }

      // Chuẩn hoá sessions
      const normalized = Array.isArray(data) ? data : data?.sessions || [];
      const withData = await Promise.all(
        (normalized || []).map(async (s) => {
          const lessons = Array.isArray(s?.lessons) ? s.lessons : [];
          const lessonsWithQuiz = await Promise.all(
            lessons.map(async (l) => {
              // Only fetch questions if the lesson doesn't already have quizzes and is not a homework type
              if (
                !Array.isArray(l?.quizzes) &&
                getLessonType(l) !== WORK_ITEM_TYPES.HOMEWORK
              ) {
                try {
                  const qs = await listQuestionsByLesson(l.lessonId);
                  return { ...l, quizzes: Array.isArray(qs) ? qs : [] };
                } catch {
                  return { ...l, quizzes: [] };
                }
              }
              return l;
            })
          );
          const assignments = await getAssignmentsBySession(s.sessionId);
          return { ...s, lessons: lessonsWithQuiz, assignments };
        })
      );
      setCourseSections(withData);
    } catch (err) {
      console.error("Failed to load course structure:", err);
      setCourseSections([]);
    } finally {
      setIsSectionsLoading(false);
    }
  };


  useEffect(() => {
    if (!isEnrolled || courseSections.length === 0) return;

    const fetchAllSubmissions = async () => {
      const allAssignments = courseSections.flatMap(
        (session) => session.assignments || []
      );
      if (allAssignments.length === 0) {
        setSubmittedAssignmentIds([]);
        return;
      }

      const submissionChecks = allAssignments.map(async (assignment) => {
        try {
          const submission = await getMySubmission(
            assignment.assignmentId
          );
          return submission ? assignment.assignmentId : null;
        } catch (error) {
          return null;
        }
      });

      try {
        const results = await Promise.all(submissionChecks);
        const submittedIds = results.filter((id) => id !== null).map(String);
        setSubmittedAssignmentIds(submittedIds);
      } catch (error) {
        console.error("Error fetching all submission statuses:", error);
        setSubmittedAssignmentIds([]);
      }
    };

    fetchAllSubmissions();
  }, [courseSections, isEnrolled]);
  //
  useEffect(() => {
    if (!isEnrolled || flatWorkItems.length === 0) return;
    if (isSectionsLoading) return;

    const checkAllQuizStatuses = async () => {
      const quizItems = flatWorkItems.filter(
        (item) => item.type === WORK_ITEM_TYPES.QUIZ
      );
      if (quizItems.length === 0) return;

      const checks = quizItems.map(async (quizItem) => {
        try {
          const history = await getQuizAttemptHistory(
            quizItem.lessonId
          );
          const hasPassed =
            history &&
            history.length > 0 &&
            history.some((attempt) => attempt.score >= 50);

          return hasPassed ? quizItem.key : null;
        } catch (error) {
          return null;
        } 
      });

      try {
        const results = await Promise.all(checks);
        const passedQuizzes = new Set(
          results.filter((key) => key !== null)
        );
        setPassedQuizWorkItemKeys(passedQuizzes);
      } catch (error) {
        console.error("Error checking all quiz statuses:", error);
      }
    };

    checkAllQuizStatuses();
  }, [flatWorkItems, isEnrolled, isSectionsLoading]);


  useEffect(() => {
    const onResize = () =>
      setIsMobileViewport(window.innerWidth < 1200);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getCurrentLessonData = () => {
    if (!currentLessonId) return null;
    for (const session of courseSections) {
      const lessonList = Array.isArray(session?.lessons)
        ? session.lessons
        : [];
      const foundLesson = lessonList.find(
        (l) =>
          String(l?.lessonId ?? "") === String(currentLessonId)
      );
      if (foundLesson) return foundLesson;

      const assignmentList = Array.isArray(session?.assignments)
        ? session.assignments
        : [];
      const foundAssignment = assignmentList.find(
        (a) =>
          String(a?.assignmentId ?? "") ===
            String(currentLessonId) ||
          String(a?.referenceLessonId ?? "") ===
            String(currentLessonId)
      );
      if (foundAssignment) return foundAssignment;
    }
    return null;
  };

  const currentLessonData = getCurrentLessonData();
  const instructorId = courseSections?.[0]?.instructorId || null;

  const displayCourseTitle =
    courseTitle ||
    courseSections?.[0]?.courseTitle ||
    courseSections?.[0]?.title ||
    "this course";

  const currentSessionId = (() => {
    for (const s of courseSections) {
      const lessonList = Array.isArray(s?.lessons)
        ? s.lessons
        : [];
      if (
        currentLessonId &&
        lessonList.some(
          (l) =>
            String(l?.lessonId ?? "") ===
            String(currentLessonId)
        )
      ) {
        return s?.sessionId;
      }
      const assignmentList = Array.isArray(s?.assignments)
        ? s.assignments
        : [];
      if (
        currentLessonId &&
        assignmentList.some(
          (a) =>
            String(a?.assignmentId ?? "") ===
              String(currentLessonId) ||
            String(a?.referenceLessonId ?? "") ===
              String(currentLessonId)
        )
      ) {
        return s?.sessionId;
      }
    }
    return courseSections?.[0]?.sessionId ?? null;
  })();

  const currentSessionTitle = useMemo(() => {
    if (!currentSessionId) return "";
    const session = courseSections.find(
      (s) => String(s?.sessionId) === String(currentSessionId)
    );
    return session?.title || session?.sessionName || "";
  }, [currentSessionId, courseSections]);

  const getLessonTitle = () => currentLessonData?.title || "";
  const getLessonDate = () =>
    currentLessonData?.createdAt
      ? new Date(
          currentLessonData.createdAt
        ).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";

  useEffect(() => {
    if (isEnrolled && !lessonId && flatWorkItems.length > 0) {
      const firstItem = flatWorkItems[0];
      setCurrentLessonId(
        firstItem.lessonId
          ? parseInt(firstItem.lessonId, 10)
          : null
      );
      navigate(
        `/lesson/${courseId}/${firstItem.lessonId}/${firstItem.type}`,
        {
          replace: true,
          state: { lessonTitle: firstItem.title },
        }
      );
    }
  }, [
    lessonId,
    flatWorkItems,
    courseId,
    navigate,
    isEnrolled,
  ]);

  const computedTotalWorkItems = flatWorkItems.length;
  const targetType = type || WORK_ITEM_TYPES.VIDEO;

  const currentWorkItemKey = (() => {
    if (!currentLessonId) return null;
    const currentItem = flatWorkItems.find(
        (item) =>
            String(item.lessonId) === String(currentLessonId) &&
            item.type === targetType
    );
    return currentItem ? currentItem.key : null;
  })();

  const currentFlatIndex = flatWorkItems.findIndex(
    (item) => item.key === currentWorkItemKey
  );

  const handleAssignmentSubmitted = (assignmentId) => {
    const idStr = String(assignmentId);
    setSubmittedAssignmentIds((prev) =>
      prev.includes(idStr) ? prev : [...prev, idStr]
    );
  };

  const previousFlatIndex = currentFlatIndex - 1;

  const isPreviousItemCompleted = (() => {
    if (previousFlatIndex < 0) return true;
    const prevItem = flatWorkItems[previousFlatIndex];
    if (completedWorkItems.has(prevItem?.key)) return true;
    if (prevItem?.type === WORK_ITEM_TYPES.HOMEWORK) {
      const prevAssignmentId = prevItem.assignmentId
        ? String(prevItem.assignmentId)
        : String(prevItem.lessonId || "");
      if (
        prevAssignmentId &&
        submittedAssignmentIds.includes(prevAssignmentId)
      ) {
        return true;
      }
    }
    return false;
  })();

  const isCurrentItemAccessible =
    currentFlatIndex === 0 || isPreviousItemCompleted;

  const completedCount = completedWorkItems.size;
  const percent =
    computedTotalWorkItems > 0 && completedCount > 0
      ? Math.round(
          (completedCount / computedTotalWorkItems) * 100
        )
      : 0;

  useEffect(() => {
    const isComplete =
      computedTotalWorkItems > 0 &&
      completedCount === computedTotalWorkItems;
    if (isComplete && !isSurveyModalVisible && !hasSubmittedSurvey) {
      const fetchCourseSurvey = async () => {
        try {
          const survey = await getSurveyByCourse(courseId);
          setSurveyToDisplayId(survey.surveyId);
          const timer = setTimeout(() => {
            setIsSurveyModalVisible(true);
          }, 800);
          return () => clearTimeout(timer);
        } catch (error) {
          console.error(
            "No course survey found or failed to fetch survey:",
            error
          );
        }
      };
      fetchCourseSurvey();
    }
  }, [
    completedCount,
    computedTotalWorkItems,
    isSurveyModalVisible,
    hasSubmittedSurvey,
    courseId,
  ]);

  const handleGoNext = () => {
    if (!currentLessonId || currentFlatIndex === -1) return;

    let isCurrentItemActuallyCompleted = false;

    if (targetType === WORK_ITEM_TYPES.HOMEWORK) {
      isCurrentItemActuallyCompleted =
        currentLessonData?.assignmentId &&
        submittedAssignmentIds.includes(
          String(currentLessonData.assignmentId)
        );
    } else {
      isCurrentItemActuallyCompleted = completedWorkItems.has(currentWorkItemKey);
    }


    if (!isCurrentItemActuallyCompleted) {
      return;
    }

    const nextIndex = currentFlatIndex + 1;
    if (nextIndex < computedTotalWorkItems) {
      const nextItem = flatWorkItems[nextIndex];
      navigate(
        `/lesson/${courseId}/${nextItem.lessonId}/${nextItem.type}`,
        { state: { lessonTitle: nextItem.title } }
      );
    }
  };

  const handleSurveySuccess = () => {
    setHasSubmittedSurvey(true);
    setIsSurveyModalVisible(false);
  };

  const markCurrentItemDone = () => {
    if (currentWorkItemKey) {
      markLessonItemAsDone(currentWorkItemKey);
    }
  };

  const renderContent = () => {
    if (!currentLessonData || !currentLessonId) {
      return (
        <div style={{ padding: 16, color: "#999" }}>
          Đang tải nội dung bài học...
        </div>
      );
    }

    if (targetType === WORK_ITEM_TYPES.READINGS)
      return (
        <CourseDescriptionSection
          showFullDescription={true}
          description={currentLessonData?.description}
          content={currentLessonData?.content}
          onMarkAsRead={markCurrentItemDone}
          isReadingCompleted={completedWorkItems.has(
            currentWorkItemKey
          )}
        />
      );
    if (targetType === WORK_ITEM_TYPES.HOMEWORK)
      return (
        <HomeworkSection
          sessionId={currentSessionId}
          lessonId={currentLessonId}
          assignmentId={currentLessonData?.assignmentId}
          classId={null}
          onSubmitSuccess={handleAssignmentSubmitted}
          courseName={displayCourseTitle}
          sessionTitle={currentSessionTitle}
        />
      );
    if (targetType === WORK_ITEM_TYPES.QUIZ)
      return (
        <QuizSection
          lessonId={currentLessonId}
          lesson={currentLessonData}
          quizId={currentQuizId}
          onGoNext={handleGoNext}
          durationMinutes={
            currentLessonData?.quizDurationMinutes
          }
          onQuizPass={handleQuizPass}
        />
      );

    const src = currentLessonData?.videoUrl;
    return src ? (
      <VideoPlayerSection
        src={src}
        lesson={currentLessonData}
        onVideoEnd={() => handleVideoEnd(currentLessonId)}
      />
    ) : (
      <div style={{ padding: 16, color: "#999" }}>
        Không có nội dung cho bài học này.
      </div>
    );
  };

  const isCurrentItemDoneOrSubmitted =
    !!currentWorkItemKey &&
    (completedWorkItems.has(currentWorkItemKey) ||
      (currentLessonData?.assignmentId &&
        submittedAssignmentIds.includes(
          String(currentLessonData.assignmentId)
        )));

  const lessonTitle = getLessonTitle();
  const lessonDate = getLessonDate();

  // --- RENDER STATES ---

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Đang tải dữ liệu bài học..." />
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <PaymentModal
        visible={true}
        courseId={courseId}
        courseTitle={displayCourseTitle}
      />
    );
  }

  return (
    <div className="lesson-container">
      {isSurveyModalVisible && surveyToDisplayId && (
        <CourseSurvey
          visible={isSurveyModalVisible}
          onClose={() => {
            setIsSurveyModalVisible(false);
          }}
          courseId={courseId}
          instructorId={instructorId}
          surveyId={surveyToDisplayId}
          onSuccess={handleSurveySuccess}
        />
      )}

      <Layout style={{ minHeight: "100vh" }} hasSider>
        <Content className="main-content">
          <Row className="navigation-row" align="middle">
            <Col flex="auto">
              <div className="breadcrumb">
                <Text type="secondary">Trang chủ</Text>
                <Text type="secondary"> / </Text>
                <Text strong style={{ color: "#3D3D3D" }}>
                  {displayCourseTitle}
                </Text>
              </div>
            </Col>
            {!isMobileViewport && (
              <Col>
                <div className="navigation-controls">
                  <ArrowLeftOutlined
                    onClick={() => {
                      const prevIndex = currentFlatIndex - 1;
                      if (prevIndex >= 0) {
                        const prevItem = flatWorkItems[prevIndex];
                        navigate(
                          `/lesson/${courseId}/${prevItem.lessonId}/${prevItem.type}`
                        );
                      }
                    }}
                    style={{
                      cursor:
                        currentFlatIndex > 0
                          ? "pointer"
                          : "not-allowed",
                      fontSize: 16,
                      marginRight: 8,
                      color:
                        currentFlatIndex > 0
                          ? "#AB1F24"
                          : "#bfbfbf",
                    }}
                  />
                  <Text type="secondary">Bài trước</Text>

                  {currentFlatIndex <
                    computedTotalWorkItems - 1 && (
                    <>
                      <Text
                        style={{
                          margin: "0 8px",
                          cursor: isCurrentItemDoneOrSubmitted
                            ? "pointer"
                            : "not-allowed",
                          color: isCurrentItemDoneOrSubmitted
                            ? "#AB1F24"
                            : "#bfbfbf",
                          pointerEvents: isCurrentItemDoneOrSubmitted
                            ? "auto"
                            : "none",
                        }}
                        onClick={handleGoNext}
                      >
                        Bài tiếp theo
                      </Text>
                      <ArrowRightOutlined
                        onClick={handleGoNext}
                        style={{
                          cursor: isCurrentItemDoneOrSubmitted
                            ? "pointer"
                            : "not-allowed",
                          fontSize: 16,
                          marginLeft: 8,
                          color: isCurrentItemDoneOrSubmitted
                            ? "#AB1F24"
                            : "#bfbfbf",
                          pointerEvents: isCurrentItemDoneOrSubmitted
                            ? "auto"
                            : "none",
                        }}
                      />
                    </>
                  )}
                </div>
              </Col>
            )}
          </Row>

          {/* HEADER BÀI HỌC – chỉ hiện khi có dữ liệu thật */}
          {lessonTitle && (
            <Row className="info-row" style={{ marginTop: 16 }}>
              <Col span={24}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 0",
                  }}
                >
                  <div>
                    <h1
                      style={{
                        color: "#3D3D3D",
                        margin: 0,
                        fontSize: 32,
                        fontWeight: 600,
                      }}
                    >
                      {lessonTitle}
                    </h1>
                    {lessonDate && (
                      <div style={{ marginTop: 8 }}>
                        <ClockCircleOutlined
                          style={{ marginRight: 8 }}
                        />
                        <Text type="secondary">
                          {lessonDate}
                        </Text>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      color: "#DD673C",
                    }}
                  >
                    <ProgressFireworks
                      type="circle"
                      percent={percent}
                      size={40}
                      strokeColor="#DD673C"
                      format={(p) => (
                        <span
                          style={{
                            color:
                              p === 100 ? "#DD673C" : "inherit",
                          }}
                        >
                          {p}%
                        </span>
                      )}
                    />
                    <Text type="secondary">
                      {completedCount}/{computedTotalWorkItems} Mục
                      đã hoàn thành
                    </Text>
                  </div>
                </div>
              </Col>
            </Row>
          )}

          {!isCurrentItemAccessible && currentWorkItemKey && (
            <Row
              style={{
                marginTop: 16,
                marginBottom: 16,
                padding: 16,
                backgroundColor: "#fffbe6",
                border: "1px solid #ffe58f",
                borderRadius: 4,
              }}
            >
              <Text strong style={{ color: "#faad14" }}>
                Bài học này bị khóa. Vui lòng hoàn thành bài học
                trước đó để tiếp tục.
              </Text>
            </Row>
          )}

          <Row className="video-row">
            <Col span={24}>
              {isCurrentItemAccessible ? renderContent() : null}
            </Col>
          </Row>

          {(targetType === WORK_ITEM_TYPES.VIDEO ||
            targetType === WORK_ITEM_TYPES.QUIZ) &&
            isCurrentItemAccessible &&
            currentLessonData && (
              <Row className="description-row">
                <Col span={24}>
                  <CourseDescriptionSection
                    showFullDescription={false}
                    description={
                      currentLessonData?.description
                    }
                    content={currentLessonData?.content}
                    onMarkAsRead={undefined}
                    isReadingCompleted={false}
                  />
                </Col>
              </Row>
            )}

          {computedTotalWorkItems > 0 &&
            completedCount === computedTotalWorkItems &&
            hasSubmittedSurvey && (
              <Row
                style={{
                  marginTop: 24,
                  padding: "16px 0",
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                <Col
                  span={24}
                  style={{ textAlign: "center" }}
                >
                  <Space>
                    <Button
                      size="middle"
                      onClick={() =>
                        navigate("/qlmh/progress")
                      }
                    >
                      Trở về trang tiến trình
                    </Button>
                    <Button
                      size="middle"
                      onClick={() =>
                        navigate("/elearning")
                      }
                    >
                      Trở về trang chủ
                    </Button>
                  </Space>
                </Col>
              </Row>
            )}
        </Content>

        {!isMobileViewport && (
          <Sider
            width={310}
            collapsedWidth={56}
            collapsed={isSidebarCollapsed}
            collapsible
            trigger={null}
            className="sidebar-sider"
          >
            <NavigationSidebarSection
              isSidebarCollapsed={isSidebarCollapsed}
              toggleSidebar={() =>
                setIsSidebarCollapsed(!isSidebarCollapsed)
              }
              currentLessonId={currentLessonId}
              currentSessionId={currentSessionId}
              currentType={targetType}
              courseId={courseId}
              sessions={courseSections}
              loading={isSectionsLoading}
              completedWorkItems={[...completedWorkItems]}
              flatWorkItems={flatWorkItems}
              currentFlatIndex={currentFlatIndex}
              onGoNext={handleGoNext}
            />
          </Sider>
        )}
      </Layout>
    </div>
  );
};

export default Lesson;
