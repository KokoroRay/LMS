import { useEffect } from "react";
import { unwrapResult } from "@reduxjs/toolkit";
import { Form, Input, Button, Typography, Row, Col, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError } from "../../redux/api/slices/authSlice";
import CarouselLogin from "../../layouts/CarouselLogin";
import "../../styles/Login.css";

const { Text, Title } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading } = useSelector((state) => state.auth);

  const onFinish = async (values) => {

    try {

      const resultAction = await dispatch(login(values));
      const responsePayload = unwrapResult(resultAction);



      message.success("Đăng nhập thành công!");

      const user = responsePayload.user;

      // Don't navigate manually - let RedirectIfAuthed handle it
      // This prevents conflicts between manual navigation and automatic redirection

      
    } catch (err) {

      message.error(err);
      console.error("Login failed:", err);
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  return (
    // ... (Toàn bộ phần JSX return giữ nguyên)
    <Row gutter={0} style={{ minHeight: "100vh" }}>
      <Col xs={24} md={12} className="login">
        <div className="login-inner">
          <div className="header-login">
            <img
              className="login-logo"
              src="/images/LogoManKai.svg"
              alt="Mankai"
            />
            <div className="auth__panel">
              <Title level={3} className="login-title">
                Đăng nhập
              </Title>
              <Text className="login-subtitle">
                Khám phá kho tàng kiến thức bất tận cùng bộ tài liệu độc quyền
                với Mankai Academy
              </Text>
            </div>
            <Form
              form={form}
              layout="vertical"
              className="auth__form"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input
                  size="large"
                  prefix={
                    <img src="/icons/sms.svg" alt="mail" className="icon-svg" />
                  }
                  placeholder="you@company.com"
                  className="login-input"
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
              >
                <Input.Password
                  size="large"
                  prefix={
                    <img
                      src="/icons/lock.svg"
                      alt="lock"
                      className="icon-svg"
                    />
                  }
                  placeholder="********"
                  className="login-input"
                />
              </Form.Item>
              <div className="link-forgot">
                <a href="/forgot-password">Quên mật khẩu?</a>
              </div>
              <Form.Item>
                <Button
                  type="primary"
                  size="large"
                  block
                  className="submit-login"
                  htmlType="submit"
                  loading={loading}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Col>
      <Col xs={0} md={12} className="login-right">
        <CarouselLogin />
      </Col>

    </Row>
  );
}
