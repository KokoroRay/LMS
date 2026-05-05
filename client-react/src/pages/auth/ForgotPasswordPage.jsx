import { Form, Input, Button, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { forgotPassword, clearError } from "../../redux/api/slices/authSlice";
import { useEffect } from "react";

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const onFinish = async (values) => {
    try {
      const resultAction = await dispatch(forgotPassword(values.email));
      const successMessage = unwrapResult(resultAction);

      message.success(
        successMessage ||
          "Link đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!"
      );
      navigate("/login");
    } catch (err) {
      const errorMessage = err.message || err;
      message.error(errorMessage);
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  return (
    <div className="auth-container">
      <Title level={3} className="auth-title">
        Quên Mật khẩu
      </Title>
      <Text className="auth-subtitle">
        Vui lòng nhập email của bạn để nhận link đặt lại mật khẩu.
      </Text>

      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="email"
          label="Email"
          className="auth-input"
          rules={[
            { required: true, message: "Vui lòng nhập email!" },
            { type: "email", message: "Email không hợp lệ!" },
          ]}
        >
          <Input size="large" placeholder="you@company.com" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            className="auth-button"
          >
            Gửi yêu cầu
          </Button>
        </Form.Item>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <a onClick={() => navigate("/login")} className="auth-link">
            Quay lại trang Đăng nhập
          </a>
        </div>
      </Form>
    </div>
  );
}
