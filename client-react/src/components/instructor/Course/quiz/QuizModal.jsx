import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  InputNumber,
  Checkbox,
  Typography,
  Space,
  Card,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  createNewQuestionInQuestionBank,
  addNewCustomQuestionsToLesson,
  listQuestionsByLesson,
  updateQuestionOrder,
} from "../../../../services/lessonQuestionService";

const { Title, Text } = Typography;

export default function QuizModal({ modal, setModal, context, loadStructure }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { lessonId, currentUserId = 1 } = context || {};

  const handleCancel = () => {
    form.resetFields();
    setModal((prev) => ({ ...prev, quiz: false }));
  };

  useEffect(() => {
    if (modal.quiz) {
      form.setFieldsValue({
        addedBy: currentUserId,
        newQuestions: [
          {
            questionText: "",
            orderIndex: 0,
            isRequired: true,
            options: [
              { isCorrect: false, optionText: "" },
              { isCorrect: false, optionText: "" },
            ],
          },
        ],
      });
    }
  }, [modal.quiz, currentUserId, form]);

  const buildChoices = (options) => {
    const cleaned = (options || [])
      .map((opt) => ({
        optionText: String(opt?.optionText ?? "").trim(),
        isCorrect: !!opt?.isCorrect,
      }))
      .filter((o) => o.optionText);

    if (cleaned.length < 2) throw new Error("Cần ít nhất 2 lựa chọn.");
    if (!cleaned.some((c) => c.isCorrect))
      throw new Error("Chưa chọn đáp án đúng.");

    const unique = [
      ...new Map(cleaned.map((o) => [o.optionText.toLowerCase(), o])).values(),
    ];
    return {
      choicesArr: unique.map((o) => o.optionText),
      correctArr: unique.filter((o) => o.isCorrect).map((o) => o.optionText),
    };
  };

  const handleAddCustomQuizzes = async (values) => {
    if (!lessonId) return message.error("Thiếu Lesson ID.");

    const newQuestionsList = Array.isArray(values?.newQuestions)
      ? values.newQuestions
      : [];

    if (newQuestionsList.length === 0) {
      return message.error("Vui lòng thêm ít nhất 1 câu hỏi.");
    }

    const hasPotentialValid = newQuestionsList.some((q) => {
      const opts = (q?.options || []).filter((o) =>
        String(o?.optionText ?? "").trim()
      );
      const has2 = opts.length >= 2;
      const hasAnswer = opts.some((o) => !!o?.isCorrect);
      const hasText = String(q?.questionText ?? "").trim().length > 0;
      return hasText && has2 && hasAnswer;
    });
    if (!hasPotentialValid) {
      return message.error(
        "Vui lòng nhập tối thiểu 1 câu hỏi có ≥2 lựa chọn và chọn đáp án đúng."
      );
    }

    try {
      setSaving(true);
      const addedBy = Number(values.addedBy ?? currentUserId);
      const createdIds = [];

      for (const [i, q] of newQuestionsList.entries()) {
        const qText = (q?.questionText ?? "").trim();
        if (!qText) {
          message.warning(`Câu hỏi ${i + 1} bị bỏ qua (thiếu nội dung).`);
          continue;
        }

        let choicesArr, correctArr;
        try {
          ({ choicesArr, correctArr } = buildChoices(q.options));
        } catch (e) {
          message.warning(`Câu hỏi ${i + 1} bị bỏ qua: ${e.message}`);
          continue;
        }

        try {
          const created = await createNewQuestionInQuestionBank({
            questionText: qText,
            questionType: "MCQ",
            difficulty: "EASY",
            choices: choicesArr,
            correctAnswer: correctArr,
            status: "ACTIVE",
            createdBy: addedBy,
          });

          const qid = created?.questionId ?? created?.id;
          if (qid) createdIds.push(qid);
        } catch (createErr) {
          message.warning(
            `Lỗi khi tạo câu hỏi ${i + 1}: ${
              createErr?.message || "Lỗi server"
            }`
          );
        }
      }

      if (createdIds.length === 0) {
        setSaving(false);
        return message.error("Không có câu hỏi hợp lệ nào được tạo.");
      }

      await addNewCustomQuestionsToLesson(Number(lessonId), {
        lessonId: Number(lessonId),
        questionIds: createdIds,
        addedBy,
      });

      const current = await listQuestionsByLesson(Number(lessonId));
      const oldOnes = current.filter((q) => !createdIds.includes(q.questionId));
      const newOnes = current.filter((q) => createdIds.includes(q.questionId));

      const ordered = [...oldOnes, ...newOnes];
      await Promise.all(
        ordered.map((item, idx) =>
          updateQuestionOrder(item.lessonQuestionId ?? item.id, idx)
        )
      );

      message.success(
        `Thêm ${createdIds.length} quiz vào lesson #${lessonId} thành công!`
      );
      loadStructure?.();
      handleCancel();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message;
      message.error("Lỗi khi thêm Quiz: " + msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={<Title level={4}>Thêm Quiz Mới vào Lesson ID: {lessonId}</Title>}
      open={modal.quiz}
      onCancel={handleCancel}
      width={860}
      destroyOnClose
      footer={
        <Button
          type="primary"
          onClick={() => form.submit()}
          loading={saving}
          block
        >
          Tạo và Thêm Các Quiz Mới
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleAddCustomQuizzes}>
        <Form.Item name="addedBy" initialValue={currentUserId} hidden>
          <InputNumber />
        </Form.Item>

        <Title level={5}>Tạo câu hỏi mới</Title>
        <Form.List name="newQuestions">
          {(fields, { add, remove }) => {
            return (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`Câu hỏi ${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          Xóa
                        </Button>
                      ) : null
                    }
                    style={{ marginBottom: 16, background: "#fafafa" }}
                  >
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item
                          name={[field.name, "questionText"]}
                          label="Nội dung câu hỏi"
                          rules={[
                            {
                              required: true,
                              message: "Nhập nội dung câu hỏi",
                            },
                          ]}
                        >
                          <Input.TextArea
                            rows={2}
                            placeholder="VD: Thủ đô của Việt Nam là gì?"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name={[field.name, "orderIndex"]}
                          label="Thứ tự (tự tính)"
                          initialValue={index}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            disabled
                          />
                        </Form.Item>
                      </Col>
                      <Col
                        span={12}
                        style={{ display: "flex", alignItems: "end" }}
                      >
                        <Form.Item
                          name={[field.name, "isRequired"]}
                          valuePropName="checked"
                          label=" "
                          initialValue={true}
                        >
                          <Checkbox>Yêu cầu bắt buộc</Checkbox>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Text strong>
                          Các lựa chọn (tick để chọn đáp án đúng):
                        </Text>
                        <Form.List name={[field.name, "options"]}>
                          {(optFields, { add: addOpt, remove: remOpt }) => (
                            <>
                              {optFields.map((optField, i) => (
                                <Space
                                  key={optField.key}
                                  align="baseline"
                                  style={{
                                    display: "flex",
                                    marginTop: 8,
                                    width: "100%",
                                  }}
                                >
                                  <Form.Item
                                    name={[optField.name, "isCorrect"]}
                                    valuePropName="checked"
                                  >
                                    <Checkbox />
                                  </Form.Item>
                                  <Form.Item
                                    name={[optField.name, "optionText"]}
                                    style={{ flex: 1 }}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Nhập nội dung lựa chọn",
                                      },
                                    ]}
                                  >
                                    <Input placeholder={`Lựa chọn ${i + 1}`} />
                                  </Form.Item>
                                  {optFields.length > 2 && (
                                    <MinusCircleOutlined
                                      onClick={() => remOpt(optField.name)}
                                      style={{ color: "red" }}
                                    />
                                  )}
                                </Space>
                              ))}
                              <Button
                                type="dashed"
                                onClick={() =>
                                  addOpt({
                                    isCorrect: false,
                                    optionText: "",
                                  })
                                }
                                icon={<PlusOutlined />}
                                block
                                style={{ marginTop: 8 }}
                              >
                                Thêm lựa chọn
                              </Button>
                              <div style={{ marginTop: 8, color: "#888" }}>
                                • Tối thiểu 2 lựa chọn. • Ít nhất 1 đáp án đúng.
                              </div>
                            </>
                          )}
                        </Form.List>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      questionText: "",
                      orderIndex: fields.length,
                      isRequired: true,
                      options: [
                        { isCorrect: false, optionText: "" },
                        { isCorrect: false, optionText: "" },
                      ],
                    })
                  }
                  icon={<PlusOutlined />}
                  block
                >
                  Thêm câu hỏi mới
                </Button>
              </>
            );
          }}
        </Form.List>
      </Form>
    </Modal>
  );
}
