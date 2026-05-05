import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Checkbox,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Popconfirm,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  updateQuestionOrder,
  updateQuestionInQuestionBank,
  removeQuestionFromLesson,
  createNewQuestionInQuestionBank,
  updateLessonQuestionDetails,
  addQuestionToLesson,
} from "../../../../services/lessonQuestionService";

const { Title, Text } = Typography;

/* ------------ helpers ------------ */
const parseArr = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const a = JSON.parse(v);
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  }
  return [];
};

const extractFromQuizItem = (quizItem) => {
  const q = quizItem?.question || quizItem || {};
  const choices = parseArr(q.choices ?? quizItem?.choices);
  const correct = parseArr(q.correctAnswer ?? quizItem?.correctAnswer);
  return {
    questionId: q.questionId ?? quizItem?.questionId,
    questionText: q.questionText ?? quizItem?.questionText ?? "",
    choices,
    correct,
    orderIndex: quizItem?.orderIndex ?? 0,
    isRequired: !!quizItem?.isRequired,
    lessonQuestionId: quizItem?.lessonQuestionId ?? quizItem?.id,
  };
};

export default function QuizEditorDrawer({
  open,
  onClose,
  lessonId,
  quizItem,
  onSaved,
  onDeleted,
}) {
  const [qForm] = Form.useForm();      // form cho chế độ edit 1 câu hỏi
  const [lForm] = Form.useForm();
  const [multiForm] = Form.useForm();  // form cho chế độ nhiều câu hỏi
  const [saving, setSaving] = useState(false);

  // TODO: lấy từ auth
  const currentUserId = 1;

  const isNewQuiz = useMemo(() => !quizItem?.lessonQuestionId, [quizItem]);

  useEffect(() => {
    if (!open) {
      qForm.resetFields();
      lForm.resetFields();
      multiForm.resetFields();
      return;
    }

    if (isNewQuiz) {
      // 🆕 Tạo mới: khởi tạo 1 câu hỏi trống + 2 lựa chọn
      multiForm.setFieldsValue({
        questions: [
          {
            questionText: "",
            points: 10,
            isRequired: true,
            options: [
              { optionText: "", isCorrect: false },
              { optionText: "", isCorrect: false },
            ],
          },
        ],
      });
    } else {
      // ✏️ Edit: giữ logic cũ
      const seed = extractFromQuizItem(quizItem);
      qForm.setFieldsValue({
        questionText: seed.questionText,
        options: (seed.choices.length ? seed.choices : ["", ""]).map((opt) => ({
          optionText: String(opt),
          isCorrect: seed.correct.includes(opt),
        })),
      });
      lForm.setFieldsValue({
        orderIndex: seed.orderIndex,
        isRequired: seed.isRequired,
      });
    }
  }, [open, quizItem, isNewQuiz, qForm, lForm, multiForm]);

  const ids = useMemo(() => extractFromQuizItem(quizItem), [quizItem]);

  /* ------------------ SAVE NHIỀU CÂU HỎI (chế độ tạo mới) ------------------ */
  const handleMultiSave = async () => {
    if (!lessonId) {
      message.error("Thiếu Lesson ID.");
      return;
    }

    try {
      setSaving(true);
      const values = await multiForm.validateFields();
      const questions = values.questions || [];

      if (!questions.length) {
        message.error("Cần ít nhất 1 câu hỏi.");
        return;
      }

      // TODO: nếu bạn muốn orderIndex bắt đầu từ số khác,
      // có thể truyền prop từ ngoài vào, ở đây mình cho từ 0,1,2,...
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const options = q.options || [];

        const cleanedOptions = options
          .map((o) => ({
            optionText: String(o?.optionText ?? "").trim(),
            isCorrect: !!o?.isCorrect,
          }))
          .filter((o) => o.optionText);

        const choices = cleanedOptions.map((o) => o.optionText);
        const correctAnswer = cleanedOptions
          .filter((o) => o.isCorrect)
          .map((o) => o.optionText);

        const newQuestion = await createNewQuestionInQuestionBank({
          questionText: q.questionText,
          choices,
          correctAnswer,
          questionType: "MCQ",
          difficulty: "EASY",
          status: "ACTIVE",
          createdBy: currentUserId,
        });

        await addQuestionToLesson(lessonId, {
          lessonId,
          questionId: newQuestion.questionId,
          orderIndex: i,
          isRequired: q.isRequired ?? true,
          addedBy: currentUserId,
        });
      }

      message.success("Đã lưu tất cả câu hỏi vào bài học");
      onSaved?.();
      onClose?.();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Lưu thất bại";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ------------------ SAVE 1 CÂU HỎI (chế độ edit cũ) ------------------ */
  const handleSaveSingle = async () => {
    if (!lessonId) {
      message.error("Thiếu Lesson ID.");
      return;
    }

    try {
      setSaving(true);

      const qv = await qForm.validateFields();
      const lv = await lForm.validateFields();

      const options = qv.options || [];
      const cleanedOptions = options
        .map((o) => ({
          optionText: String(o?.optionText ?? "").trim(),
          isCorrect: !!o?.isCorrect,
        }))
        .filter((o) => o.optionText);

      const choices = cleanedOptions.map((o) => o.optionText);
      const correctAnswer = cleanedOptions
        .filter((o) => o.isCorrect)
        .map((o) => o.optionText);

      if (!ids.lessonQuestionId || !ids.questionId) {
        message.error("Thiếu ID (lessonQuestionId/questionId).");
        return;
      }

      const orderNext = Number(lv.orderIndex ?? 0);
      const requiredNext = !!lv.isRequired;

      if (orderNext !== (ids.orderIndex ?? 0)) {
        await updateQuestionOrder(ids.lessonQuestionId, orderNext);
      }

      if (requiredNext !== !!ids.isRequired) {
        await updateLessonQuestionDetails(ids.lessonQuestionId, requiredNext);
      }

      await updateQuestionInQuestionBank(ids.questionId, {
        questionText: qv.questionText,
        choices,
        correctAnswer,
        questionType: "MCQ",
        difficulty: "EASY",
        status: "ACTIVE",
      });

      message.success("Đã lưu thay đổi Quiz");
      onSaved?.();
      onClose?.();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Lưu thất bại";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lessonId || !ids.questionId) return;
    try {
      await removeQuestionFromLesson(lessonId, ids.questionId);
      message.success("Đã xoá Quiz khỏi bài học");
      onDeleted?.();
      onClose?.();
    } catch (e) {
      const msg = e?.response?.data?.message || "Xoá Quiz thất bại";
      message.error(msg);
    }
  };

  /* ------------------ RENDER UI ------------------ */

  const renderMultiQuestionForm = () => (
    <Form form={multiForm} layout="vertical">
      <Form.List
        name="questions"
        rules={[
          {
            validator: async (_, qs) => {
              if (!qs || qs.length < 1) {
                return Promise.reject(new Error("Cần ít nhất 1 câu hỏi."));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, qIndex) => (
              <div
                key={field.key}
                style={{
                  marginBottom: 24,
                  padding: 16,
                  borderRadius: 8,
                  border: "1px solid #f0f0f0",
                  background: "#fafafa",
                }}
              >
                <Space
                  align="baseline"
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Title level={5} style={{ margin: 0 }}>
                    Câu hỏi {qIndex + 1}
                  </Title>
                  {fields.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    >
                      Xoá câu hỏi
                    </Button>
                  )}
                </Space>

                <Form.Item
                  name={[field.name, "questionText"]}
                  label="Câu hỏi"
                  rules={[
                    { required: true, message: "Nhập nội dung câu hỏi" },
                  ]}
                >
                  <Input.TextArea rows={3} placeholder="Nhập nội dung câu hỏi" />
                </Form.Item>


                <Form.Item
                  name={[field.name, "isRequired"]}
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Checkbox>Bắt buộc</Checkbox>
                </Form.Item>

                <Form.List
                  name={[field.name, "options"]}
                  rules={[
                    {
                      validator: async (_, options) => {
                        if (!options || options.length < 2) {
                          return Promise.reject(
                            new Error("Cần ít nhất 2 lựa chọn.")
                          );
                        }
                        const cleanedOptions = options
                          .map((o) =>
                            String(o?.optionText ?? "").trim()
                          )
                          .filter(Boolean);
                        if (
                          new Set(cleanedOptions).size !==
                          cleanedOptions.length
                        ) {
                          return Promise.reject(
                            new Error(
                              "Các lựa chọn không được trùng nhau."
                            )
                          );
                        }
                        if (!options.some((option) => option.isCorrect)) {
                          return Promise.reject(
                            new Error("Chưa chọn đáp án đúng.")
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  {(optFields, { add: addOpt, remove: removeOpt }) => (
                    <>
                      <Text type="secondary">
                        Tick để đánh dấu đáp án đúng
                      </Text>
                      <div style={{ height: 8 }} />
                      {optFields.map((f, idx) => (
                        <Space
                          key={f.key}
                          align="baseline"
                          style={{
                            display: "flex",
                            marginBottom: 8,
                          }}
                        >
                          <Form.Item
                            name={[f.name, "isCorrect"]}
                            valuePropName="checked"
                          >
                            <Checkbox />
                          </Form.Item>
                          <Form.Item
                            name={[f.name, "optionText"]}
                            style={{ flex: 1 }}
                            rules={[
                              {
                                required: true,
                                message: "Nhập nội dung lựa chọn",
                              },
                            ]}
                          >
                            <Input placeholder={`Lựa chọn ${idx + 1}`} />
                          </Form.Item>
                          {optFields.length > 2 && (
                            <MinusCircleOutlined
                              onClick={() => removeOpt(f.name)}
                              style={{ color: "red" }}
                            />
                          )}
                        </Space>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() =>
                          addOpt({ optionText: "", isCorrect: false })
                        }
                        icon={<PlusOutlined />}
                        block
                      >
                        Thêm lựa chọn
                      </Button>
                    </>
                  )}
                </Form.List>
              </div>
            ))}

            <Button
              type="dashed"
              onClick={() =>
                add({
                  questionText: "",
                  points: 10,
                  isRequired: true,
                  options: [
                    { optionText: "", isCorrect: false },
                    { optionText: "", isCorrect: false },
                  ],
                })
              }
              icon={<PlusOutlined />}
              block
            >
              Thêm câu hỏi
            </Button>
          </>
        )}
      </Form.List>
    </Form>
  );

  const renderSingleQuestionForm = () => (
    <>
      <Title level={5} style={{ marginTop: 0 }}>
        Câu hỏi & Đáp án
      </Title>
      <Form form={qForm} layout="vertical">
        <Form.Item
          name="questionText"
          label="Câu hỏi"
          rules={[{ required: true, message: "Nhập nội dung câu hỏi" }]}
        >
          <Input.TextArea rows={3} placeholder="Nhập nội dung câu hỏi" />
        </Form.Item>

        <Form.List
          name="options"
          rules={[
            {
              validator: async (_, options) => {
                if (!options || options.length < 2) {
                  return Promise.reject(new Error("Cần ít nhất 2 lựa chọn."));
                }
                const cleanedOptions = options
                  .map((o) => String(o?.optionText ?? "").trim())
                  .filter(Boolean);
                if (new Set(cleanedOptions).size !== cleanedOptions.length) {
                  return Promise.reject(
                    new Error("Các lựa chọn không được trùng nhau.")
                  );
                }
                if (!options.some((option) => option.isCorrect)) {
                  return Promise.reject(
                    new Error("Chưa chọn đáp án đúng.")
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          {(fields, { add, remove }) => (
            <>
              <Text type="secondary">Tick để đánh dấu đáp án đúng</Text>
              <div style={{ height: 8 }} />
              {fields.map((f, idx) => (
                <Space
                  key={f.key}
                  align="baseline"
                  style={{ display: "flex", marginBottom: 8 }}
                >
                  <Form.Item
                    name={[f.name, "isCorrect"]}
                    valuePropName="checked"
                  >
                    <Checkbox />
                  </Form.Item>
                  <Form.Item
                    name={[f.name, "optionText"]}
                    style={{ flex: 1 }}
                    rules={[
                      { required: true, message: "Nhập nội dung lựa chọn" },
                    ]}
                  >
                    <Input placeholder={`Lựa chọn ${idx + 1}`} />
                  </Form.Item>
                  {fields.length > 2 && (
                    <MinusCircleOutlined
                      onClick={() => remove(f.name)}
                      style={{ color: "red" }}
                    />
                  )}
                </Space>
              ))}
              <Button
                type="dashed"
                onClick={() => add({ optionText: "", isCorrect: false })}
                icon={<PlusOutlined />}
                block
              >
                Thêm lựa chọn
              </Button>
            </>
          )}
        </Form.List>
      </Form>

      <Divider />

      <Title level={5}>Thiết lập trong bài học</Title>
      <Form form={lForm} layout="vertical">
        <Form.Item
          name="orderIndex"
          label="Thứ tự hiển thị"
          rules={[{ required: true, message: "Nhập thứ tự hiển thị!" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="isRequired" valuePropName="checked">
          <Checkbox>Bắt buộc</Checkbox>
        </Form.Item>
      </Form>
    </>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnClose
      width={780}
      title={
        isNewQuiz
          ? "Tạo nhiều câu hỏi cho bài học"
          : `Chỉnh sửa Quiz • ID #${ids.lessonQuestionId ?? "?"}`
      }
      extra={
        <Space>
          {!isNewQuiz && (
            <Popconfirm
              title="Xoá Quiz khỏi bài học?"
              description="Hành động này không thể hoàn tác."
              okText="Xoá"
              okButtonProps={{ danger: true }}
              cancelText="Huỷ"
              onConfirm={handleDelete}
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={isNewQuiz ? handleMultiSave : handleSaveSingle}
            loading={saving}
          >
            {isNewQuiz ? "Lưu tất cả câu hỏi" : "Lưu"}
          </Button>
        </Space>
      }
    >
      {isNewQuiz ? renderMultiQuestionForm() : renderSingleQuestionForm()}
    </Drawer>
  );
}
