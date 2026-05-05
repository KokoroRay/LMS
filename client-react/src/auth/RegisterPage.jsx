// src/pages/auth/RegisterPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { Card, Form, Input, Button, Typography, Space, message } from "antd";

const { Title, Text } = Typography;

// ✅ Use same BaseURL configuration as authService.js
const DOMAIN = import.meta.env.VITE_API_BASE || 'https://d1ybhieu7adt5b.cloudfront.net';
const CLEAN_DOMAIN = DOMAIN.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN;
const API_BASE_URL = `${CLEAN_DOMAIN}/api/v1`;

console.log('🔌 RegisterPage API Base URL:', API_BASE_URL);

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Đăng ký -> nếu ok thì tự login và lưu token
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 1) Register
      await axios.post(`${API_BASE_URL}/auth/register`, {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
      });

      message.success("Đăng ký thành công. Đang đăng nhập…");

      // 2) Auto-login để lấy token
      const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: values.email,
        password: values.password,
      });

      const accessToken = loginRes?.data?.accessToken;
      if (accessToken) {
        localStorage.setItem("auth", JSON.stringify({ accessToken }));
      }

      message.success("Đăng nhập thành công!");
      // Điều hướng tuỳ bạn (VD: về /admin)
      window.location.href = "/admin";
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Register/Login failed";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f7fb" }}>
      <Card style={{ width: 380, borderRadius: 16, boxShadow: "0 6px 18px rgba(0,0,0,.06)" }} bodyStyle={{ padding: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <div style={{ textAlign: "center" }}>
            <Title level={4} style={{ marginBottom: 4 }}>Tạo tài khoản</Title>
            <Text type="secondary">Đăng ký nhanh để vào trang quản trị</Text>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input placeholder="you@example.com" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { min: 6, message: "Tối thiểu 6 ký tự" },
              ]}
              hasFeedback
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="Xác nhận mật khẩu"
              dependencies={["password"]}
              hasFeedback
              rules={[
                { required: true, message: "Nhập lại mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) return Promise.resolve();
                    return Promise.reject(new Error("Mật khẩu không khớp"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item name="username" label="Username" rules={[{ required: true, message: "Nhập username" }]}>
              <Input placeholder="admin" />
            </Form.Item>

            <Form.Item name="firstName" label="First name" rules={[{ required: true, message: "Nhập first name" }]}>
              <Input placeholder="System" />
            </Form.Item>

            <Form.Item name="lastName" label="Last name" rules={[{ required: true, message: "Nhập last name" }]}>
              <Input placeholder="Admin" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Đăng ký & đăng nhập
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
