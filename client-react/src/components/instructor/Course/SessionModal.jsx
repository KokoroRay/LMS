import React from "react";
import { Modal, Form, Input, InputNumber, Button, Space, message, Popconfirm } from "antd";
import { createSession, updateSession, deleteSession } from "../../../services/sessionService";

export default function SessionModal({ modal, setModal, editing, setEditing, courseId, loadStructure, sessions }) {
  const [form] = Form.useForm();
  const open = modal.session;
  const current = editing.session;

  const onOpen = () => {
    const nextPosition = (sessions?.length ?? 0) + 1;
    form.resetFields();
    form.setFieldsValue({
      title: current?.title ?? current?.name ?? "",
      position: current?.position ?? nextPosition,
    });
  };

  const submit = async (values) => {
    if (!courseId) {
      message.error("Chưa chọn khoá học");
      return;
    }
    const body = {
      title: values.title?.trim(),
      courseId,
      position: Number(values.position ?? 0),
    };
    try {
      if (current?.sessionId) {
        await updateSession(current.sessionId, body);
        message.success("Cập nhật chương thành công");
      } else {
        await createSession(body);
        message.success("Tạo chương thành công");
      }
      setModal((m) => ({ ...m, session: false }));
      setEditing({});
      loadStructure();
    } catch (e) {
      const msg = e?.response?.data?.message || "Lưu chương thất bại";
      message.error(msg);
    }
  };

  const remove = async () => {
    try {
      await deleteSession(current.sessionId);
      message.success("Đã xoá chương");
      setModal((m) => ({ ...m, session: false }));
      setEditing({});
      loadStructure();
    } catch (e) {
      const msg = e?.response?.data?.message || "Xoá chương thất bại";
      message.error(msg);
    }
  };

  return (
    <Modal
      open={open}
      title={current ? "Chỉnh sửa chương" : "Thêm chương mới"}
      onCancel={() => setModal((m) => ({ ...m, session: false }))}
      onOk={() => form.submit()}
      afterOpenChange={(o) => o && onOpen()}
      destroyOnClose
      footer={
        <Space>
          {current?.sessionId && (
            <Popconfirm
              title="Xoá chương?"
              description="Hành động này không thể hoàn tác."
              okText="Xoá"
              okButtonProps={{ danger: true }}
              cancelText="Huỷ"
              onConfirm={remove}
            >
              <Button danger>Xoá</Button>
            </Popconfirm>
          )}
          <Button onClick={() => setModal((m) => ({ ...m, session: false }))}>Hủy</Button>
          <Button type="primary" onClick={() => form.submit()}>
            {current ? "Cập nhật" : "Tạo mới"}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          label="Tiêu đề chương"
          name="title"
          rules={[{ required: true, message: "Nhập tiêu đề chương" }]}
        >
          <Input maxLength={255} showCount placeholder="VD: Session 1 - Giới thiệu" />
        </Form.Item>
        <Form.Item label="Vị trí (thứ tự)" name="position" tooltip="Số nhỏ hiển thị trước">
          <InputNumber min={1} max={9999} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
