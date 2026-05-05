import { useState } from "react";
import { Card, Row, Col, Button, message, Spin, Space } from "antd";
import { CheckOutlined, DollarOutlined } from "@ant-design/icons";
import SelectedCoursesList from "./SelectedCoursesList";
import PaymentMethodSection from "./PaymentMethodSection";
import {
  createReEnrollmentAPI,
  createReEnrollmentPaymentAPI,
} from "../../../services/re-registerService";
import { useSelector } from "react-redux";

export default function ReEnrollmentSummary({ selectedCourses = [], onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);
  const [reEnrollmentIds, setReEnrollmentIds] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const user = useSelector((state) => state.auth.user);

  // Hàm xử lý đăng ký học lại
  const handleRegister = async () => {
    if (selectedCourses.length === 0) {
      message.warning("Vui lòng chọn ít nhất một môn học");
      return;
    }

    try {
      setLoading(true);
      const studentId = user?.userId || user?.id;

      if (!studentId) {
        message.error("Không tìm thấy thông tin sinh viên");
        return;
      }

      // Tạo đăng ký học lại cho từng môn
      const promises = selectedCourses.map((course) =>
        createReEnrollmentAPI(studentId, course.id || course.gradeId)
      );

      const results = await Promise.all(promises);
      const ids = results
        .map((res) => res?.data?.data?.id || res?.data?.id)
        .filter((id) => id !== undefined);

      if (ids.length > 0) {
        setReEnrollmentIds(ids);
        setIsRegistered(true);
        message.success(`Đăng ký học lại thành công cho ${ids.length} môn học`);
        if (typeof onPaymentSuccess === 'function') {
          onPaymentSuccess();
        }
      } else {
        message.error("Không thể tạo đăng ký học lại");
      }
    } catch (error) {
      console.error("Lỗi khi đăng ký học lại:", error);
      
      // Xử lý lỗi 403 cụ thể
      if (error?.response?.status === 403) {
        const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.error ||
                           "Bạn không có quyền thực hiện thao tác này. Vui lòng kiểm tra lại quyền truy cập.";
        message.error(errorMessage);
      } else {
        message.error(
          error?.response?.data?.message || "Lỗi khi đăng ký học lại"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý thanh toán
  const handlePayment = async () => {
    if (reEnrollmentIds.length === 0) {
      message.warning("Vui lòng đăng ký học lại trước");
      return;
    }

    try {
      setLoading(true);
      const response = await createReEnrollmentPaymentAPI(
        reEnrollmentIds,
        "VNPAY"
      );

      // Nếu có URL thanh toán, redirect đến VNPAY
      if (response?.data?.data?.paymentUrl) {
        window.location.href = response.data.data.paymentUrl;
      } else if (response?.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        message.success("Đang chuyển hướng đến cổng thanh toán VNPAY...");
        // If payment was successful and no redirect, manually trigger data reload
        if (typeof onPaymentSuccess === 'function') {
            onPaymentSuccess();
        }
      }
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      message.error(
        error?.response?.data?.message || "Lỗi khi tạo thanh toán"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      bordered={false}
      style={{
        marginTop: 24,
        borderRadius: 8,
        boxShadow:
          "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
      }}
      bodyStyle={{ padding: 24 }}
    >
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <SelectedCoursesList selectedCourses={selectedCourses} />
        </Col>
        <Col xs={24} md={12}>
          <PaymentMethodSection />
        </Col>
      </Row>

      {/* Nút hành động */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Space size="middle" style={{ width: "100%", justifyContent: "flex-end" }}>
            {!isRegistered ? (
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                onClick={handleRegister}
                loading={loading}
                style={{
                  minWidth: 180,
                  height: 45,
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                Đăng ký học lại
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<DollarOutlined />}
                onClick={handlePayment}
                loading={loading}
                style={{
                  minWidth: 180,
                  height: 45,
                  fontSize: "16px",
                  fontWeight: 500,
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                }}
              >
                Thanh toán học lại
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
