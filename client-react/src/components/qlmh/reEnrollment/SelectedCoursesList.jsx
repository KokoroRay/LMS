import { Card, Typography, Divider } from "antd";
import { BookOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function SelectedCoursesList({ selectedCourses = [] }) {
  // Tính tổng tiền từ các môn đã chọn
  const totalAmount = selectedCourses.reduce((sum, course) => {
    return sum + (course.price || 0);
  }, 0);

  return (
    <div style={{ height: "100%" }}>
      <Title level={5} style={{ marginBottom: 16 }}>
        Danh sách môn học đăng ký lại
      </Title>
      
      <div
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          marginBottom: 16,
        }}
      >
        {selectedCourses.length === 0 ? (
          <Text type="secondary" style={{ fontStyle: "italic" }}>
            Chưa có môn học nào được chọn
          </Text>
        ) : (
          selectedCourses.map((course, index) => (
            <div
              key={course.id || course.gradeId || index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                marginBottom: 8,
                backgroundColor: "#f5f5f5",
                borderRadius: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <BookOutlined
                  style={{ marginRight: 12, color: "rgb(24, 144, 255)" }}
                />
                <Text strong>{course.courseName || "N/A"}</Text>
              </div>
              <Text style={{ color: "rgb(24, 144, 255)", fontWeight: 500 }}>
                {(course.price || 0).toLocaleString("vi-VN")} VNĐ
              </Text>
            </div>
          ))
        )}
      </div>

      <Divider style={{ margin: "16px 0" }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px",
          backgroundColor: "#f0f2f5",
          borderRadius: 6,
        }}
      >
        <Text strong style={{ fontSize: "16px" }}>
          Tổng tiền:
        </Text>
        <Text strong style={{ fontSize: "18px", color: "rgb(24, 144, 255)" }}>
          {totalAmount.toLocaleString("vi-VN")} VNĐ
        </Text>
      </div>
    </div>
  );
}
