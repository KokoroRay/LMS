// src/components/instructor/Course/AssignmentModal.jsx
import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Switch,
  Space,
  Button,
  message,
} from "antd";
import dayjs from "dayjs";
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../../../services/assignmentService";
import ReactQuill from "react-quill";

export default function AssignmentModal({
  modal,
  setModal,
  editing,
  setEditing,
  context,
  loadStructure,
}) {
  const [form] = Form.useForm();
  const open = modal.assignment;
  const current = editing.assignment;
  const { sessionId } = context || {}; // ❌ bỏ lessonId
  const [content, setContent] = useState("");

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link", "blockquote", "code-block"],
      ["clean"],
    ],
  };

  useEffect(() => {
    if (open) {
      form.resetFields();
      setContent(current?.description ?? "");
      form.setFieldsValue({
        sessionId,
        title: current?.title ?? "",
        postedAt: current?.postedAt ? dayjs(current.postedAt) : dayjs(),
        dueDate: current?.dueDate ? dayjs(current.dueDate) : null,
        maxScore: current?.maxScore ?? 100,
        allowLate: !!current?.allowLate,
      });
    }
  }, [open, form, current, sessionId]);

  const submit = async (values) => {
    const payload = {
      sessionId: values.sessionId,
      title: values.title?.trim(),
      description: content,
      postedAt: values.postedAt
        ? dayjs(values.postedAt).format("YYYY-MM-DDTHH:mm:ss")
        : null,
      dueDate: values.dueDate
        ? dayjs(values.dueDate).format("YYYY-MM-DDTHH:mm:ss")
        : null,
      maxScore: values.maxScore ?? 100,
      allowLate: !!values.allowLate,
    };

    // ❌ Không còn referenceLessonId, assignment gắn session thôi

    if (!payload.title) return message.warning("Tiêu đề không được trống.");
    if (
      payload.postedAt &&
      payload.dueDate &&
      dayjs(payload.dueDate).isBefore(dayjs(payload.postedAt))
    ) {
      return message.warning("Hạn nộp phải sau thời điểm đăng.");
    }

    try {
      if (current?.assignmentId) {
        await updateAssignment(current.assignmentId, payload);
        message.success("Cập nhật bài tập thành công");
      } else {
        await createAssignment(payload);
        message.success("Tạo bài tập thành công");
      }
      setModal((m) => ({ ...m, assignment: false }));
      setEditing({});
      await loadStructure();
    } catch (e) {
      message.error(e?.response?.data?.message || "Lưu bài tập thất bại");
    }
  };

  const remove = async () => {
    try {
      await deleteAssignment(current.assignmentId);
      message.success("Đã xoá bài tập");
      setModal((m) => ({ ...m, assignment: false }));
      setEditing({});
      await loadStructure();
    } catch {
      message.error("Xoá bài tập thất bại");
    }
  };

  return (
    <Modal
      open={open}
      title={current ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
      onCancel={() => setModal((m) => ({ ...m, assignment: false }))}
      onOk={() => form.submit()}
      destroyOnClose
      width={780}
      footer={
        <Space>
          {current?.assignmentId && (
            <Button danger onClick={remove}>
              Xoá
            </Button>
          )}
          <Button
            onClick={() => setModal((m) => ({ ...m, assignment: false }))}
          >
            Hủy
          </Button>
          <Button type="primary" onClick={() => form.submit()}>
            {current ? "Cập nhật" : "Tạo mới"}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Space style={{ width: "100%" }} size={16}>
          <Form.Item
            label="Session"
            name="sessionId"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Input disabled />
          </Form.Item>
        </Space>

        <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
          <Input maxLength={255} showCount placeholder="Tiêu đề bài tập" />
        </Form.Item>

        <Form.Item label="Mô tả">
          <ReactQuill
            theme="snow"
            modules={quillModules}
            value={content}
            onChange={setContent}
          />
        </Form.Item>

        <Space style={{ width: "100%" }} size={16}>
          <Form.Item label="Đăng lúc" name="postedAt" style={{ flex: 1 }}>
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>
          <Form.Item label="Hạn nộp" name="dueDate" style={{ flex: 1 }}>
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>
        </Space>

        <Space style={{ width: "100%" }} size={16}>
          <Form.Item label="Điểm tối đa" name="maxScore" style={{ flex: 1 }}>
            <InputNumber min={0} max={1000} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Nộp trễ"
            name="allowLate"
            valuePropName="checked"
            style={{ flex: 1 }}
          >
            <Switch checkedChildren="Có" unCheckedChildren="Không" />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}
