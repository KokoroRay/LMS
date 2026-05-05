import { Form, Input, Button, Typography, message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { resetPassword, clearError } from "../../redux/api/slices/authSlice";
import { useEffect } from "react";
import "../../styles/auth.css";
const { Title, Text } = Typography;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      message.error("Token đặt lại mật khẩu không hợp lệ hoặc bị thiếu.");
      navigate("/forgot-password", { replace: true });
    }
    return () => {
      dispatch(clearError());
    };
  }, [token, navigate, dispatch]);

  const onFinish = async (values) => {
    if (!token) return;

    try {
      const payload = {
        token: token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      };

      const resultAction = await dispatch(resetPassword(payload));
      const successMessage = unwrapResult(resultAction);

      message.success(
        successMessage || "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại."
      );
      navigate("/login", { replace: true });
    } catch (err) {
      const errorMessage = err.message || err;
      message.error(errorMessage);
    }
  };

  if (!token) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>Đang tải...</div>
    );
  }

  return (
    <div className="auth-container">
      <Title level={3} className="auth-title">
        Đặt lại Mật khẩu
      </Title>
      <Text className="auth-subtitle">Vui lòng nhập mật khẩu mới của bạn.</Text>

      <Form
        name="reset_password"
        onFinish={onFinish}
        layout="vertical"
        scrollToFirstError
      >
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          className="auth-input"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (
                  !value ||
                  (value.length >= 8 &&
                    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
                ) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số!"
                  )
                );
              },
            }),
          ]}
          hasFeedback
        >
          <Input.Password size="large" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận Mật khẩu mới"
          dependencies={["newPassword"]}
          className="auth-input"
          hasFeedback
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
          <Input.Password size="large" />
        </Form.Item>

        <Form.Item style={{ marginTop: 40 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            className="auth-button"
          >
            Đặt lại Mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
