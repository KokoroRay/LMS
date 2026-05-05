import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Spin,
  message,
  Space,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  CreditCardOutlined,
  WalletOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getAllPaymentsAPI } from "../../services/paymentService"; // ===== ĐỔI IMPORT =====
import { getStudentById } from "../../services/studentService";
import "../../styles/admin/class-manager.css";

const { Title, Text } = Typography;

// Helper function để format tiền VNĐ
const VND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

// Helper function để chuyển đổi response thành array
const toArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
};

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]); // ===== ĐỔI TỪ reenrollments SANG payments =====
  const [studentMap, setStudentMap] = useState({}); // Map studentId -> studentName
  const [loadingStudents, setLoadingStudents] = useState(false);

  // ===== LOAD PAYMENTS =====
  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const response = await getAllPaymentsAPI(); // ===== DÙNG getAllPaymentsAPI =====
        console.log("===== PAYMENTS API RESPONSE ======");
        console.log("Full response:", response);
        console.log("Response data:", response?.data);
        console.log("Response data.data:", response?.data?.data);
        
        const data = toArray(response);
        console.log("===== PROCESSED DATA (toArray) ======");
        console.log("Processed array:", data);
        console.log("Total items:", data.length);
        
        if (data.length > 0) {
          console.log("===== FIRST ITEM SAMPLE ======");
          console.log("First item:", data[0]);
          console.log("First item keys:", Object.keys(data[0]));
        }
        
        setPayments(data);
      } catch (error) {
        console.error("Lỗi khi tải lịch sử thanh toán:", error);
        console.error("Error details:", error.response?.data);
        message.error("Không thể tải lịch sử thanh toán");
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  // ===== LOAD STUDENT INFO =====
  // Load thông tin student từ các payments có status SUCCESS
  useEffect(() => {
    async function loadStudentInfo() {
      // ===== LỌC PAYMENTS CÓ STATUS SUCCESS =====
      const successPayments = payments.filter(
        (p) => (p.status || "").toString().toUpperCase() === "SUCCESS"
      );

      if (successPayments.length === 0) {
        setStudentMap({});
        return;
      }

      setLoadingStudents(true);
      try {
        // Lấy danh sách unique student IDs
        const studentIds = [
          ...new Set(
            successPayments
              .map(
                (p) =>
                  p.studentId ??
                  p.userId ??
                  p.student?.id ??
                  p.student?.userId
              )
              .filter((id) => id != null)
          ),
        ];

        // Load thông tin từng student
        const studentPromises = studentIds.map(async (studentId) => {
          try {
            const res = await getStudentById(studentId);
            const studentData = res?.data?.data ?? res?.data ?? {};
            const user = studentData?.user || {};

            // Lấy tên đầy đủ từ nhiều nguồn có thể
            const fullName =
              studentData?.fullName ||
              [studentData?.firstName, studentData?.lastName]
                .filter(Boolean)
                .join(" ") ||
              user?.fullName ||
              [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
              studentData?.name ||
              "—";

            return { id: studentId, name: fullName };
          } catch (error) {
            console.error(`Error loading student ${studentId}:`, error);
            return { id: studentId, name: "—" };
          }
        });

        const students = await Promise.all(studentPromises);
        const map = students.reduce((acc, s) => {
          acc[s.id] = s.name;
          return acc;
        }, {});

        setStudentMap(map);
      } catch (error) {
        console.error("Error loading student info:", error);
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudentInfo();
  }, [payments]);

  // ===== FILTER SUCCESS PAYMENTS =====
  const paymentHistory = useMemo(() => {
    return payments
      .filter(
        (p) => (p.status || "").toString().toUpperCase() === "SUCCESS"
      )
      .map((p) => {
        const studentId =
          p.studentId ?? p.userId ?? p.student?.id ?? p.student?.userId;

        return {
          id: p.id ?? p.paymentId ?? p.payment_id,
          studentId: studentId,
          studentName: studentMap[studentId] || "Đang tải...",
          amount: p.amount ?? p.total ?? 0,
          method: p.method ?? p.paymentMethod ?? "VNPAY",
          status: p.status,
          createdAt:
            p.created_at ??
            p.createdAt ??
            p.paymentDate ??
            p.updatedAt,
          courseId: p.courseId ?? p.course_id ?? p.course?.courseId,
          courseName: p.courseName ?? p.course?.title ?? "—",
        };
      })
      .sort((a, b) => {
        // Sắp xếp theo ngày tạo (mới nhất trước)
        const dateA = dayjs(a.createdAt).valueOf();
        const dateB = dayjs(b.createdAt).valueOf();
        return dateB - dateA;
      });
  }, [payments, studentMap]);

  // ===== CALCULATE STATISTICS =====
  const statistics = useMemo(() => {
    const totalRevenue = paymentHistory.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const totalPayments = paymentHistory.length;

    return {
      totalRevenue,
      totalPayments,
    };
  }, [paymentHistory]);

  // ===== TABLE COLUMNS =====
  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Tên người thanh toán",
      dataIndex: "studentName",
      width: 200,
      render: (name, record) => {
        if (loadingStudents && name === "Đang tải...") {
          return <Spin size="small" />;
        }
        return name || "—";
      },
    },
    {
      title: "Mã môn học",
      dataIndex: "courseId",
      width: 120,
      render: (courseId) => courseId || "—",
    },
    {
      title: "Tên môn học",
      dataIndex: "courseName",
      ellipsis: true,
      render: (courseName) => courseName || "—",
    },
    {
      title: "Phương thức thanh toán",
      dataIndex: "method",
      width: 150,
      render: (method) => (
        <Tag color="blue">{method || "VNPAY"}</Tag>
      ),
    },
    {
      title: "Ngày giờ thanh toán",
      dataIndex: "createdAt",
      width: 180,
      render: (date) => {
        if (!date) return "—";
        return dayjs(date).isValid()
          ? dayjs(date).format("DD/MM/YYYY HH:mm")
          : "—";
      },
    },
    {
      title: "Giá tiền",
      dataIndex: "amount",
      width: 150,
      align: "right",
      render: (amount) => (
        <Text strong style={{ color: "#52c41a" }}>
          {VND(amount || 0)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (status) => {
        const upper = (status || "").toString().toUpperCase();
        return (
          <Tag color={upper === "SUCCESS" ? "green" : "default"}>
            {status || "—"}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="admin-dashboard" style={{ padding: "24px" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Lịch Sử Thanh Toán
      </Title>

      {/* ===== STATISTICS CARDS ===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Statistic
              title="Tổng số giao dịch"
              value={statistics.totalPayments}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Statistic
              title="Tổng doanh thu"
              value={VND(statistics.totalRevenue)}
              prefix={<WalletOutlined />}
              valueStyle={{ color: "#52c41a", fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 14 }}>
                Trạng thái
              </Text>
              <Tag color="green" style={{ fontSize: 16, padding: "4px 12px" }}>
                SUCCESS
              </Tag>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* ===== PAYMENT HISTORY TABLE ===== */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Spin spinning={loading || loadingStudents}>
          <Table
            columns={columns}
            dataSource={paymentHistory}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} giao dịch`,
            }}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: "Chưa có lịch sử thanh toán nào",
            }}
          />
        </Spin>
      </Card>
    </div>
  );
}
