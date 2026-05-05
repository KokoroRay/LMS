import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { useDispatch } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { changePassword } from "../../redux/api/slices/authSlice";

const ChangePasswordModal = ({ visible, onCancel, forceChange = false }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const resultAction = await dispatch(changePassword(values));
      unwrapResult(resultAction);
      message.success("Đổi mật khẩu thành công!");

      if (forceChange) {
        dispatch({ type: "auth/passwordChangedSuccess", payload: true });
      }

      form.resetFields();
      if (onCancel) onCancel();
    } catch (err) {
      message.error(err || "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={forceChange ? "Bắt buộc đổi mật khẩu" : "Đổi mật khẩu"}
      open={visible}
      closable={!forceChange}
      maskClosable={!forceChange}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel} disabled={forceChange}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          Lưu mật khẩu mới
        </Button>,
      ]}
    >
      {forceChange && (
        <p>
          Đây là lần đăng nhập đầu tiên của bạn. Vui lòng đổi mật khẩu để tiếp
          tục sử dụng hệ thống.
        </p>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginTop: 20 }}
      >
        <Form.Item
          name="currentPassword"
          label="Mật khẩu hiện tại"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu hiện tại!" },
          ]}
        >
          <Input.Password
            placeholder={
              forceChange ? "Mật khẩu mặc định là 123456" : "Mật khẩu hiện tại"
            }
          />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới!" },
            { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự." },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
              message:
                "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.",
            },
          ]}
        >
          <Input.Password placeholder="Ít nhất 8 ký tự, có hoa, thường, số" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp!")
                );
              },
            }),
          ]}
        >
          <Input.Password placeholder="Nhập lại mật khẩu mới" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
