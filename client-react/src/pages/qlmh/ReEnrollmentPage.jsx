import { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Table,
  Tag,
  message,
  Spin,
  Card,
  Space,
} from "antd";
import { FileDoneOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { fetchAllPointAPI } from "../../services/pointService";
import { useSelector } from "react-redux";
import ReEnrollmentSummary from "../../components/qlmh/reEnrollment/ReEnrollmentSummary";
import PaymentSuccessModal from "../../components/qlmh/reEnrollment/PaymentSuccessModal";
import PaymentFailureModal from "../../components/qlmh/reEnrollment/PaymentFailureModal";
import fetchAllCoursesAPI, {
  getMyReEnrollmentsAPI,
} from "../../services/re-registerService";
import progressService from "../../services/progressService";

const { Title, Text } = Typography;

export default function ReEnrollmentPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((state) => state.auth.user);

  // Load data: điểm + course + progress + danh sách re-enrollments
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const studentId = user?.userId || user?.id;

      if (!studentId) {
        console.error("Không tìm thấy student ID");
        message.error("Không thể lấy thông tin sinh viên");
        return;
      }

      const [pointRes, courseRes, userProgressRes, myReEnrollmentsRes] =
        await Promise.all([
          fetchAllPointAPI(studentId),
          fetchAllCoursesAPI(),
          progressService.getUserProgress(),
          getMyReEnrollmentsAPI(studentId),
        ]);

      console.log("check price", courseRes);
      console.log("checkk course>>>", pointRes);
      console.log("User progress:", userProgressRes);
      console.log("My Re-enrollments (raw):", myReEnrollmentsRes);

      if (pointRes?.data && courseRes?.data) {
        // Map courseId -> price
        const priceMap = new Map(
          courseRes.data.map((course) => [course.courseId, course.price])
        );

        // Danh sách CourseGradeDTO (điểm từng môn)
        const allGrades = Array.isArray(pointRes.data) ? pointRes.data : [];

        // Danh sách ReEnrollmentDTO từ BE
        const reEnrollments = Array.isArray(myReEnrollmentsRes?.data)
          ? myReEnrollmentsRes.data
          : [];

        // Tập courseId đã thanh toán học lại thành công
        const successStatuses = ["PAYMENT_SUCCESS", "ENROLLED", "COMPLETED"];
        const paidCourseIds = new Set();

        reEnrollments.forEach((re) => {
          if (successStatuses.includes(re.status)) {
            // Tìm CourseGradeDTO tương ứng với failedCourseGradeId
            const cg = allGrades.find((g) => g.id === re.failedCourseGradeId);
            if (cg && cg.courseId != null) {
              paidCourseIds.add(cg.courseId);
            }
          }
        });

        console.log("Paid course IDs (re-enroll):", paidCourseIds);

        // Chỉ show các môn FAIL chưa được thanh toán học lại
        const failedCourses = allGrades
          .filter((item) => item.status === "FAIL")
          .filter((item) => !paidCourseIds.has(item.courseId))
          .map((grade) => ({
            ...grade,
            price: priceMap.get(grade.courseId) || 0,
          }));

        console.log("Final grades for display:", failedCourses);
        setGrades(failedCourses);
      } else {
        setGrades([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      message.error("Lỗi khi tải dữ liệu");
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Những môn đang được chọn để đăng ký học lại
  const selectedCourses = grades.filter((grade) =>
    selectedRowKeys.includes(grade.id || grade.gradeId)
  );

  // Chọn dòng bình thường
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (text, record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Course Name",
      dataIndex: "courseName",
      key: "courseName",
    },
    {
      title: "Final Score",
      dataIndex: "finalScore",
      key: "finalScore",
      render: (score, record) =>
        record.gradedAt
          ? score !== null
            ? parseFloat(score).toFixed(2)
            : "N/A"
          : "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        if (status === "PASS") {
          return <Tag color="green">Passed</Tag>;
        } else if (status === "FAIL") {
          return <Tag color="red">Failed</Tag>;
        } else if (status === "IN_PROGRESS") {
          return <Tag color="blue">Đang học</Tag>;
        }
        return <Tag color="default">Chưa có điểm</Tag>;
      },
    },
    // Không còn cột "Trạng thái đăng ký"
  ];

  const customPagination = {
    current: currentPage,
    pageSize: pageSize,
    position: ["bottomRight"],
  };

  const ControlsHeader = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        marginTop: 16,
        padding: "16px 24px",
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow:
          "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
        flexWrap: "wrap",
        gap: 12,
      }}
      className="responsive-header-box"
    >
      <Title
        level={4}
        style={{
          margin: 0,
          display: "flex",
          alignItems: "center",
          fontWeight: 600,
          fontSize: "1.25rem",
          flexShrink: 0,
        }}
      >
        <FileDoneOutlined
          style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
        />
        <span className="mobile-hide-text">Đăng kí học lại</span>
        <span className="desktop-hide-text">Học lại</span>
      </Title>
      {selectedRowKeys.length > 0 && (
        <Space wrap>
          <Text type="secondary" className="mobile-hide-text">Đã chọn:</Text>
          <Text strong style={{ color: "rgb(24, 144, 255)" }}>
            {selectedRowKeys.length} môn
          </Text>
        </Space>
      )}
    </div>
  );

  return (
    <div className="main-content">
      {ControlsHeader}

      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow:
            "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
        }}
        headStyle={{ padding: 0, border: "none" }}
        bodyStyle={{ padding: 0 }}
      >
        <Spin spinning={loading}>
          <Table
            dataSource={grades}
            columns={columns}
            rowKey={(record, index) => record.id || record.gradeId || index}
            rowSelection={rowSelection}
            pagination={customPagination}
            onChange={(pagination) => {
              setCurrentPage(pagination.current);
              setPageSize(pagination.pageSize);
            }}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "Chưa có đăng kí học lại nào." }}
          />
        </Spin>
      </Card>

      {/* Panel đăng ký + thanh toán */}
      {selectedRowKeys.length > 0 && (
        <ReEnrollmentSummary
          selectedCourses={selectedCourses}
          onPaymentSuccess={loadData}
        />
      )}
    </div>
  );
}
