// src/components/instructor/Course/SessionList.jsx
import React from "react";
import {
  Card,
  Space,
  Typography,
  Select,
  Button,
  Tooltip,
  Tag,
  Empty,
  Popconfirm,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  DownOutlined,
  RightOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { deleteSession } from "../../../services/sessionService";
import { removeQuestionFromLesson } from "../../../services/lessonQuestionService";
import QuizEditorDrawer from "../../../components/instructor/Course/quiz/QuizEditorDrawer";

const { Title, Text } = Typography;
const { Option } = Select;

/* ---------------- Helpers ---------------- */
const detectType = (l) => {
  if (l?.quizzes?.length || l?.quizId) return "QUIZ";
  if (l?.videoUrl) return "VIDEO";
  return "READING";
};

const typeMeta = {
  VIDEO: { icon: <PlayCircleOutlined />, label: "Video" },
  READING: { icon: <FileTextOutlined />, label: "Bài đọc" },
  QUIZ: { icon: <ThunderboltOutlined />, label: "Bài kiểm tra" },
};

const getQuestionText = (q, idx = 0) =>
  q?.questionText ||
  q?.question?.questionText ||
  q?.title ||
  `Quiz #${q?.questionId ?? q?.id ?? idx + 1}`;

/* ================ Component ================ */
export default function SessionList({
  courses,
  courseId,
  setCourseId,
  sessions,
  openSessions,
  setOpenSessions,
  loading,
  loadStructure,
  setModal,
  setEditing,
  setContext,
  showQuizToggle = true,
}) {
  // mở/đóng danh sách quiz theo lesson
  const [openLessonQuizzes, setOpenLessonQuizzes] = React.useState(new Set());

  // Drawer Editor cho Quiz
  const [editor, setEditor] = React.useState({
    open: false,
    lessonId: null,
    quizItem: null,
  });

  const toggleSession = (sid) => {
    setOpenSessions((prev) => {
      const n = new Set(prev);
      n.has(sid) ? n.delete(sid) : n.add(sid);
      return n;
    });
  };

  const toggleLessonQuizzes = (lessonId) => {
    setOpenLessonQuizzes((prev) => {
      const n = new Set(prev);
      n.has(lessonId) ? n.delete(lessonId) : n.add(lessonId);
      return n;
    });
  };

  /* ---------- Session actions ---------- */
  const openCreateSession = () => {
    setEditing({ session: null });
    setModal((m) => ({ ...m, session: true }));
  };
  const openEditSession = (s) => {
    setEditing({ session: s });
    setModal((m) => ({ ...m, session: true }));
  };
  const handleDeleteSession = async (id, e) => {
    e?.stopPropagation?.();
    try {
      await deleteSession(id);
      message.success("Đã xoá chương");
      await loadStructure();
    } catch (err) {
      const msg = err?.response?.data?.message || "Xoá chương thất bại";
      message.error(msg);
    }
  };

  /* ---------- Lesson actions ---------- */
  const openCreateLesson = (sessionId, lessons) => {
    setContext({ sessionId, lessonId: null, lessonCount: lessons?.length ?? 0 });
    setEditing({ lesson: null });
    setModal((m) => ({ ...m, lesson: true }));
  };
  const openEditLesson = (sessionId, lesson) => {
    setContext({ sessionId, lessonId: lesson.lessonId });
    setEditing({ lesson });
    setModal((m) => ({ ...m, lesson: true }));
  };
  const openViewLesson = (lesson) => {
    setEditing({ lesson });
    setModal((m) => ({ ...m, viewLesson: true }));
  };

  /* ---------- Assignment actions ---------- */
  // ✅ Assignment CHỈ gắn với session, không còn referenceLessonId
  const openCreateAssignment = (sessionId) => {
    setContext({ sessionId }); // không cần lessonId nữa
    setEditing({ assignment: null });
    setModal((m) => ({ ...m, assignment: true }));
  };
  const openEditAssignment = (sessionId, assignment) => {
    setContext({ sessionId }); // bỏ referenceLessonId
    setEditing({ assignment });
    setModal((m) => ({ ...m, assignment: true }));
  };
  const openViewAssignment = (assignment) => {
    setEditing({ assignment });
    setModal((m) => ({ ...m, viewAssignment: true }));
  };

  /* ---------- Quiz actions ---------- */
  const openCreateQuiz = (sessionId, lessonId) => {
    setEditor({ open: true, lessonId, quizItem: null });
  };

  const openEditQuizDrawer = (lessonId, quizItem) => {
    setEditor({ open: true, lessonId, quizItem });
  };

  const handleDeleteQuiz = async (lessonId, lessonQuestionIdOrQuestionId) => {
    try {
      await removeQuestionFromLesson(lessonId, lessonQuestionIdOrQuestionId);
      message.success("Đã xoá Quiz");
      await loadStructure();
    } catch (err) {
      const msg = err?.response?.data?.message || "Xoá Quiz thất bại";
      message.error(msg);
    }
  };

  /* ---------- Header bar ---------- */
  const HeaderBar = (
    <Space size={12} wrap>
      <Button
        size="large"
        icon={<ReloadOutlined />}
        onClick={() => loadStructure()}
      />
      <Button
        size="large"
        type="primary"
        icon={<PlusOutlined />}
        onClick={openCreateSession}
      >
        Thêm chương
      </Button>
    </Space>
  );

  /* ---------- UI ---------- */
  return (
    <>
      <Card
        size="small"
        bodyStyle={{ padding: 0 }}
        title={
          <Title level={5} style={{ margin: 0 }}>
            Danh sách bài học
          </Title>
        }
        extra={HeaderBar}
      >
        <div style={{ maxHeight: "78vh", overflowY: "auto", padding: 8 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Text type="secondary">Đang tải…</Text>
            </div>
          ) : !sessions?.length ? (
            <Empty description="Chưa có chương" />
          ) : (
            sessions.map((s) => (
              <div
                key={s.sessionId}
                style={{ borderBottom: "1px solid #f0f0f0" }}
              >
                {/* Session header */}
                <div
                  role="button"
                  onClick={() => toggleSession(s.sessionId)}
                  style={{
                    cursor: "pointer",
                    userSelect: "none",
                    padding: "10px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      display: "inline-flex",
                      justifyContent: "center",
                    }}
                  >
                    {openSessions.has(s.sessionId) ? (
                      <DownOutlined />
                    ) : (
                      <RightOutlined />
                    )}
                  </span>

                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Text
                      strong
                      style={{
                        fontSize: 16,
                        minWidth: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s?.title ?? s?.name ?? `Session ${s.sessionId}`}
                    </Text>
                    {/* <Tag color="blue">#{s.sessionId}</Tag> */}
                    {typeof s?.position === "number" && (
                      <Tag>pos {s.position}</Tag>
                    )}
                  </span>

                  <Space size={8} onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="middle"
                      icon={<EditOutlined />}
                      onClick={() => openEditSession(s)}
                    >
                      Sửa chương
                    </Button>

                    <Button
                      size="middle"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => openCreateLesson(s.sessionId, s.lessons)}
                    >
                      Thêm Bài Học
                    </Button>
                  </Space>
                </div>

                {/* Session body */}
                {openSessions.has(s.sessionId) && (
                  <div style={{ padding: "6px 8px 12px 8px" }}>
                    {/* Lessons */}
                    {s.lessons?.length ? (
                      s.lessons
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((l) => {
                          const t = detectType(l);
                          const meta = typeMeta[t];
                          const quizCount = l?.quizzes?.length || 0;
                          const isQuizOpen = showQuizToggle
                            ? openLessonQuizzes.has(l.lessonId)
                            : true;

                          return (
                            <div
                              key={l.lessonId}
                              style={{
                                padding: "10px 8px",
                                borderRadius: 8,
                                background: "#fff",
                                marginBottom: 6,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div style={{ width: 24, textAlign: "center" }}>
                                  {meta.icon}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      lineHeight: 1.2,
                                      cursor: "pointer",
                                      minWidth: 0,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                    onClick={() => openViewLesson(l)}
                                  >
                                    {l.title}
                                  </div>

                                  <div
                                    style={{
                                      color: "#8c8c8c",
                                      fontSize: 12,
                                      marginTop: 2,
                                      display: "flex",
                                      gap: 8,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span>{meta.label}</span>
                                    {typeof l.durationMinutes === "number" && (
                                      <span>• {l.durationMinutes} phút</span>
                                    )}
                                    {quizCount > 0 && (
                                      <span>• {quizCount} Quiz</span>
                                    )}
                                  </div>
                                </div>

                                <Space size={8}>
                                  <Tooltip title="Sửa bài học">
                                    <Button
                                      icon={<EditOutlined />}
                                      onClick={() =>
                                        openEditLesson(s.sessionId, l)
                                      }
                                    />
                                  </Tooltip>

                                  {showQuizToggle && (
                                    <Tooltip
                                      title={
                                        quizCount
                                          ? isQuizOpen
                                            ? "Ẩn danh sách Quiz"
                                            : "Hiện danh sách Quiz"
                                          : "Chưa có Quiz"
                                      }
                                    >
                                      <Button
                                        icon={
                                          isQuizOpen ? (
                                            <DownOutlined />
                                          ) : (
                                            <RightOutlined />
                                          )
                                        }
                                        disabled={!quizCount}
                                        onClick={() =>
                                          toggleLessonQuizzes(l.lessonId)
                                        }
                                      />
                                    </Tooltip>
                                  )}

                                  <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                      openCreateQuiz(s.sessionId, l.lessonId)
                                    }
                                  >
                                    Bài Quiz
                                  </Button>
                                </Space>
                              </div>

                              {/* Danh sách Quiz */}
                              {isQuizOpen && (
                                <div style={{ marginTop: 8, paddingLeft: 34 }}>
                                  {quizCount === 0 ? (
                                    <Text type="secondary">Chưa có Quiz</Text>
                                  ) : (
                                    <>
                                      <Text
                                        type="secondary"
                                        style={{
                                          fontSize: 12,
                                          display: "block",
                                          marginBottom: 4,
                                        }}
                                      >
                                        Danh sách Quiz:
                                      </Text>

                                      {l.quizzes.map((q, idx) => {
                                        const key =
                                          q?.lessonQuestionId ??
                                          q?.questionId ??
                                          `${l.lessonId}-${idx}`;
                                        const title = getQuestionText(q, idx);
                                        return (
                                          <div
                                            key={key}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              padding: "6px 0",
                                              borderTop: "1px dotted #f0f0f0",
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: 20,
                                                textAlign: "center",
                                              }}
                                            >
                                              <ThunderboltOutlined
                                                style={{ color: "#faad14" }}
                                              />
                                            </div>

                                            <div
                                              style={{ flex: 1, minWidth: 0 }}
                                            >
                                              <div
                                                title={title}
                                                style={{
                                                  fontWeight: 500,
                                                  cursor: "pointer",
                                                  fontSize: 13,
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                }}
                                                onClick={() =>
                                                  openEditQuizDrawer(
                                                    l.lessonId,
                                                    q
                                                  )
                                                }
                                              >
                                                {/* #{q?.orderIndex ?? idx} ·{" "} */}
                                                {title}
                                                {(q?.isRequired ?? false) && (
                                                  <Tag
                                                    color="red"
                                                    style={{ marginLeft: 8 }}
                                                  >
                                                    Bắt buộc
                                                  </Tag>
                                                )}
                                              </div>
                                            </div>

                                            <Space size={8}>
                                              <Tooltip title="Chỉnh sửa Quiz">
                                                <Button
                                                  icon={<EditOutlined />}
                                                  size="small"
                                                  onClick={() =>
                                                    openEditQuizDrawer(
                                                      l.lessonId,
                                                      q
                                                    )
                                                  }
                                                />
                                              </Tooltip>

                                              <Popconfirm
                                                title="Xoá Quiz?"
                                                description="Hành động này không thể hoàn tác."
                                                okText="Xoá"
                                                okButtonProps={{ danger: true }}
                                                cancelText="Huỷ"
                                                onConfirm={() =>
                                                  handleDeleteQuiz(
                                                    l.lessonId,
                                                    q?.question?.questionId ??
                                                      q?.questionId
                                                  )
                                                }
                                              >
                                                <Button
                                                  icon={<DeleteOutlined />}
                                                  size="small"
                                                  danger
                                                />
                                              </Popconfirm>
                                            </Space>
                                          </div>
                                        );
                                      })}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                    ) : (
                      <div style={{ padding: "6px 28px" }}>
                        <Text type="secondary">Chưa có bài học</Text>
                      </div>
                    )}

                    {/* Assignments */}
                    <div style={{ marginTop: 10, padding: "6px 8px 0 8px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text strong>Bài tập theo chương</Text>
                        <span style={{ flex: 1 }} />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => openCreateAssignment(s.sessionId)}
                        >
                          Thêm bài tập
                        </Button>
                      </div>

                      {s.assignments?.length ? (
                        s.assignments.map((a) => (
                          <div
                            key={a.assignmentId}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "8px 0",
                              borderTop: "1px dotted #f0f0f0",
                            }}
                          >
                            <div style={{ width: 20, textAlign: "center" }}>
                              <TrophyOutlined style={{ color: "#1890ff" }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  fontSize: 13,
                                }}
                                onClick={() => openViewAssignment(a)}
                              >
                                {a.title}
                              </div>
                              <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                                Điểm tối đa: {a.maxScore ?? 100}
                              </div>
                            </div>
                            <Space size={8}>
                              <Tooltip title="Xem chi tiết">
                                <Button
                                  icon={<EyeOutlined />}
                                  size="small"
                                  onClick={() => openViewAssignment(a)}
                                />
                              </Tooltip>
                              <Tooltip title="Sửa bài tập">
                                <Button
                                  icon={<EditOutlined />}
                                  size="small"
                                  onClick={() =>
                                    openEditAssignment(s.sessionId, a)
                                  }
                                />
                              </Tooltip>
                            </Space>
                          </div>
                        ))
                      ) : (
                        <Text type="secondary">Chưa có bài tập</Text>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Drawer Editor cho Quiz */}
      <QuizEditorDrawer
        open={editor.open}
        lessonId={editor.lessonId}
        quizItem={editor.quizItem}
        onSaved={loadStructure}
        onDeleted={loadStructure}
        onClose={() =>
          setEditor({ open: false, lessonId: null, quizItem: null })
        }
      />
    </>
  );
}
