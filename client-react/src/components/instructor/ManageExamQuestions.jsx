import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Space,
  Select,
  Row,
  Col,
  Card,
  List,
  Typography,
  Popconfirm,
  message,
  Upload,
  Tooltip,
  Tag,
  Alert,
  Radio,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UploadOutlined,
  BankOutlined,
  AppstoreAddOutlined,
  CodeOutlined,
  FormatPainterOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import Editor from "@monaco-editor/react";
import McqOptionsManager from "./McqOptionsManager";
import TestCaseManager from "./TestCaseManager";
import {
  deleteExamQuestion,
  getExamQuestionsForInstructor,
  saveQuestionToBank,
} from "../../services/examService";
import * as XLSX from "xlsx";
import ExamBankModal from "./ExamBankModal";

const { Option } = Select;
const { Text, Title } = Typography;

const QUESTION_TYPES = {
  MCQ: "MCQ",
  MULTI: "MULTI",
  TRUE_FALSE: "TRUE_FALSE",
  SHORT_ANSWER: "SHORT_ANSWER",
  CODING: "CODING",
};

const PROGRAMMING_LANGUAGES = ["javascript", "python", "java", "csharp", "cpp"];

const safeJsonParse = (str) => {
  try {
    const parsed = JSON.parse(str);
    return parsed;
  } catch (e) {
    return null;
  }
};

// --- [KHÔI PHỤC] Logic parse Excel đầy đủ ---
const parseExcelFile = (file, addQuestionFunc, examType) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      if (json.length < 2) {
        message.error("File Excel trống hoặc chỉ có dòng tiêu đề.");
        return;
      }

      const rows = json.slice(1);
      let count = 0;

      rows.forEach((row) => {
        const qText = row[0];
        if (!qText) return;

        const qType = row[1] ? row[1].toString().trim().toUpperCase() : "MCQ";
        const options = [];
        if (row[2]) options.push(row[2].toString());
        if (row[3]) options.push(row[3].toString());
        if (row[4]) options.push(row[4].toString());
        if (row[5]) options.push(row[5].toString());

        let correctAnswerStr = row[6] ? String(row[6]).trim() : "";
        let correctAnswer;

        if (qType === "MULTI") {
          // For multi-choice, split string into an array of answers
          correctAnswer = correctAnswerStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (qType === "MCQ") {
          // For single-choice, wrap the answer in an array
          correctAnswer = correctAnswerStr ? [correctAnswerStr] : [];
        } else {
          // For other types (TRUE_FALSE, etc.), use the plain string
          correctAnswer = correctAnswerStr;
        }

        const language = row[7] ? row[7].toString().toLowerCase() : "java";
        const starterCode = row[8] ? row[8].toString() : "";
        let testCases = [];
        if (row[9]) {
          try {
            testCases = JSON.parse(row[9]);
          } catch (err) {
            console.warn("Invalid Test Case JSON in Excel", row[9]);
            testCases = [];
          }
        }

        const newQuestion = {
          questionText: qText,
          questionType: qType,
          options: options,
          correctAnswer: correctAnswer,
          language: language,
          starterCode: starterCode,
          testCases: testCases,
        };

        addQuestionFunc(newQuestion);
        count++;
      });

      if (count > 0) {
        message.success(`Đã import thành công ${count} câu hỏi từ Excel.`);
      } else {
        message.warning("Không tìm thấy dữ liệu hợp lệ trong file Excel.");
      }
    } catch (error) {
      console.error(error);
      message.error(`Lỗi đọc file: ${error.message}`);
    }
  };
  reader.readAsArrayBuffer(file);
};
// --------------------------------------------

export default function ManageExamQuestions({
  form,
  initialQuestions = [],
  examId,
  examType,
}) {
  const [questionsList, setQuestionsList] = useState(initialQuestions);
  const [loading, setLoading] = useState(false);
  const isEditing = !!examId;
  const [savingToBankIds, setSavingToBankIds] = useState(new Set());
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const formListAddFuncRef = useRef(null);
  const editorRefs = useRef({});

  // Tính toán điểm số dự kiến (Chỉ để hiển thị UI cho đẹp)
  const totalQuestions =
    questionsList.length +
    (form.getFieldValue("customQuestionsToAdd")?.length || 0);
  const estimatedPoints =
    totalQuestions > 0 ? (100 / totalQuestions).toFixed(2) : 0;

  useEffect(() => {
    setQuestionsList(initialQuestions);
  }, [initialQuestions]);

  const refreshQuestions = () => {
    if (!examId) return;
    setLoading(true);
    getExamQuestionsForInstructor(examId)
      .then((resp) => {
        setQuestionsList(resp.data?.data || []);
        message.success("Đã làm mới danh sách câu hỏi");
      })
      .catch((err) => {
        console.error("Failed refresh questions:", err);
        message.error("Lỗi tải danh sách câu hỏi");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDeleteQuestion = (questionId) => {
    if (!examId) return;
    deleteExamQuestion(questionId)
      .then(() => {
        message.success("Đã xóa câu hỏi");
        // Sau khi xóa, cần refresh lại để Backend tính lại điểm và trả về
        refreshQuestions();
      })
      .catch((err) => {
        console.error("Failed delete question:", err);
        message.error(err.response?.data?.message || "Lỗi xóa câu hỏi");
      });
  };

  const allowedQuestionTypes = useMemo(() => {
    if (examType === "MULTIPLE_CHOICE") {
      return [
        QUESTION_TYPES.MCQ,
        QUESTION_TYPES.MULTI,
        QUESTION_TYPES.TRUE_FALSE,
      ];
    }
    if (examType === "PROGRAMMING") {
      return [QUESTION_TYPES.CODING, QUESTION_TYPES.SHORT_ANSWER];
    }
    return Object.values(QUESTION_TYPES);
  }, [examType]);

  const handleBeforeUpload = (addFunc) => (file) => {
    if (!addFunc) {
      message.error("Lỗi form.");
      return Upload.LIST_IGNORE;
    }
    parseExcelFile(file, addFunc, examType);
    return false;
  };

  const handleSaveToBank = async (questionData, identifier) => {
    if (
      !questionData ||
      !questionData.questionText ||
      !questionData.questionType
    ) {
      message.error("Dữ liệu câu hỏi chưa đầy đủ.");
      return;
    }

    setSavingToBankIds((prev) => new Set(prev).add(identifier));

    try {
      const type = questionData.questionType;
      let choicesPayload = [];
      let correctAnswersPayload = [];

      if (type === QUESTION_TYPES.TRUE_FALSE) {
        choicesPayload = ["True", "False"];
        correctAnswersPayload = questionData.correctAnswer
          ? [String(questionData.correctAnswer)]
          : [];
      } else if (type === QUESTION_TYPES.MCQ || type === QUESTION_TYPES.MULTI) {
        const validOptions = Array.isArray(questionData.options)
          ? questionData.options.filter(
              (opt) => opt && String(opt).trim() !== ""
            )
          : [];
        if (validOptions.length < 2) throw new Error("Cần ít nhất 2 lựa chọn.");
        choicesPayload = validOptions;
        correctAnswersPayload = Array.isArray(questionData.correctAnswer)
          ? questionData.correctAnswer.filter(Boolean)
          : [String(questionData.correctAnswer)].filter(Boolean);
      }

      const payload = {
        questionText: questionData.questionText,
        questionType: type,
        choices: choicesPayload,
        correctAnswers: correctAnswersPayload,
        points: 0, // Điểm trong bank không quan trọng, sẽ tính lại khi vào đề thi
        language: questionData.language,
        starterCode: questionData.starterCode,
        testCases:
          questionData.testCases && Array.isArray(questionData.testCases)
            ? JSON.stringify(questionData.testCases)
            : "[]",
      };

      await saveQuestionToBank(payload);
      message.success("Đã lưu vào Ngân hàng câu hỏi.");
    } catch (error) {
      message.error(
        error.response?.data?.message || error.message || "Lỗi lưu câu hỏi."
      );
    } finally {
      setSavingToBankIds((prev) => {
        const next = new Set(prev);
        next.delete(identifier);
        return next;
      });
    }
  };

  const handleAddQuestionsFromBank = (selectedQuestions) => {
    if (!formListAddFuncRef.current) return;
    selectedQuestions.forEach((q) => {
      const choices = q.choices ? safeJsonParse(q.choices) : [];
      const testCases = q.testCases ? safeJsonParse(q.testCases) : [];

      // Defensively parse the correct answer from the question bank
      const rawAnswer = q.correctAnswer;
      let finalAnswer;

      // First, try to parse as JSON
      const parsedAnswer = safeJsonParse(rawAnswer);

      if (q.questionType === "MULTI") {
        if (Array.isArray(parsedAnswer)) {
          finalAnswer = parsedAnswer;
        } else if (typeof rawAnswer === "string" && rawAnswer) {
          // Fallback for malformed data: treat as comma-separated
          finalAnswer = rawAnswer
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          finalAnswer = [];
        }
      } else {
        // For MCQ, TRUE_FALSE etc.
        if (Array.isArray(parsedAnswer)) {
          // It was stored as an array, just take the first element
          finalAnswer = parsedAnswer[0];
        } else if (parsedAnswer !== null) {
          // It was valid JSON but not an array (e.g. a string literal "foo", or a number 123)
          finalAnswer = parsedAnswer;
        } else {
          // Not valid JSON, so just use the raw string value
          finalAnswer = rawAnswer;
        }
      }

      formListAddFuncRef.current({
        ...q,
        choices: choices,
        correctAnswer: finalAnswer,
        testCases: testCases,
        // Không set points ở đây, để backend tự tính
      });
    });
    message.success(`Đã thêm ${selectedQuestions.length} câu hỏi.`);
  };

  const handleEditorDidMount = (editor, monaco, index) => {
    editorRefs.current[index] = editor;
  };

  const handleFormatCode = (index) => {
    const editor = editorRefs.current[index];
    if (editor) {
      editor.getAction("editor.action.formatDocument").run();
    }
  };

  return (
    <div>
      {/* THÔNG BÁO VỀ CƠ CHẾ TÍNH ĐIỂM */}
      <Alert
        message="Cơ chế tính điểm tự động"
        description={
          <span>
            Tổng điểm bài thi là <strong>100 điểm</strong>. Hệ thống sẽ tự động
            chia đều điểm cho tất cả câu hỏi.
            <br />
            Hiện tại có <strong>{totalQuestions}</strong> câu hỏi. Mỗi câu tương
            ứng khoảng <strong>~{estimatedPoints} điểm</strong>.
          </span>
        }
        type="info"
        showIcon
        icon={<CalculatorOutlined />}
        style={{ marginBottom: 24 }}
      />

      {isEditing && (
        <>
          <Title
            level={5}
            style={{ marginBottom: 16, display: "flex", alignItems: "center" }}
          >
            Câu hỏi đã có trong đề
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshQuestions}
              loading={loading}
              style={{ marginLeft: "auto" }}
              size="small"
            >
              Làm mới
            </Button>
          </Title>
          <List
            bordered
            size="small"
            dataSource={questionsList}
            loading={loading}
            renderItem={(q, index) => (
              <List.Item
                key={q.exQId}
                actions={[
                  <Tooltip key="save-to-bank" title="Lưu vào Ngân hàng">
                    <Button
                      type="text"
                      icon={<BankOutlined />}
                      size="small"
                      loading={savingToBankIds.has(q.exQId)}
                      onClick={() => handleSaveToBank(q, q.exQId)}
                    />
                  </Tooltip>,
                  <Popconfirm
                    key="delete"
                    title="Xóa câu hỏi này?"
                    onConfirm={() => handleDeleteQuestion(q.exQId)}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>
                        {index + 1}. [{q.questionType}]
                      </Text>
                      <Tag color="blue">
                        {parseFloat(q.points || 0).toFixed(2)} điểm
                      </Tag>
                    </Space>
                  }
                  description={
                    <div
                      style={{
                        maxHeight: 60,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {q.questionText}
                    </div>
                  }
                />
              </List.Item>
            )}
            style={{ marginBottom: 24 }}
            locale={{ emptyText: "Chưa có câu hỏi nào trong đề thi." }}
          />
        </>
      )}

      <Title level={5} style={{ marginBottom: 16 }}>
        Thêm câu hỏi mới{" "}
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
          (Sẽ được lưu và tính điểm khi bấm &quot;
          {isEditing ? "Lưu thay đổi" : "Tạo bài thi"}&quot;)
        </Text>
      </Title>

      <Form.List name="customQuestionsToAdd">
        {(fields, { add, remove }) => {
          formListAddFuncRef.current = add;

          return (
            <>
              <Space style={{ marginBottom: 16 }} wrap>
                <Upload
                  beforeUpload={handleBeforeUpload(add)}
                  showUploadList={false}
                  accept=".xlsx"
                >
                  <Button icon={<UploadOutlined />}>Import từ Excel</Button>
                </Upload>
                <Button
                  icon={<AppstoreAddOutlined />}
                  onClick={() => setIsBankModalOpen(true)}
                >
                  Thêm từ Ngân hàng
                </Button>
              </Space>

              {fields.map(({ key, name, ...restField }, index) => (
                <Card
                  key={key}
                  title={
                    <Space>
                      <Text strong>Câu hỏi mới #{index + 1}</Text>
                      <Tag color="default">Điểm: Auto</Tag>
                    </Space>
                  }
                  size="small"
                  style={{
                    marginBottom: 16,
                    background: "#fafafa",
                    border: "1px solid #d9d9d9",
                  }}
                  headStyle={{
                    borderBottom: "1px solid #f0f0f0",
                    fontSize: "14px",
                  }}
                  bodyStyle={{ paddingTop: "16px" }}
                  extra={
                    <Space size="small">
                      <Tooltip title="Lưu vào Ngân hàng">
                        <Button
                          type="text"
                          icon={<BankOutlined />}
                          size="small"
                          loading={savingToBankIds.has(key)}
                          onClick={() => {
                            const currentQuestionData = form.getFieldValue([
                              "customQuestionsToAdd",
                              index,
                            ]);
                            handleSaveToBank(currentQuestionData, key);
                          }}
                        />
                      </Tooltip>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                        size="small"
                        title="Gỡ bỏ"
                      />
                    </Space>
                  }
                >
                  <Form.Item
                    {...restField}
                    name={[name, "questionText"]}
                    label="Nội dung câu hỏi"
                    rules={[
                      { required: true, message: "Vui lòng nhập nội dung!" },
                    ]}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Nhập nội dung câu hỏi..."
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        {...restField}
                        name={[name, "questionType"]}
                        label="Loại câu hỏi"
                        rules={[
                          { required: true, message: "Vui lòng chọn loại!" },
                        ]}
                      >
                        <Select placeholder="Chọn loại câu hỏi">
                          {allowedQuestionTypes.map((type) => (
                            <Option key={type} value={type}>
                              {type}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    {/* ĐÃ XÓA CỘT NHẬP ĐIỂM (POINTS) VÌ HỆ THỐNG TỰ TÍNH */}
                  </Row>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                      prev.customQuestionsToAdd?.[index]?.questionType !==
                      curr.customQuestionsToAdd?.[index]?.questionType
                    }
                  >
                    {({ getFieldValue }) => {
                      const type = getFieldValue([
                        "customQuestionsToAdd",
                        index,
                        "questionType",
                      ]);

                      if (
                        type === QUESTION_TYPES.MCQ ||
                        type === QUESTION_TYPES.MULTI
                      ) {
                        return <McqOptionsManager questionFieldName={name} />;
                      }

                      if (type === QUESTION_TYPES.TRUE_FALSE) {
                        return (
                          <Row
                            gutter={16}
                            style={{
                              marginTop: "8px",
                              paddingLeft: "24px",
                              borderLeft: "3px solid #f0f0f0",
                            }}
                          >
                            <Col xs={24} md={12}>
                              <Form.Item label="Lựa chọn (Tự động)">
                                <Input
                                  value="True"
                                  disabled
                                  style={{ marginBottom: 8 }}
                                />
                                <Input value="False" disabled />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                name={[name, "correctAnswer"]}
                                label="Đáp án đúng"
                                rules={[
                                  {
                                    required: true,
                                    message: "Vui lòng chọn đáp án đúng",
                                  },
                                ]}
                              >
                                <Radio.Group>
                                  <Radio value="True">True</Radio>
                                  <Radio value="False">False</Radio>
                                </Radio.Group>
                              </Form.Item>
                            </Col>
                          </Row>
                        );
                      }

                      if (type === QUESTION_TYPES.CODING) {
                        return (
                          <div style={{ marginTop: "16px" }}>
                            <Row gutter={16}>
                              <Col span={24}>
                                <Form.Item
                                  {...restField}
                                  name={[name, "language"]}
                                  label="Ngôn ngữ lập trình"
                                  rules={[
                                    {
                                      required: true,
                                      message: "Vui lòng chọn ngôn ngữ",
                                    },
                                  ]}
                                  initialValue="java"
                                >
                                  <Select>
                                    {PROGRAMMING_LANGUAGES.map((lang) => (
                                      <Option key={lang} value={lang}>
                                        {lang.toUpperCase()}
                                      </Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>

                              <Col span={24}>
                                <div
                                  style={{
                                    border: "1px solid #434343",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    marginBottom: "24px",
                                  }}
                                >
                                  {/* IDE Header */}
                                  <div
                                    style={{
                                      background: "#1e1e1e",
                                      color: "#d4d4d4",
                                      padding: "8px 12px",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      borderBottom: "1px solid #333",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        fontFamily: "sans-serif",
                                      }}
                                    >
                                      <CodeOutlined
                                        style={{ marginRight: 6 }}
                                      />
                                      CODE MẪU (STARTER CODE)
                                    </span>
                                    <Button
                                      size="small"
                                      type="text"
                                      icon={<FormatPainterOutlined />}
                                      style={{
                                        color: "#fff",
                                        fontSize: "12px",
                                      }}
                                      onClick={() => handleFormatCode(index)}
                                    >
                                      Format
                                    </Button>
                                  </div>

                                  <Form.Item
                                    {...restField}
                                    name={[name, "starterCode"]}
                                    noStyle
                                  >
                                    <Editor
                                      height="250px"
                                      language={
                                        form.getFieldValue([
                                          "customQuestionsToAdd",
                                          index,
                                          "language",
                                        ]) || "java"
                                      }
                                      theme="vs-dark"
                                      onMount={(editor, monaco) =>
                                        handleEditorDidMount(
                                          editor,
                                          monaco,
                                          index
                                        )
                                      }
                                      options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        fontFamily: "'Fira Code', monospace",
                                        contextmenu: true,
                                        formatOnType: true,
                                        formatOnPaste: true,
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                      }}
                                    />
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
                            <TestCaseManager questionFieldName={name} />
                          </div>
                        );
                      }
                      return null;
                    }}
                  </Form.Item>
                </Card>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    const defaultType =
                      allowedQuestionTypes[0] || QUESTION_TYPES.MCQ;
                    const isMcqLike = [
                      QUESTION_TYPES.MCQ,
                      QUESTION_TYPES.MULTI,
                      QUESTION_TYPES.MULTI,
                    ].includes(defaultType);
                    const isCoding = defaultType === QUESTION_TYPES.CODING;
                    add({
                      questionType: defaultType,
                      // points: 10, // BỎ DÒNG NÀY - Không cần set điểm mặc định nữa
                      options: isMcqLike ? ["", "", "", ""] : [],
                      correctAnswer: isMcqLike ? [] : undefined,
                      language: isCoding ? "java" : undefined,
                      testCases: isCoding
                        ? [{ input: "", expectedOutput: "", isHidden: false }]
                        : undefined,
                    });
                  }}
                  block
                  icon={<PlusOutlined />}
                  disabled={allowedQuestionTypes.length === 0}
                >
                  Thêm câu hỏi mới
                </Button>
              </Form.Item>
            </>
          );
        }}
      </Form.List>

      <ExamBankModal
        open={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onAddQuestions={handleAddQuestionsFromBank}
      />
    </div>
  );
}
