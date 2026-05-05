import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Row,
  Col,
  Typography,
  Button,
  Radio,
  Divider,
  Progress,
  message,
  Checkbox,
  Spin,
} from "antd";
import { ArrowRightOutlined, ReloadOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import {
  listQuestionsByLesson,
  parseQuestionChoices,
  saveQuizAttempt,
  getQuizAttemptHistory,
} from "../../services/lessonQuestionService";

const { Title, Text, Paragraph } = Typography;

const IntroCard = ({ meta, onStart }) => (
  <Row>
    <Col span={24}>
      <div
        style={{
          border: "1px solid #DDDDDD",
          borderRadius: 12,
          padding: 24,
          background: "#FAFAFA",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <img
            src={"/images/lesson-quizz.png"}
            alt="Quiz"
            style={{
              width: 359,
              height: 288,
              margin: "8px auto 12px",
              objectFit: "contain",
            }}
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/359x288/fafafa/ddddDD?text=Quiz";
            }}
          />
          <Title level={4} style={{ margin: "0 0 6px" }}>
            {meta.title}
          </Title>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: "#676767",
              marginBottom: 10,
            }}
          >
            <Text type="secondary">Bài kiểm tra</Text>
            <span
              style={{
                width: 4,
                height: 4,
                background: "#676767",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            <Text type="secondary">{meta.count} câu hỏi</Text>
          </div>
          <Paragraph style={{ color: "#6b7280", margin: "8px 0 16px" }}>
            {meta.description ||
              "Hãy hoàn thành bài kiểm tra để tiếp tục bài học."}
          </Paragraph>
          <Button
            type="primary"
            onClick={onStart}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            style={{
              background: "#DD673C",
              borderColor: "#DD673C",
              height: 44,
              borderRadius: 10,
              paddingInline: 20,
            }}
          >
            Bắt đầu làm bài
          </Button>
        </div>
      </div>
    </Col>
  </Row>
);

const checkAnswerCorrect = (userAnswers = [], correctIndices = []) => {
  if (userAnswers.length !== correctIndices.length) {
    return false;
  }
  const sortedUser = [...userAnswers].sort();
  const sortedCorrect = [...correctIndices].sort();
  return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
};

const QuizPlay = ({ data, onFinish, lessonId, attemptNumber }) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [remain, setRemain] = useState(data.durationSec ?? 0);
  const isSubmittedRef = useRef(false);
  const [allAnswers, setAllAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const q = useMemo(() => data.questions[index], [data.questions, index]);

  const handleFinishQuiz = useCallback(
    async (autoSubmitReason = null) => {
      if (isSubmittedRef.current) return;
      isSubmittedRef.current = true;
      setIsSubmitting(true);

      if (autoSubmitReason) {
        message.warning(`Bài quiz đã tự động nộp vì ${autoSubmitReason}.`, 5);
      }

      const finalAnswers = {
        ...allAnswers,
        ...(answers.length > 0 && { [q.id]: answers }),
      };

      const submissionAnswers = Object.keys(finalAnswers).map((questionId) => ({
        questionId: Number(questionId),
        answer: JSON.stringify(finalAnswers[questionId].sort()),
      }));

      const submissionDTO = {
        lessonId: parseInt(lessonId, 10),
        submittedBy: 1, // This should come from redux store ideally
        answers: submissionAnswers,
        attemptNumber: attemptNumber, // Include attempt number
      };

      try {
        const result = await saveQuizAttempt(lessonId, submissionDTO);
        message.success("Nộp bài thành công!");
        onFinish(result);
      } catch (error) {
        console.error("Lỗi khi nộp bài:", error);
        message.error("Đã có lỗi xảy ra khi nộp bài. Vui lòng thử lại.");
        isSubmittedRef.current = false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [allAnswers, answers, q, lessonId, onFinish, attemptNumber]
  );

  useEffect(() => {
    const t = setInterval(() => setRemain((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remain === 0) {
      handleFinishQuiz("Hết giờ");
    }
  }, [remain, handleFinishQuiz]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleFinishQuiz("Bạn đã rời khỏi màn hình làm bài");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleFinishQuiz]);

  const handleNext = () => {
    if (!showResult) {
      setShowResult(true);
      const isCorrect = checkAnswerCorrect(answers, q.correctIndices);
      setAllAnswers((prev) => ({
        ...prev,
        [q.id]: answers,
      }));
      return;
    }

    setShowResult(false);
    setAnswers([]);

    if (index < data.questions.length - 1) {
      setIndex(index + 1);
    } else {
      handleFinishQuiz();
    }
  };

  return (
    <div
      style={{
        border: "1px solid #eaeaea",
        borderRadius: 12,
        padding: 20,
        background: "#fff",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">Thời gian còn lại: </Text>
        <Text style={{ color: "#FF3B30" }}>
          {String(Math.floor(remain / 60)).padStart(2, "0")}:
          {String(remain % 60).padStart(2, "0")}
        </Text>
      </div>

      <Title level={4} style={{ marginTop: 0 }}>
        Câu số {index + 1}
      </Title>
      <Title level={4} style={{ marginTop: 0, fontWeight: 700 }}>
        {q.text}
      </Title>
      {q.isMultiSelect && !showResult && (
        <Text type="secondary" style={{ display: "block", marginBottom: 10 }}>
          Câu hỏi này có nhiều đáp án đúng.
        </Text>
      )}

      <div style={{ marginTop: 12 }}>
        {q.isMultiSelect ? (
          <Checkbox.Group
            onChange={(checkedValues) => setAnswers(checkedValues)}
            value={answers}
            style={{ width: "100%" }}
            disabled={showResult}
          >
            {q.options.map((opt, i) => {
              const state =
                showResult && q.correctIndices.includes(i)
                  ? "correct"
                  : showResult &&
                    answers.includes(i) &&
                    !q.correctIndices.includes(i)
                  ? "wrong"
                  : "normal";

              const bg =
                state === "correct"
                  ? "#28a745"
                  : state === "wrong"
                  ? "#dc3545"
                  : "transparent";
              const color = state === "normal" ? "inherit" : "#fff";
              const border =
                state === "normal" ? "1px solid #d9d9d9" : `1px solid ${bg}`;

              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 6,
                    padding: 8,
                    background: bg,
                    marginBottom: 10,
                    border: border,
                    color: color,
                  }}
                >
                  <Checkbox
                    value={i}
                    style={{ width: "100%", color: "inherit" }}
                    disabled={showResult}
                  >
                    <span style={{ color: "inherit" }}>{opt}</span>
                  </Checkbox>
                </div>
              );
            })}
          </Checkbox.Group>
        ) : (
          <Radio.Group
            onChange={(e) => setAnswers([e.target.value])}
            value={answers[0] ?? null}
            style={{ width: "100%" }}
            disabled={showResult}
          >
            {q.options.map((opt, i) => {
              const state =
                showResult && q.correctIndices.includes(i)
                  ? "correct"
                  : showResult &&
                    answers.includes(i) &&
                    !q.correctIndices.includes(i)
                  ? "wrong"
                  : "normal";

              const bg =
                state === "correct"
                  ? "#28a745"
                  : state === "wrong"
                  ? "#dc3545"
                  : "transparent";
              const color = state === "normal" ? "inherit" : "#fff";
              const border =
                state === "normal" ? "1px solid #d9d9d9" : `1px solid ${bg}`;

              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 6,
                    padding: 8,
                    background: bg,
                    marginBottom: 10,
                    border: border,
                    color: color,
                  }}
                >
                  <Radio
                    value={i}
                    style={{ width: "100%", color: "inherit" }}
                    disabled={showResult}
                  >
                    <span style={{ color: "inherit" }}>{opt}</span>
                  </Radio>
                </div>
              );
            })}
          </Radio.Group>
        )}
      </div>

      <Divider style={{ margin: "12px 0" }} />

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="primary"
          onClick={handleNext}
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          disabled={answers.length === 0 || isSubmitting}
          loading={isSubmitting}
          style={{
            background: "#fef1ec",
            borderColor: "#fef1ec",
            color: "#f37142",
            height: 40,
            borderRadius: 8,
          }}
        >
          {isSubmitting
            ? "Đang nộp bài..."
            : index < data.questions.length - 1
            ? showResult
              ? "Câu tiếp theo"
              : "Kiểm tra"
            : showResult
            ? "Hoàn thành"
            : "Kiểm tra"}
        </Button>
      </div>
    </div>
  );
};

const ResultCard = ({ score, onRetry, onNext }) => {
  const pass = score >= 50;
  return (
    <Row>
      <Col span={24}>
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 24,
            background: "#fff",
          }}
        >
          <Row gutter={[24, 0]} align="middle">
            <Col xs={24} md={12} style={{ textAlign: "center" }}>
              <img
                src={pass ? "/images/pass.png" : "/images/fail.png"}
                alt={pass ? "pass" : "fail"}
                style={{ maxWidth: "100%", width: 359, height: 355 }}
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/359x355/${
                    pass ? "e8f5e9" : "ffebee"
                  }/${pass ? "388e3c" : "c62828"}?text=${
                    pass ? "Passed!" : "Failed"
                  }`;
                }}
              />
            </Col>
            <Col xs={24} md={12}>
              <div>
                <Progress
                  type="dashboard"
                  percent={score}
                  strokeColor="#DD673C"
                  gapDegree={180}
                  size={140}
                  format={() => (
                    <div
                      style={{
                        lineHeight: "1.2",
                        textAlign: "center",
                        insetBlockStart: "40%",
                      }}
                    >
                      <div style={{ color: "#9ca3af", fontSize: 12 }}>
                        Tổng điểm
                      </div>
                      <div
                        style={{
                          color: "#3D3D3D",
                          fontWeight: 600,
                          fontSize: 18,
                        }}
                      >
                        {score}/100
                      </div>
                    </div>
                  )}
                />
              </div>
              <Title level={3} style={{ marginTop: -40 }}>
                {pass
                  ? "Chúc mừng bạn đã hoàn thành!"
                  : "Bạn chưa vượt qua bài kiểm tra!"}
              </Title>
              <Text type="secondary">
                {pass
                  ? "Hãy tiếp tục cố gắng và phát huy ở những bài học sau nhé!"
                  : "Hãy ôn luyện và thực hiện lại bạn nhé!"}
              </Text>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <Button
                  onClick={onRetry}
                  icon={<ReloadOutlined />}
                  style={{ height: 40, borderRadius: 8 }}
                >
                  Làm lại
                </Button>
                <Button
                  type="primary"
                  onClick={onNext}
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                  style={{
                    background: "#DD673C",
                    borderColor: "#DD673C",
                    height: 40,
                    borderRadius: 8,
                  }}
                >
                  Bài học tiếp theo
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </Col>
    </Row>
  );
};

const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

export default function QuizSection({
  lessonId,
  quizId,
  lesson,
  onGoNext,
  durationMinutes,
  onQuizPass,
  attemptNumber, // new prop
}) {
  const [mode, setMode] = useState("loading");
  const [score, setScore] = useState(0);

  const effectiveDurationMinutes = durationMinutes > 0 ? durationMinutes : 10; // Default to 10 minutes
  const calculatedDurationInSeconds = effectiveDurationMinutes * 60;

  const [data, setData] = useState({
    title: lesson?.title || "Bài kiểm tra",
    count: 0,
    durationSec: calculatedDurationInSeconds,
    questions: [],
    description: lesson?.description,
  });

  useEffect(() => {
    const checkSubmission = async () => {
      try {
        // Pass attemptNumber to get history for this specific attempt
        const history = await getQuizAttemptHistory(lessonId, attemptNumber);
        if (history && history.length > 0) {
          const bestAttempt = history.reduce((best, current) =>
            current.score > best.score ? current : best
          );
          setScore(bestAttempt.score || 0);
          if (bestAttempt.score >= 50) {
            onQuizPass?.();
          }
          setMode("result");
        } else {
          setMode("intro");
        }
      } catch (error) {
        console.error("Failed to check for quiz submission history:", error);
        setMode("intro");
      }
    };
    checkSubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, attemptNumber]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const all = await listQuestionsByLesson(lessonId).catch(() => []);
      if (ignore) return;

      const totalQuestions = all.length;
      const pointsPerQuestion = totalQuestions > 0 ? 100 / totalQuestions : 0;

      const mapped = all.map((q, idx) => {
        const { choices, correct } = parseQuestionChoices(q?.question ?? q);
        const correctIndices = choices
          .map((choice, index) => {
            if (correct.includes(String(choice ?? "").trim())) {
              return index;
            }
            return null;
          })
          .filter((index) => index !== null);

        return {
          id: String(q?.questionId ?? q?.id ?? `q-${idx}`),
          points: pointsPerQuestion,
          text:
            q?.question?.questionText ??
            q?.questionText ??
            `Câu hỏi #${idx + 1}`,
          options: Array.isArray(choices) ? choices : [],
          correctIndices: correctIndices,
          isMultiSelect: correctIndices.length > 1,
        };
      });

      const filtered = quizId
        ? mapped.filter((q) => String(q.id) === String(quizId))
        : mapped;

      const shuffled = shuffleArray(filtered);

      setData((d) => ({
        ...d,
        title: lesson?.title || d.title,
        count: shuffled.length,
        questions: shuffled,
        durationSec: calculatedDurationInSeconds,
      }));
    })();
    return () => {
      ignore = true;
    };
  }, [lessonId, quizId, lesson?.title, calculatedDurationInSeconds]);

  const handleRetry = () => {
    setScore(0);
    setMode("play");
  };

  if (mode === "loading") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "50px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (mode === "intro")
    return <IntroCard meta={data} onStart={() => setMode("play")} />;

  if (mode === "play")
    return (
      <Row>
        <Col span={24}>
          <QuizPlay
            data={data}
            lessonId={lessonId}
            onFinish={(result) => {
              const totalQuestions =
                result?.totalQuestions ?? data.questions.length;
              const correctAnswers = result?.correctAnswers ?? 0;

              const scorePercent =
                totalQuestions > 0
                  ? Math.round((correctAnswers / totalQuestions) * 100)
                  : 0;

              if (scorePercent >= 50) {
                onQuizPass?.();
              }

              setScore(scorePercent);
              setMode("result");
            }}
            attemptNumber={attemptNumber} // Pass prop down to QuizPlay
          />
        </Col>
      </Row>
    );

  return (
    <ResultCard
      score={score}
      onRetry={handleRetry}
      onNext={() => onGoNext?.()}
    />
  );
}

QuizSection.propTypes = {
  lessonId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  quizId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lesson: PropTypes.object,
  onGoNext: PropTypes.func,
  durationMinutes: PropTypes.number,
  onQuizPass: PropTypes.func,
  attemptNumber: PropTypes.number,
};
