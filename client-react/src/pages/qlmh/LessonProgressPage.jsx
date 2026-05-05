import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Progress,
  Flex,
  Spin,
  message,
  Empty,
  Button,
  Space,
} from "antd";
import { BookOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { fetchCourseDetailAPI } from "../../services/subjectService";
import progressService from "../../services/progressService";
import {
  getAssignmentsBySession,
  getMySubmission,
} from "../../services/assignmentService";
import { listQuestionsByLesson } from "../../services/lessonQuestionService";
import { checkIfUserHasEvaluated } from "../../services/courseServey";

const { Title, Text } = Typography;

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

const LessonProgressPage = () => {
  const [loading, setLoading] = useState(true);
  const [courseProgressData, setCourseProgressData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userProgressList = await progressService.getUserProgress();

        if (!userProgressList || userProgressList.length === 0) {
          setCourseProgressData([]);
          setLoading(false);
          return;
        }

        // Filter for the latest attempt for each lesson
        const latestAttemptProgressList = userProgressList.reduce((acc, progress) => {
            const key = `${progress.lessonId}`; // Key by lessonId to find latest attempt
            if (!acc[key] || progress.attemptNumber > acc[key].attemptNumber) {
                acc[key] = progress;
            }
            return acc;
        }, {});

        const filteredProgressList = Object.values(latestAttemptProgressList);

        const courses = filteredProgressList.reduce((acc, progress) => {
          if (progress.courseId) {
            if (!acc[progress.courseId]) {
              acc[progress.courseId] = {
                courseId: progress.courseId,
                title: progress.courseTitle,
                progressItems: [],
              };
            }
            acc[progress.courseId].progressItems.push(progress);
          }
          return acc;
        }, {});

        const progressMap = filteredProgressList.reduce((acc, progress) => {
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
                          const questions = await listQuestionsByLesson(
                            lesson.lessonId
                          );
                          return {
                            ...lesson,
                            quizzes: Array.isArray(questions) ? questions : [],
                          };
                        } catch {
                          return { ...lesson, quizzes: [] };
                        }
                      }
                      return lesson;
                    })
                  );

                  const assignments = await getAssignmentsBySession(
                    session.sessionId
                  );
                  return { ...session, lessons: lessonsWithQuiz, assignments };
                })
              );

              const flatWorkItems = sectionsWithDetails.flatMap((session) => {
                const sessionItems = [];
                (session?.lessons || []).forEach((lesson) => {
                  const lessonType = getLessonType(lesson);
                  const lessonIdStr = String(lesson?.lessonId ?? "");
                  sessionItems.push({
                    key: `${lessonIdStr}-${lessonType}`,
                    type: lessonType,
                    lessonId: lessonIdStr,
                    title: lesson?.title || `Lesson ${lessonIdStr}`,
                  });
                  if (
                    Array.isArray(lesson?.quizzes) &&
                    lesson.quizzes.length > 0
                  ) {
                    sessionItems.push({
                      key: `${lessonIdStr}-${WORK_ITEM_TYPES.QUIZ}`,
                      type: WORK_ITEM_TYPES.QUIZ,
                      lessonId: lessonIdStr,
                      title: `[Quiz] ${lesson?.title || `Lesson ${lessonIdStr}`
                        }`,
                    });
                  }
                });
                (session?.assignments || []).forEach((assignment, idx) => {
                  const assignmentIdStr = String(
                    assignment?.assignmentId ??
                    `a-${session?.sessionId}-${idx}`
                  );
                  sessionItems.push({
                    key: `${assignmentIdStr}-${WORK_ITEM_TYPES.HOMEWORK}-session`,
                    type: WORK_ITEM_TYPES.HOMEWORK,
                    lessonId: assignmentIdStr,
                    assignmentId: assignment?.assignmentId,
                    title: `[Assignment] ${assignment?.title || `Session Assignment ${idx + 1}`
                      }`,
                  });
                });
                return sessionItems;
              });

              const allAssignmentIds = flatWorkItems
                .filter(
                  (item) =>
                    item.type === WORK_ITEM_TYPES.HOMEWORK && item.assignmentId
                )
                .map((item) => item.assignmentId);

              const submissionChecks = allAssignmentIds.map(
                async (assignmentId) => {
                  try {
                    const submission = await getMySubmission(assignmentId);
                    return submission ? String(assignmentId) : null;
                  } catch {
                    return null;
                  }
                }
              );
              const submittedAssignmentIds = (
                await Promise.all(submissionChecks)
              ).filter((id) => id !== null);

              const completedFromProgress = Object.values(progressMap)
                .filter((p) => p.isCompleted && p.courseId === course.courseId)
                .flatMap((p) => {
                  const lessonIdStr = String(p.lessonId);
                  return flatWorkItems
                    .filter(
                      (item) =>
                        item.lessonId === lessonIdStr &&
                        (item.type === WORK_ITEM_TYPES.VIDEO ||
                          item.type === WORK_ITEM_TYPES.READINGS ||
                          item.type === WORK_ITEM_TYPES.QUIZ)
                    )
                    .map((item) => item.key);
                });

              const completedAssignments = flatWorkItems
                .filter(
                  (item) =>
                    item.type === WORK_ITEM_TYPES.HOMEWORK &&
                    submittedAssignmentIds.includes(String(item.assignmentId))
                )
                .map((item) => item.key);

              const completedWorkItems = Array.from(
                new Set([...completedFromProgress, ...completedAssignments])
              );
              const completedCount = completedWorkItems.length;
              const totalWorkItems = flatWorkItems.length;

              const percent =
                totalWorkItems > 0
                  ? Math.round((completedCount / totalWorkItems) * 100)
                  : 0;
              
              let hasEvaluated = false;
              if (percent === 100) {
                try {
                    hasEvaluated = await checkIfUserHasEvaluated(course.courseId);
                } catch (error) {
                    console.error("Failed to check evaluation status:", error);
                }
              }

              return {
                ...course,
                progress: percent,
                completedCount,
                totalWorkItems,
                firstLesson: flatWorkItems[0] || null,
                hasEvaluated: hasEvaluated,
              };
            } catch (error) {
              console.error(
                `Error processing course ${course.title}:`,
                error
              );
              return {
                ...course,
                progress: 0,
                completedCount: 0,
                totalWorkItems: 0,
                firstLesson: null,
                hasEvaluated: false,
              };
            }
          })
        );
        setCourseProgressData(coursesWithProgress);
      } catch (error) {
        console.error("Failed to fetch course progress data:", error);
        message.error("Không thể tải tiến trình khóa học.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleContinueLearning = (course) => {
    if (course.firstLesson) {
      const { lessonId, type } = course.firstLesson;
      navigate(`/lesson/${course.courseId}/${lessonId}/${type}`);
    } else {
      navigate(`/course-detail/${course.courseId}`);
    }
  };

  const handleRateCourse = (course) => {
    navigate(`/course-survey/${course.courseId}`);
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "80vh" }}>
        <Spin size="large" tip="Đang tải tiến trình khóa học..." />
      </Flex>
    );
  }

  if (courseProgressData.length === 0) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "80vh" }}>
        <Empty description="Bạn chưa có tiến trình ở khóa học nào." />
      </Flex>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: "24px" }}>
        Tiến trình Khóa học của tôi
      </Title>
      <Flex vertical gap="large">
        {courseProgressData.map((course) => (
          <Card
            key={course.courseId}
            title={
              <Flex align="center" gap="small">
                <BookOutlined />
                <Title level={4} style={{ margin: 0 }}>
                  {course.title}
                </Title>
              </Flex>
            }
            extra={
              course.progress === 100 ? (
                course.hasEvaluated ? (
                    <Space>
                        <Flex align="center" gap="small">
                            <CheckCircleOutlined style={{ color: 'green' }}/>
                            <Text type="secondary">Bạn đã đánh giá</Text>
                        </Flex>
                        <Button
                            type="default"
                            size="small"
                            onClick={() => handleContinueLearning(course)}
                        >
                            Xem lại bài học
                        </Button>
                    </Space>
                ) : (
                    <Button
                        type="primary"
                        onClick={() => handleContinueLearning(course)}
                        style={{ background: "#DD673C", borderColor: "#DD673C" }}
                    >
                        Đánh giá khóa học
                    </Button>
                )
              ) : (
                <Button
                  type="primary"
                  onClick={() => handleContinueLearning(course)}
                  disabled={!course.firstLesson}
                >
                  Tiếp tục học
                </Button>
              )
            }

          >
            <Flex justify="space-between" align="center">
              <div style={{ flexGrow: 1, marginRight: "24px" }}>
                <Progress
                  percent={course.progress}
                  status={course.progress === 100 ? "success" : "active"}
                />
              </div>
              <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
                {course.completedCount}/{course.totalWorkItems} mục hoàn thành
              </Text>
            </Flex>
          </Card>
        ))}
      </Flex>
    </div>
  );
};

export default LessonProgressPage;
