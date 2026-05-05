import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Breadcrumb,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Radio,
  Button,
  Tag,
  Space,
  Input,
  Tooltip,
  Spin,
  message,
  Checkbox,
  Popconfirm,
  notification,
} from "antd";
import {
  ClockCircleOutlined,
  ArrowRightOutlined,
  QuestionCircleOutlined,
  CodeOutlined,
  PlayCircleOutlined,
  FormatPainterOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  FullscreenOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import Editor from "@monaco-editor/react";
import { getExamDetails, submitExam } from "../../../../services/examService";

dayjs.extend(duration);

const { Title, Text, Paragraph } = Typography;

// --- COLOR PALETTE ---
const PRIMARY = "#AB1F24";
const LIGHT_BORDER = "#E5E7EB";
const MUTED = "#AB1F24";

// --- HELPER FUNCTIONS ---
const safeParseChoices = (choicesData) => {
  if (!choicesData) return [];
  if (Array.isArray(choicesData)) return choicesData;
  try {
    return JSON.parse(choicesData);
  } catch (error) {
    if (typeof choicesData === "string") {
      return choicesData.split(",").map((item) => item.trim());
    }
    return [];
  }
};

const mockRunCodeAndGetResults = (code, testCasesRaw) => {
  let testCases = [];
  try {
    testCases =
      typeof testCasesRaw === "string"
        ? JSON.parse(testCasesRaw)
        : testCasesRaw;
  } catch (e) {
    testCases = [];
  }

  if (!Array.isArray(testCases) || testCases.length === 0) return [];
  const hasValidCode = code && code.trim().length > 10;

  return testCases.map((tc) => ({
    id: tc.id,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    actualOutput: hasValidCode ? tc.expectedOutput : "No output / Empty Code",
    isCorrect: hasValidCode,
    isHidden: tc.isHidden,
  }));
};

// --- COMPONENTS ---

// CountdownTimer giữ nguyên style đã chỉnh
const CountdownTimer = ({ targetTime, onTimeout, isSlotCountdown = false }) => {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, dayjs(targetTime).diff(dayjs(), "second"))
  );
  const intervalRef = useRef(null);

  useEffect(() => {
    if (targetTime) {
      const initialDiff = Math.max(
        0,
        dayjs(targetTime).diff(dayjs(), "second")
      );
      setTimeLeft(initialDiff);

      intervalRef.current = setInterval(() => {
        const secondsLeft = Math.max(
          0,
          dayjs(targetTime).diff(dayjs(), "second")
        );
        setTimeLeft(secondsLeft);
        if (secondsLeft === 0) {
          clearInterval(intervalRef.current);
          onTimeout?.();
        }
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [targetTime, onTimeout]);

  const durationObj = dayjs.duration(timeLeft, "seconds");
  const hours = Math.floor(durationObj.asHours());
  const minutes = durationObj.minutes();
  const seconds = durationObj.seconds();

  const formattedTime = `${
    hours > 0 ? hours.toString().padStart(2, "0") + ":" : ""
  }${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const timerStyle = isSlotCountdown
    ? {
        fontSize: "1.2em",
        color: PRIMARY,
        margin: "8px 0 12px",
        border: "1px solid #AB1F24",
        borderRadius: "4px",
        padding: "5px 15px",
        background: "#FFF6F7",
        display: "inline-block",
      }
    : {
        fontSize: "1.2em",
        color: PRIMARY,
        margin: "15px 0 20px",
        border: "1px solid #AB1F24",
        borderRadius: "4px",
        padding: "10px 20px",
        background: "#FFF6F7",
        display: "inline-block",
      };

  return (
    <Tag color="default" style={timerStyle} bordered={isSlotCountdown}>
      <ClockCircleOutlined
        style={{
          marginRight: 10,
          color: isSlotCountdown ? MUTED : PRIMARY,
          verticalAlign: "middle",
        }}
      />
      <span style={{ verticalAlign: "middle" }}>{formattedTime}</span>
    </Tag>
  );
};

// ExamStatusScreen giữ nguyên style đã chỉnh
const ExamStatusScreen = ({
  messageText,
  subText,
  targetTime,
  showTimer = false,
  catImage,
  onTimeout,
  isSlotCountdown = false,
  customAction = null,
}) => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 200px)",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <img
        src={`/images/status/${catImage}`}
        alt="Status"
        style={{ width: "300px", marginBottom: "25px" }}
      />
      <Title level={2} style={{ color: "#262626" }}>
        {messageText}
      </Title>
      <Text
        type="secondary"
        style={{ fontSize: "16px", marginBottom: "8px", display: "block" }}
      >
        {subText}
      </Text>

      {showTimer && targetTime && (
        <CountdownTimer
          targetTime={targetTime}
          onTimeout={onTimeout}
          isSlotCountdown={isSlotCountdown}
        />
      )}

      {customAction ? (
        customAction
      ) : (
        <Button
          type="primary"
          danger
          onClick={() => navigate("/dashboard")}
          style={{
            marginTop: "16px",
            width: 180,
            height: 45,
            borderRadius: "6px",
            backgroundColor: PRIMARY,
            borderColor: PRIMARY,
          }}
        >
          Về trang chủ <ArrowRightOutlined />
        </Button>
      )}
    </div>
  );
};

export default function TakeQuizPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const [examDetails, setExamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);
  const [slotEndTime, setSlotEndTime] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [codingResults, setCodingResults] = useState({});
  const [hasEnteredExam, setHasEnteredExam] = useState(false);

  const submissionTriggeredRef = useRef(false);
  const answersRef = useRef(answers);
  const editorRefs = useRef({});

  // Tất cả các bài thi đều ở chế độ nghiêm ngặt (toàn màn hình và chống gian lận)
  const isStrictExam = true;

  useEffect(() => {
    if (!sessionId) {
      message.error("Không tìm thấy mã kỳ thi.");
      navigate("/dashboard");
      return;
    }
    setLoading(true);
    getExamDetails(sessionId)
      .then((resp) => {
        const details = resp.data?.data;
        setExamDetails(details);

        const initialAnswers = {};
        (details?.exam?.examQuestions || []).forEach((q) => {
          if (q.questionType === "CODING" && q.starterCode) {
            initialAnswers[q.exQId] = q.starterCode;
          }
        });
        setAnswers(initialAnswers);
      })
      .catch((err) => {
        message.error(err.response?.data?.message || "Lỗi tải bài thi.");
        navigate("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [sessionId, navigate, refetchTrigger]);

  // --- LOGIC PHÂN LOẠI TRẠNG THÁI CHÍNH XÁC ---
  const { examStatus, activeSlotData, reason } = useMemo(() => {
    if (loading || !examDetails)
      return { examStatus: "loading", activeSlotData: null, reason: null };

    const exam = examDetails.exam;
    const canAttemptOverall = examDetails.canAttempt;
    const reasonOverall = examDetails.reason;
    const now = dayjs();

    const sortedSlots = [...(exam.examSlots || [])].sort((a, b) =>
      dayjs(a.slotTime).diff(dayjs(b.slotTime))
    );

    let currentActiveSlot = null;
    let nearestUpcomingSlot = null;
    let allSlotsEnded = true; // Cờ kiểm tra xem tất cả ca thi đã qua chưa

    for (const slot of sortedSlots) {
      const slotStart = dayjs(slot.slotTime);
      const slotEnd = slotStart.add(exam.durationMinutes, "minute");

      if (now.isBefore(slotEnd)) {
        allSlotsEnded = false; // Vẫn còn ca thi chưa kết thúc
      }

      if (now.isAfter(slotStart) && now.isBefore(slotEnd)) {
        currentActiveSlot = slot;
        break;
      } else if (now.isBefore(slotStart)) {
        if (!nearestUpcomingSlot) {
          nearestUpcomingSlot = slot;
        }
      }
    }

    // 1. TRƯỜNG HỢP ĐÃ NỘP BÀI / HẾT LƯỢT
    if (!canAttemptOverall && reasonOverall?.includes("hết số lần")) {
      return {
        examStatus: "submitted",
        activeSlotData: null,
        reason: reasonOverall,
      };
    }

    // 2. TRƯỜNG HỢP ĐANG DIỄN RA
    if (canAttemptOverall && currentActiveSlot) {
      return { examStatus: "active", activeSlotData: currentActiveSlot };
    }

    // 3. TRƯỜNG HỢP SẮP DIỄN RA (Chưa tới giờ thi)
    if (nearestUpcomingSlot) {
      return {
        examStatus: "slot_upcoming",
        activeSlotData: nearestUpcomingSlot,
        reason: reasonOverall || "Sắp tới giờ thi.",
      };
    }

    // 4. TRƯỜNG HỢP KẾT THÚC (Bài thi đã kết thúc)
    if (
      (!canAttemptOverall && reasonOverall?.includes("kết thúc")) ||
      allSlotsEnded
    ) {
      return {
        examStatus: "exam_finished",
        activeSlotData: null,
        reason: reasonOverall || "Tất cả các ca thi đã kết thúc.",
      };
    }

    // Fallback: Lỗi không xác định
    return {
      examStatus: "error",
      activeSlotData: null,
      reason: reasonOverall || "Trạng thái không xác định.",
    };
  }, [loading, examDetails]);

  useEffect(() => {
    if (examStatus === "active" && activeSlotData) {
      setActiveSlot(activeSlotData);
      const endTime = dayjs(activeSlotData.slotTime).add(
        examDetails.exam.durationMinutes,
        "minute"
      );
      setSlotEndTime(endTime);
    } else {
      setActiveSlot(null);
      setSlotEndTime(null);
    }
  }, [examStatus, activeSlotData, examDetails]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const questions = useMemo(
    () =>
      (examDetails?.exam?.examQuestions || []).sort(
        (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
      ),
    [examDetails]
  );

  const handlePick = (qid, value) =>
    setAnswers((s) => ({ ...s, [qid]: value }));

  const handleEditorDidMount = (editor, monaco, qId) => {
    editorRefs.current[qId] = editor;
  };
  const handleFormatCode = (qId) => {
    editorRefs.current[qId]?.getAction("editor.action.formatDocument").run();
  };

  const handleRunCode = (questionId, code, testCasesRaw) => {
    message.loading({ content: "Đang chạy thử...", key: "running" });
    setTimeout(() => {
      const results = mockRunCodeAndGetResults(code, testCasesRaw);
      setCodingResults((prev) => ({ ...prev, [questionId]: results }));
      message.success({ content: "Đã có kết quả chạy thử!", key: "running" });
    }, 500);
  };

  const submitExamInternal = useCallback(
    (slotIdToSubmit) => {
      const currentAnswers = answersRef.current;
      const submissionAnswers = Object.keys(currentAnswers).map((key) => {
        const qId = parseInt(key);
        const q = questions.find((q) => q.exQId === qId);
        const answerValue = currentAnswers[key];
        const isMcqType = ["MCQ", "MULTI", "TRUE_FALSE"].includes(
          q?.questionType
        );
        let selectedOptions = [];
        if (isMcqType) {
          if (Array.isArray(answerValue)) selectedOptions = answerValue;
          else if (answerValue) selectedOptions = [answerValue];
        }
        let finalTestCaseResults = null;
        if (q?.questionType === "CODING") {
          finalTestCaseResults = mockRunCodeAndGetResults(
            answerValue,
            q.testCases
          );
        }
        return {
          questionId: qId,
          selectedOptions: selectedOptions,
          answerText: isMcqType ? null : answerValue,
          testCaseResults: finalTestCaseResults,
        };
      });

      const payload = {
        examId: parseInt(sessionId),
        answers: submissionAnswers,
        slotId: slotIdToSubmit,
        violationCount: 0, // Gửi 0 vì logic cảnh báo đã bị loại bỏ
      };

      submitExam(payload)
        .then((resp) => {
          const result = resp.data?.data;
          message.success("Nộp bài thành công!");
          let scoreDisplay =
            result?.score !== null
              ? parseFloat(result.score).toFixed(2)
              : "Chờ chấm";
          if (result?.gradedAt === null)
            scoreDisplay = "Chờ chấm (Bài có tự luận)";
          navigate("/dashboard", {
            state: { showScoreModal: true, score: scoreDisplay },
          });
        })
        .catch((err) => {
          console.error(err);
          message.error(err.response?.data?.message || "Nộp bài thất bại.");
        })
        .finally(() => setSubmitting(false));
    },
    [questions, sessionId, navigate]
  );

  const handleSubmit = useCallback(
    (forceSubmit = false) => {
      if (submissionTriggeredRef.current) return;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      const targetSlotId = activeSlot?.slotId;
      if (!targetSlotId) {
        message.warn("Lỗi: Không tìm thấy ca thi.");
        return;
      }
      submissionTriggeredRef.current = true;
      setSubmitting(true);
      submitExamInternal(targetSlotId);
    },
    [activeSlot, submitExamInternal]
  );

  const handleSlotStart = useCallback(() => {
    message.info("Đã đến giờ thi! Đang tải lại...", 2);
    setLoading(true);
    setRefetchTrigger((p) => p + 1);
  }, []);

  const handleTimeout = useCallback(() => {
    if (submissionTriggeredRef.current) return;
    if (slotEndTime) {
      message.warning("Đã hết giờ! Hệ thống đang tự động nộp bài...");
      handleSubmit(true);
    } else {
      handleSlotStart();
    }
  }, [slotEndTime, handleSubmit, handleSlotStart]);

  const handleStartExamClick = () => {
    try {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setHasEnteredExam(true);
        })
        .catch((e) => {
          setHasEnteredExam(true);
        });
    } catch (e) {
      setHasEnteredExam(true);
    }
  };

  // Tự động nộp bài khi phát hiện vi phạm
  useEffect(() => {
    if (examStatus !== "active" || !hasEnteredExam || !isStrictExam) return;

    const handleViolation = () => {
      if (submissionTriggeredRef.current) return;
      message.error(
        "Hệ thống phát hiện vi phạm. Bài thi sẽ được nộp tự động.",
        5
      );
      handleSubmit(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") handleViolation();
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) handleViolation();
    };
    const handleContextMenu = (e) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [examStatus, hasEnteredExam, isStrictExam, handleSubmit]);

  if (examStatus === "loading") return <Spin tip="Đang tải..." fullscreen />;

  // --- RENDER CÁC TRẠNG THÁI THEO YÊU CẦU ---

  if (examStatus === "submitted") {
    return (
      <ExamStatusScreen
        messageText="Bạn đã làm bài thi rồi!"
        subText="Bài thi đã được làm, hãy quay lại trang chủ bạn nhé."
        catImage="complete.png"
      />
    );
  }

  if (examStatus === "exam_finished") {
    return (
      <ExamStatusScreen
        messageText="Bài thi đã kết thúc!"
        subText="Bài thi đã kết thúc, hãy quay lại trang chủ bạn nhé."
        catImage="testend.png"
      />
    );
  }

  if (examStatus === "slot_upcoming") {
    const targetTime = activeSlotData?.slotTime;
    return (
      <ExamStatusScreen
        messageText="Chưa tới thời gian thi"
        subText="Bình tĩnh, tự tin để đạt kết quả tốt nhất nha!"
        catImage="comeearly.png"
        targetTime={targetTime}
        showTimer={!!targetTime}
        onTimeout={handleSlotStart}
        isSlotCountdown={true}
      />
    );
  }

  if (examStatus === "error") {
    return (
      <ExamStatusScreen
        messageText="Lỗi truy cập"
        subText={reason || "Không thể xác định trạng thái bài thi."}
        catImage="cat_error.png"
      />
    );
  }

  if (examStatus === "active" && !hasEnteredExam) {
    return (
      <ExamStatusScreen
        messageText="Sẵn sàng làm bài?"
        subText={
          isStrictExam
            ? "Bài thi yêu cầu chế độ toàn màn hình. Hệ thống sẽ tự động bật khi bạn nhấn nút bên dưới."
            : "Chúc bạn làm bài thi thật tốt!"
        }
        catImage="comeearly.png"
        customAction={
          <Button
            type="primary"
            size="large"
            onClick={handleStartExamClick}
            style={{
              marginTop: "20px",
              width: 200,
              height: 50,
              fontSize: "18px",
              fontWeight: "bold",
              borderRadius: "8px",
              backgroundColor: PRIMARY,
              borderColor: PRIMARY,
            }}
            icon={<FullscreenOutlined />}
          >
            Bắt đầu làm bài
          </Button>
        }
      />
    );
  }

  if (examStatus === "active" && examDetails?.exam && hasEnteredExam) {
    const exam = examDetails.exam;
    const numberList = Array.from(
      { length: questions.length },
      (_, i) => i + 1
    );

    return (
      <div style={{ maxWidth: 1280, margin: "24px auto", padding: "0 24px" }}>
        <Breadcrumb
          style={{ margin: "16px 0" }}
          items={[
            { title: "Trang chủ" },
            { title: "Bài kiểm tra" },
            { title: exam.title },
          ]}
        />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <div>
              {questions.map((q, idx) => (
                <Card
                  id={`q_${idx + 1}`}
                  key={q.exQId}
                  variant="outlined"
                  style={{ marginBottom: 18, borderRadius: 8 }}
                >
                  <Title level={5}>
                    Câu {idx + 1} ({parseFloat(q.points).toFixed(1)} điểm)
                  </Title>
                  <div
                    dangerouslySetInnerHTML={{ __html: q.questionText }}
                    style={{ marginBottom: 12, fontSize: 15 }}
                  />
                  {q.questionType === "MCQ" && (
                    <Radio.Group
                      onChange={(e) => handlePick(q.exQId, e.target.value)}
                      value={answers[q.exQId]}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {safeParseChoices(q.choices).map((opt, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "10px",
                            border:
                              answers[q.exQId] === opt
                                ? `1px solid ${PRIMARY}`
                                : `1px solid ${LIGHT_BORDER}`,
                            borderRadius: 8,
                            background:
                              answers[q.exQId] === opt ? "#FFF1F2" : "#fff",
                          }}
                        >
                          <Radio value={opt}>{opt}</Radio>
                        </div>
                      ))}
                    </Radio.Group>
                  )}
                  {q.questionType === "MULTI" && (
                    <Checkbox.Group
                      onChange={(values) => handlePick(q.exQId, values)}
                      value={answers[q.exQId] || []}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {safeParseChoices(q.choices).map((opt, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "10px",
                            border: (answers[q.exQId] || []).includes(opt)
                              ? `1px solid ${PRIMARY}`
                              : `1px solid ${LIGHT_BORDER}`,
                            borderRadius: 8,
                            background: (answers[q.exQId] || []).includes(opt)
                              ? "#FFF1F2"
                              : "#fff",
                          }}
                        >
                          <Checkbox value={opt}>{opt}</Checkbox>
                        </div>
                      ))}
                    </Checkbox.Group>
                  )}
                  {q.questionType === "TRUE_FALSE" && (
                    <div style={{ marginTop: 16 }}>
                      <Radio.Group
                        onChange={(e) => handlePick(q.exQId, e.target.value)}
                        value={answers[q.exQId]}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {["True", "False"].map((opt, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "10px",
                              border:
                                answers[q.exQId] === opt
                                  ? `1px solid ${PRIMARY}`
                                  : `1px solid ${LIGHT_BORDER}`,
                              borderRadius: 8,
                              background:
                                answers[q.exQId] === opt ? "#FFF1F2" : "#fff",
                            }}
                          >
                            <Radio value={opt}>{opt}</Radio>
                          </div>
                        ))}
                      </Radio.Group>
                    </div>
                  )}
                  {q.questionType === "SHORT_ANSWER" && (
                    <div style={{ marginTop: 16 }}>
                      <Input.TextArea
                        rows={4}
                        placeholder="Nhập câu trả lời của bạn..."
                        value={answers[q.exQId] || ""}
                        onChange={(e) => handlePick(q.exQId, e.target.value)}
                        style={{
                          borderColor: LIGHT_BORDER,
                          borderRadius: 8,
                          fontSize: 15,
                        }}
                      />
                    </div>
                  )}
                  {q.questionType === "CODING" && (
                    <div style={{ marginTop: 16 }}>
                      <div
                        style={{
                          border: "1px solid #434343",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            background: "#1f1f1f",
                            padding: "8px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid #434343",
                          }}
                        >
                          <Space>
                            <CodeOutlined style={{ color: "#a9a9a9" }} />
                            <Text style={{ color: "#e0e0e0", fontWeight: 500 }}>
                              {q.language ? q.language.toUpperCase() : "JAVA"}
                            </Text>
                          </Space>
                          <Space>
                            <Button
                              type="text"
                              size="small"
                              icon={<FormatPainterOutlined />}
                              style={{ color: "#a9a9a9" }}
                              onClick={() => handleFormatCode(q.exQId)}
                            >
                              Format
                            </Button>
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlayCircleOutlined />}
                              onClick={() =>
                                handleRunCode(
                                  q.exQId,
                                  answers[q.exQId],
                                  q.testCases
                                )
                              }
                              style={{
                                background: "#238636",
                                borderColor: "#238636",
                                fontWeight: 600,
                              }}
                            >
                              Run & Test
                            </Button>
                          </Space>
                        </div>
                        <Editor
                          height="400px"
                          language={
                            q.language ? q.language.toLowerCase() : "java"
                          }
                          theme="vs-dark"
                          value={answers[q.exQId] || ""}
                          onMount={(editor, monaco) =>
                            handleEditorDidMount(editor, monaco, q.exQId)
                          }
                          onChange={(value) => handlePick(q.exQId, value)}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: "'Fira Code', monospace",
                            automaticLayout: true,
                            tabSize: 4,
                            formatOnType: true,
                          }}
                        />
                      </div>
                      {codingResults[q.exQId] && (
                        <div
                          style={{
                            marginTop: 12,
                            background: "#FAFAFA",
                            border: "1px solid #E5E7EB",
                            borderRadius: 8,
                            padding: 16,
                          }}
                        >
                          <Text
                            strong
                            style={{ display: "block", marginBottom: 8 }}
                          >
                            Kết quả chạy thử (Mock):
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 12,
                            }}
                          >
                            {codingResults[q.exQId].map((res, idx) => (
                              <Tag
                                key={idx}
                                color={res.isCorrect ? "success" : "error"}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 4,
                                  fontSize: 13,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                {res.isCorrect ? (
                                  <CheckCircleFilled />
                                ) : (
                                  <CloseCircleFilled />
                                )}{" "}
                                Test Case #{idx + 1}:{" "}
                                {res.isCorrect ? "Pass" : "Fail"}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div style={{ position: "sticky", top: 84 }}>
              <Card title="Thông tin bài làm" variant="outlined">
                {slotEndTime && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <CountdownTimer
                      targetTime={slotEndTime}
                      onTimeout={handleTimeout}
                      isSlotCountdown={false}
                    />
                  </div>
                )}
                <Title level={5}>{exam.title}</Title>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Row>
                    <Col span={12}>
                      <Text type="secondary">Môn:</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      <Text strong>{exam.className}</Text>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={12}>
                      <Text type="secondary">Thời gian:</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      <Text>{exam.durationMinutes} phút</Text>
                    </Col>
                  </Row>
                </Space>
                <Divider style={{ margin: "16px 0" }} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 8,
                  }}
                >
                  {numberList.map((n) => {
                    const q = questions[n - 1];
                    const isDone =
                      answers[q.exQId] &&
                      answers[q.exQId] !== "" &&
                      answers[q.exQId] !== q.starterCode;
                    return (
                      <Button
                        key={n}
                        size="small"
                        type={isDone ? "primary" : "default"}
                        ghost={isDone}
                        style={{
                          borderColor: isDone ? "#16A34A" : undefined,
                          color: isDone ? "#16A3A" : undefined,
                          background: isDone ? "#ECFDF5" : undefined,
                        }}
                        onClick={() =>
                          document.getElementById(`q_${n}`)?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          })
                        }
                      >
                        {n}
                      </Button>
                    );
                  })}
                </div>
                <Divider style={{ margin: "16px 0" }} />
                <Popconfirm
                  title="Xác nhận nộp bài"
                  description="Bạn có chắc chắn muốn nộp bài?"
                  onConfirm={() => handleSubmit(false)}
                  okText="Nộp bài"
                  cancelText="Hủy"
                  icon={<QuestionCircleOutlined style={{ color: PRIMARY }} />}
                >
                  <Button
                    type="primary"
                    size="large"
                    block
                    style={{
                      background: PRIMARY,
                      borderColor: PRIMARY,
                      fontWeight: 600,
                    }}
                    loading={submitting}
                  >
                    Nộp bài
                  </Button>
                </Popconfirm>
              </Card>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <ExamStatusScreen
      status="fallback"
      messageText="Lỗi tải trang"
      subText="Không thể xác định trạng thái bài thi."
      catImage="cat_error.png"
    />
  );
}