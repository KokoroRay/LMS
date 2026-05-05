import React, { useState, useEffect } from "react";
import {
  Typography,
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Spin,
  Descriptions,
  Tag,
  Row,
  Col,
  Card,
  Alert,
  Divider,
  Space,
  Table, // Dùng Table để hiển thị so sánh
  Collapse,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSubmissionDetailForInstructor,
  gradeSubmission,
} from "../../../../services/examService";
import dayjs from "dayjs";
import {
  SolutionOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  CodeOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  EyeInvisibleOutlined,
  EyeOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import Editor from "@monaco-editor/react";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// --- HELPER: Parse JSON an toàn ---
const parseJsonString = (jsonString, fallback = null) => {
  if (!jsonString) return fallback;
  if (typeof jsonString === "object") return jsonString;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return jsonString;
  }
};

// --- HELPER: Lấy code sạch từ dữ liệu nộp ---
const extractCodeFromAnswer = (parsedAnswer) => {
  if (!parsedAnswer) return "// Không có bài làm";
  if (typeof parsedAnswer === "object") {
    return (
      parsedAnswer.answerText ||
      parsedAnswer.code ||
      "// Sinh viên nộp dữ liệu rỗng"
    );
  }
  if (typeof parsedAnswer === "string") {
    if (parsedAnswer.startsWith('"') && parsedAnswer.endsWith('"')) {
      return parsedAnswer
        .slice(1, -1)
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"');
    }
    return parsedAnswer;
  }
  return String(parsedAnswer);
};

const isUrl = (str) => {
  if (typeof str !== "string") return false;
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
};

const QUESTION_TYPES_NON_AUTO = ["SHORT_ANSWER", "CODING"];

// --- COMPONENT: Hiển thị bảng so sánh Test Case (QUAN TRỌNG) ---
const TestCaseResultTable = ({ testCaseResults, testCasesDefinition }) => {
  // Logic: Merge kết quả chạy (nếu có) với định nghĩa đề bài
  // Nếu sinh viên chưa chạy (testCaseResults rỗng), ta dùng testCasesDefinition để hiện Input/Expected

  let dataSource = [];

  // 1. Ưu tiên lấy từ kết quả chạy thực tế
  if (testCaseResults && testCaseResults.length > 0) {
    dataSource = testCaseResults.map((res, idx) => ({
      key: idx,
      input: res.input,
      expected: res.expectedOutput,
      actual: res.actualOutput,
      status: res.isCorrect ? "PASS" : "FAIL",
      isHidden: res.isHidden,
    }));
  }
  // 2. Nếu không có kết quả chạy, lấy từ đề bài (Definition)
  else if (testCasesDefinition) {
    const defs = parseJsonString(testCasesDefinition, []);
    if (Array.isArray(defs)) {
      dataSource = defs.map((def, idx) => ({
        key: idx,
        input: def.input,
        expected: def.expectedOutput,
        actual: null, // Chưa chạy
        status: "NOT_RUN",
        isHidden: def.isHidden,
      }));
    }
  }

  const columns = [
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      align: "center",
      render: (status) => {
        if (status === "PASS")
          return (
            <Tag color="success" icon={<CheckCircleFilled />}>
              Pass
            </Tag>
          );
        if (status === "FAIL")
          return (
            <Tag color="error" icon={<CloseCircleFilled />}>
              Fail
            </Tag>
          );
        return (
          <Tag color="warning" icon={<WarningOutlined />}>
            Chưa chạy
          </Tag>
        );
      },
    },
    {
      title: "Input",
      dataIndex: "input",
      key: "input",
      render: (text) => (
        <div
          style={{
            fontFamily: "monospace",
            background: "#f5f5f5",
            padding: "4px 8px",
            borderRadius: 4,
            whiteSpace: "pre-wrap",
            maxHeight: 100,
            overflow: "auto",
          }}
        >
          {typeof text === "object" ? JSON.stringify(text) : text}
        </div>
      ),
    },
    {
      title: "Expected Output",
      dataIndex: "expected",
      key: "expected",
      render: (text) => (
        <div
          style={{
            fontFamily: "monospace",
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            padding: "4px 8px",
            borderRadius: 4,
            color: "#389e0d",
            whiteSpace: "pre-wrap",
            maxHeight: 100,
            overflow: "auto",
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: "Actual Output (SV)",
      dataIndex: "actual",
      key: "actual",
      render: (text, record) => {
        if (record.status === "NOT_RUN")
          return (
            <Text type="secondary" italic>
              (Sinh viên chưa chạy thử)
            </Text>
          );
        return (
          <div
            style={{
              fontFamily: "monospace",
              background: record.status === "PASS" ? "#f6ffed" : "#fff2f0",
              border: `1px solid ${
                record.status === "PASS" ? "#b7eb8f" : "#ffccc7"
              }`,
              padding: "4px 8px",
              borderRadius: 4,
              color: record.status === "PASS" ? "#389e0d" : "#cf1322",
              whiteSpace: "pre-wrap",
              maxHeight: 100,
              overflow: "auto",
            }}
          >
            {text || "(Empty Output)"}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Text strong>
          <CodeOutlined /> Chi tiết chấm Test Cases:
        </Text>
        {dataSource.length > 0 && (
          <Tag>
            {dataSource.filter((x) => x.status === "PASS").length}/
            {dataSource.length} Test cases đúng
          </Tag>
        )}
      </div>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        rowClassName={(record) => (record.status === "FAIL" ? "bg-red-50" : "")}
      />
    </div>
  );
};

const AnswerDetailsViewer = ({ form }) => {
  return (
    <Form.List name="answerScores">
      {(fields) => (
        <Space direction="vertical" style={{ width: "100%" }}>
          {fields.map((field, index) => {
            const answer = form.getFieldValue(["answerScores", index]);
            if (!answer) return null;

            const isEditable = QUESTION_TYPES_NON_AUTO.includes(
              answer.questionType
            );

            // Logic màu viền Card
            let cardBorderColor = "#f0f0f0";
            let correctnessIcon = null;

            if (answer.questionType === "CODING") {
              if (answer.earnedPoints === answer.points) {
                cardBorderColor = "#b7eb8f"; // Xanh
                correctnessIcon = (
                  <CheckCircleOutlined
                    style={{ color: "#52c41a", marginLeft: 8 }}
                  />
                );
              } else if (answer.earnedPoints > 0) {
                cardBorderColor = "#fffb8f"; // Vàng
                correctnessIcon = (
                  <Tag color="warning" style={{ marginLeft: 8 }}>
                    Partial
                  </Tag>
                );
              } else {
                cardBorderColor = "#ffccc7"; // Đỏ
                correctnessIcon = (
                  <CloseCircleOutlined
                    style={{ color: "#f5222d", marginLeft: 8 }}
                  />
                );
              }
            } else {
              cardBorderColor =
                answer.isCorrect === true
                  ? "#b7eb8f"
                  : answer.isCorrect === false
                  ? "#ffccc7"
                  : "#f0f0f0";
              correctnessIcon =
                answer.isCorrect === true ? (
                  <CheckCircleOutlined
                    style={{ color: "#52c41a", marginLeft: 8 }}
                  />
                ) : answer.isCorrect === false ? (
                  <CloseCircleOutlined
                    style={{ color: "#f5222d", marginLeft: 8 }}
                  />
                ) : null;
            }

            return (
              <Card
                key={field.key}
                size="small"
                style={{
                  marginBottom: 16,
                  borderColor: cardBorderColor,
                  background: "#ffffff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
                styles={{
                  header: {
                    borderBottom: `1px solid ${cardBorderColor}`,
                    background: "#fafafa",
                  },
                }}
              >
                <Card.Meta
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text strong style={{ fontSize: 15 }}>
                        Câu {index + 1}:{" "}
                        <span style={{ fontWeight: 400 }}>
                          {answer.questionText || `(ID: ${answer.questionId})`}
                        </span>
                        {!isEditable && correctnessIcon}
                        {answer.questionType === "CODING" && correctnessIcon}
                      </Text>
                      <Space>
                        <Form.Item
                          {...field}
                          name={[field.name, "earnedPoints"]}
                          noStyle
                        >
                          <InputNumber
                            min={0}
                            max={answer.points || 0}
                            style={{ width: "70px" }}
                            step={0.5}
                            disabled={!isEditable}
                          />
                        </Form.Item>
                        <Text type="secondary">
                          / {answer.points || "?"} điểm
                        </Text>
                      </Space>
                    </div>
                  }
                />

                {/* --- KHU VỰC CÂU HỎI CODING --- */}
                {answer.questionType === "CODING" && (
                  <div style={{ marginTop: 16 }}>
                    <div
                      style={{
                        border: "1px solid #434343",
                        borderRadius: "6px 6px 0 0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          background: "#1e1e1e",
                          color: "#fff",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontFamily: "sans-serif",
                          borderBottom: "1px solid #333",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          {answer.language
                            ? answer.language.toUpperCase()
                            : "TEXT"}
                        </span>
                        <span style={{ opacity: 0.7 }}>
                          Sinh viên nộp: {answer.submissionTime}
                        </span>
                      </div>
                      <Editor
                        height="300px"
                        language={answer.language || "plaintext"}
                        value={extractCodeFromAnswer(
                          answer.studentAnswerParsed
                        )}
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 13,
                          fontFamily: "'Fira Code', monospace",
                          renderWhitespace: "selection",
                        }}
                      />
                    </div>

                    {/* BẢNG SO SÁNH TEST CASE */}
                    <TestCaseResultTable
                      testCaseResults={answer.displayTestCaseResults}
                      testCasesDefinition={answer.testCases}
                    />
                  </div>
                )}

                {/* --- KHU VỰC CÂU HỎI THƯỜNG --- */}
                {answer.questionType !== "CODING" && (
                  <div style={{ marginTop: 12 }}>
                    <Descriptions
                      column={1}
                      size="small"
                      layout="vertical"
                      bordered
                    >
                      <Descriptions.Item
                        label={<Text strong>Câu trả lời của sinh viên</Text>}
                      >
                        {answer.studentAnswerParsed?.selectedOptions ? (
                          <Space wrap>
                            {answer.studentAnswerParsed.selectedOptions.map(
                              (opt, i) => (
                                <Tag
                                  color="blue"
                                  key={i}
                                  style={{ fontSize: 14, padding: "4px 10px" }}
                                >
                                  {opt}
                                </Tag>
                              )
                            )}
                          </Space>
                        ) : isUrl(answer.studentAnswerParsed) ? (
                          <a
                            href={answer.studentAnswerParsed}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkOutlined /> {answer.studentAnswerParsed}
                          </a>
                        ) : typeof answer.studentAnswerParsed === "string" ? (
                          <Paragraph
                            code
                            copyable={{ text: answer.studentAnswerParsed }}
                            style={{ marginBottom: 0 }}
                          >
                            {answer.studentAnswerParsed}
                          </Paragraph>
                        ) : (
                          <Text type="secondary" italic>
                            Không có câu trả lời.
                          </Text>
                        )}
                      </Descriptions.Item>

                      {answer.correctAnswerParsed && (
                        <Descriptions.Item
                          label={<Text strong>Đáp án đúng (Hệ thống)</Text>}
                          style={{ background: "#f6ffed" }}
                        >
                          {Array.isArray(answer.correctAnswerParsed) ? (
                            <Space wrap>
                              {answer.correctAnswerParsed.map((ans, i) => (
                                <Tag
                                  color="success"
                                  key={i}
                                  icon={<CheckCircleOutlined />}
                                  style={{ fontSize: 14, padding: "4px 10px" }}
                                >
                                  {ans}
                                </Tag>
                              ))}
                            </Space>
                          ) : (
                            <Tag
                              color="success"
                              icon={<CheckCircleOutlined />}
                              style={{ fontSize: 14, padding: "4px 10px" }}
                            >
                              {String(answer.correctAnswerParsed)}
                            </Tag>
                          )}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                )}
              </Card>
            );
          })}
        </Space>
      )}
    </Form.List>
  );
};

export default function InstructorGradesPage() {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    const submissionId = parseInt(resultId, 10);
    if (isNaN(submissionId)) {
      message.error("Invalid Submission ID provided.");
      navigate("/instructor/submissions");
      return;
    }

    setLoading(true);
    getSubmissionDetailForInstructor(submissionId)
      .then((resp) => {
        const submissionData = resp.data?.data;
        if (!submissionData) {
          throw new Error("Submission data not found in response.");
        }
        setSubmission(submissionData);

        const initialScores = (submissionData.answerDetails || []).map(
          (detail) => ({
            questionId: detail.questionId,
            questionText: detail.questionText,
            questionType: detail.questionType,
            points: detail.points,
            earnedPoints: detail.earnedPoints,
            isCorrect: detail.isCorrect,
            studentAnswerParsed: parseJsonString(detail.studentAnswer),
            correctAnswerParsed: parseJsonString(detail.correctAnswer),
            language: detail.language,
            starterCode: detail.starterCode,
            // Quan trọng: Lấy cả definition và results
            testCases: detail.testCases,
            testCaseResults: detail.testCaseResults || [],
          })
        );

        let displayScore = submissionData.score;
        if (displayScore === null) {
          const totalRawScore = initialScores.reduce((acc, curr) => {
            const points = Number(curr?.earnedPoints) || 0;
            return acc + points;
          }, 0);

          const maxRawScore = submissionData.maxRawScore || 1;
          const totalMarks = submissionData.totalMarks || 100;

          displayScore = (totalRawScore / maxRawScore) * totalMarks;
        }

        form.setFieldsValue({
          score: parseFloat(displayScore.toFixed(2)),
          feedback: submissionData.feedback,
          answerScores: initialScores,
        });
      })
      .catch((err) => {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch submission details.";
        message.error(errorMsg);
        navigate("/instructor/submissions");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [resultId, navigate, form]);

  const onFinish = (values) => {
    setGrading(true);
    const submissionId = parseInt(resultId, 10);

    const { score, feedback, answerScores } = values;

    const detailedScores = answerScores.map((answer) => ({
      questionId: parseInt(answer.questionId, 10),
      earnedPoints: parseFloat(answer.earnedPoints),
    }));

    const payload = {
      score: score,
      feedback: feedback,
      answerScores: detailedScores,
    };

    gradeSubmission(submissionId, payload)
      .then(() => {
        message.success("Chấm điểm thành công!");
        navigate(`/instructor/submissions?examId=${submission.examId}`);
      })
      .catch((err) => {
        message.error(
          err.response?.data?.message || "Failed to grade submission."
        );
      })
      .finally(() => {
        setGrading(false);
      });
  };

  const handleFormChange = (changedValues, allValues) => {
    if (changedValues.answerScores) {
      const totalRawScore = allValues.answerScores.reduce((acc, curr) => {
        const points = Number(curr?.earnedPoints) || 0;
        return acc + points;
      }, 0);

      const maxRawScore = submission?.maxRawScore;
      const totalMarks = submission?.totalMarks;

      let scaledScore = 0;
      if (maxRawScore && maxRawScore > 0 && totalMarks) {
        scaledScore = (totalRawScore / maxRawScore) * totalMarks;
      } else {
        scaledScore = totalRawScore;
      }

      form.setFieldsValue({ score: parseFloat(scaledScore.toFixed(2)) });
    }
  };

  if (loading) {
    return <Spin tip="Loading Submission Details..." fullscreen />;
  }

  if (!submission) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Error"
          description="Submission details could not be loaded."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          <SolutionOutlined style={{ marginRight: 12, color: "#1890ff" }} />
          Chấm Bài Thi
        </Title>
        <Button
          onClick={() =>
            navigate(`/instructor/submissions?examId=${submission.examId}`)
          }
        >
          Quay lại danh sách
        </Button>
      </div>

      <Card
        style={{ marginBottom: 24, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
        styles={{ body: { padding: 20 } }}
      >
        <Descriptions
          title="Thông tin bài làm"
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
          size="small"
        >
          <Descriptions.Item label="Bài thi">
            {submission.examTitle}
          </Descriptions.Item>
          <Descriptions.Item label="Sinh viên">
            <Space>
              <Text strong>{submission.studentName}</Text>
              <Text type="secondary">({submission.studentEmail})</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian nộp">
            {submission.submittedAt
              ? dayjs(submission.submittedAt).format("HH:mm DD/MM/YYYY")
              : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian làm">
            {submission.timeSpent ? `${submission.timeSpent} phút` : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {submission.gradedAt ? (
              <Tag color="green">Đã chấm</Tag>
            ) : (
              <Tag color="orange">Chờ chấm</Tag>
            )}
          </Descriptions.Item>
          {submission.gradedByName && (
            <Descriptions.Item label="Người chấm">
              {submission.gradedByName} (
              {dayjs(submission.gradedAt).format("DD/MM")})
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleFormChange}
      >
        <Row gutter={24}>
          <Col xs={24} lg={17} style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              Chi tiết câu trả lời
            </Title>
            <AnswerDetailsViewer form={form} />
          </Col>

          <Col xs={24} lg={7}>
            <Card
              title={
                <>
                  <CheckCircleOutlined /> Tổng kết điểm
                </>
              }
              style={{
                position: "sticky",
                top: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              headStyle={{ background: "#fafafa" }}
            >
              <Form.Item
                name="score"
                label="Tổng điểm (Quy đổi)"
                rules={[{ required: true, message: "Vui lòng nhập điểm!" }]}
              >
                <InputNumber
                  min={0}
                  max={submission.totalMarks || undefined}
                  style={{
                    width: "100%",
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "#1890ff",
                    height: 50,
                    paddingTop: 8,
                  }}
                  placeholder="0"
                  precision={2}
                  disabled
                  addonAfter={`/ ${submission.totalMarks || 100}`}
                />
              </Form.Item>

              <Divider />

              <Form.Item name="feedback" label="Nhận xét chung">
                <Input.TextArea
                  rows={6}
                  placeholder="Nhập nhận xét, góp ý cho sinh viên..."
                  style={{ resize: "none" }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={grading}
                  block
                  size="large"
                  style={{ height: 48 }}
                >
                  {submission.gradedAt ? "Cập nhật điểm" : "Lưu điểm số"}
                </Button>
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
