import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Checkbox,
  Button,
  message,
  Spin,
  Typography,
  Space,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  updateLessonQuestionDetails, 
  updateQuestionOrder,
  getQuestionBankById,
  updateQuestionInQuestionBank,
} from "../../../../services/lessonQuestionService";

const { Text } = Typography;

const parseArrayMaybeJson = (v) => {
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

const extractChoicesFromEditing = (editing) => {
  const q = editing?.question || {};
  const choices = parseArrayMaybeJson(q.choices ?? editing?.choices);
  const correct = parseArrayMaybeJson(
    q.correctAnswer ?? editing?.correctAnswer
  );
  const questionText = q.questionText ?? editing?.questionText ?? "";
  return { questionText, choices, correct };
};

export default function QuizDetailModal({
  modal,
  setModal,
  editing,
  loadStructure,
}) {
  const [form] = Form.useForm();
  const [qForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [qLoading, setQLoading] = useState(false);

  const { lessonQuestionId, orderIndex, isRequired } = editing || {};
  const questionId = editing?.question?.questionId ?? editing?.questionId;

  useEffect(() => {
    if (!modal.viewQuiz) {
      form.resetFields();
      qForm.resetFields();
      return;
    }

    form.setFieldsValue({
      orderIndex: Number.isFinite(orderIndex) ? orderIndex : 0,
      isRequired: !!isRequired,
    });

    const { questionText, choices, correct } =
      extractChoicesFromEditing(editing);
    if (questionText || choices.length) {
      qForm.setFieldsValue({
        questionText,
        options: (choices.length ? choices : ["", ""]).map((opt) => ({
          optionText: String(opt ?? ""),
          isCorrect: correct.includes(opt),
        })),
      });
      return;
    }

    if (questionId) {
      (async () => {
        try {
          setQLoading(true);
          const qb = await getQuestionBankById(questionId);
          const _choices = parseArrayMaybeJson(qb?.choices ?? qb?._choices);
          const _correct = parseArrayMaybeJson(
            qb?.correctAnswer ?? qb?._correct
          );
          qForm.setFieldsValue({
            questionText: qb?.questionText || "",
            // points đã bị bỏ
            options: (_choices.length ? _choices : ["", ""]).map((opt) => ({
              optionText: String(opt ?? ""),
              isCorrect: _correct.includes(opt),
            })),
          });
        } catch {
          message.warning("Không tải được chi tiết câu hỏi.");
          qForm.setFieldsValue({
            questionText: "",
            options: [
              { optionText: "", isCorrect: false },
              { optionText: "", isCorrect: false },
            ],
          });
        } finally {
          setQLoading(false);
        }
      })();
    }
  }, [
    modal.viewQuiz,
    orderIndex,
    isRequired,
    questionId,
    editing,
    form,
    qForm,
  ]);

  const handleOk = async () => {
    if (!lessonQuestionId) return message.error("Thiếu LessonQuestion ID");
    try {
      setLoading(true);

      const lv = await form.validateFields();
      const nextOrder = Number(lv.orderIndex);
      const nextRequired = !!lv.isRequired;

      if (nextOrder !== (editing?.orderIndex ?? 0)) {
        await updateQuestionOrder(lessonQuestionId, nextOrder);
      }
      if (nextRequired !== !!editing?.isRequired) {
        await updateLessonQuestionDetails(lessonQuestionId, nextRequired); // Updated usage
      }

      const qv = await qForm.validateFields();
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

      if (questionId) {
        await updateQuestionInQuestionBank(questionId, {
          questionText: qv.questionText,
          choices: choices,
          correctAnswer: correctAnswer,
          questionType: "MCQ",
          difficulty: "EASY",
          status: "ACTIVE",
        });
      }

      message.success("Cập nhật Quiz thành công");
      loadStructure?.();
      handleCancel();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Có lỗi xảy ra";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    qForm.resetFields();
    setModal((m) => ({ ...m, viewQuiz: false }));
  };

  return (
    <Modal
      open={modal.viewQuiz}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
      title={`Chi tiết Quiz - ID ${lessonQuestionId ?? "?"}`}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Hủy
        </Button>,
        <Button key="ok" type="primary" onClick={handleOk} loading={loading}>
          Lưu thay đổi
        </Button>,
      ]}
    >
      <Spin spinning={qLoading}>
        <Form form={qForm} layout="vertical">
          <Form.Item
            name="questionText"
            label="CÂU HỎI"
            rules={[{ required: true, message: "Nhập nội dung câu hỏi" }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập nội dung câu hỏi" />
          </Form.Item>

          {/* Form.Item name="points" ĐÃ BỊ XÓA */}

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
                    return Promise.reject(new Error("Các lựa chọn không được trùng nhau."));
                  }
                  if (!options.some((option) => option.isCorrect)) {
                    return Promise.reject(new Error("Chưa chọn đáp án đúng."));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                <div style={{ marginBottom: 6 }}>
                  <Text type="secondary">
                    LỰA CHỌN & ĐÁP ÁN (tick đáp án đúng)
                  </Text>
                </div>
                {fields.map((f, i) => (
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
                      <Input placeholder={`Lựa chọn ${i + 1}`} />
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
                <div style={{ marginTop: 8, color: "#888" }}>
                  • Tối thiểu 2 lựa chọn • Ít nhất 1 đáp án đúng • Các lựa chọn không được trùng nhau
                </div>
              </>
            )}
          </Form.List>
        </Form>

        <div style={{ height: 12 }} />

        <Form form={form} layout="vertical">
          <Form.Item
            name="orderIndex"
            label="Thứ tự hiển thị trong bài học"
            rules={[{ required: true, message: "Nhập thứ tự hiển thị!" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="isRequired" valuePropName="checked">
            <Checkbox>Bắt buộc</Checkbox>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
