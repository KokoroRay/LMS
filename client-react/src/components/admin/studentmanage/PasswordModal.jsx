import React from "react";
import { Modal, Form, Input, message as antdMessage } from "antd";

export default function PasswordModal({ open, onClose, user, onSubmitted, apiUpdateStudent }) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const v = await form.validateFields();
      await apiUpdateStudent(user.userId, {
        email: (user.email || "").toLowerCase(),
        password: v.password.trim(),
      });
      antdMessage.success("Cập nhật mật khẩu thành công");
      onSubmitted();
      form.resetFields();
    } catch (e) {
      if (e?.errorFields) return;
      antdMessage.error(e?.response?.data?.message || "Cập nhật mật khẩu thất bại");
    }
  };

  return (
    <Modal
      title={`Đổi mật khẩu cho ${user?.username || ""}`}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Cập nhật"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item name="password" label="Mật khẩu mới" rules={[{ required: true }]} hasFeedback>
          <Input.Password placeholder="Mật khẩu mới" />
        </Form.Item>
        <Form.Item
          name="confirm" label="Xác nhận mật khẩu mới" dependencies={["password"]} hasFeedback
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                return !value || getFieldValue("password") === value
                  ? Promise.resolve()
                  : Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Xác nhận mật khẩu mới" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
