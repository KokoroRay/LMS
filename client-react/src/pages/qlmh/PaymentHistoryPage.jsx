import { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Table,
  Tag,
  message,
  Spin,
  Card,
  Space,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  CreditCardOutlined,
  WalletOutlined,
  // CheckCircleOutlined, // ===== BỎ IMPORT NÀY =====
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { getMyPaymentsAPI } from "../../services/paymentService";

const { Title, Text } = Typography;

// ===== HELPER - Format tiền VNĐ =====
const VND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

// ===== HELPER - Chuyển đổi response thành array =====
const toArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
};

export default function PaymentHistoryPage() {
  // ===== STATE =====
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // ===== GET USER INFO =====
  const user = useSelector((state) => state.auth.user);
  const studentId = useMemo(() => {
    return user?.userId ?? user?.id ?? user?.studentId;
  }, [user]);

  // ===== LOAD PAYMENTS =====
  useEffect(() => {
    async function loadPayments() {
      // ===== KIỂM TRA STUDENT ID =====
      if (!studentId) {
        console.warn("Không tìm thấy studentId");
        message.warning("Không thể lấy thông tin sinh viên");
        return;
      }

      try {
        setLoading(true);
        const response = await getMyPaymentsAPI(studentId);
        
        console.log("===== PAYMENTS API RESPONSE ======");
        console.log("Student ID:", studentId);
        console.log("Full response:", response);
        console.log("Response data:", response?.data);
        console.log("Response data.data:", response?.data?.data);
        
        const data = toArray(response);
        console.log("===== PROCESSED PAYMENTS DATA ======");
        console.log("Processed array:", data);
        console.log("Total payments:", data.length);
        
        if (data.length > 0) {
          console.log("===== FIRST PAYMENT SAMPLE ======");
          console.log("First payment:", data[0]);
          console.log("First payment keys:", Object.keys(data[0]));
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
  }, [studentId]); // ===== THÊM studentId VÀO DEPENDENCY =====

  // ===== CALCULATE STATISTICS =====
  const statistics = useMemo(() => {
    // ===== TÍNH TỔNG TẤT CẢ PAYMENTS (KHÔNG CHỈ SUCCESS) =====
    // Hoặc nếu muốn chỉ tính SUCCESS thì giữ filter
    const allPayments = payments; // Lấy tất cả
    
    console.log("===== STATISTICS CALCULATION ======");
    console.log("Total payments:", payments.length);
    console.log("All payments data:", allPayments);
    
    // ===== TÍNH TỔNG REVENUE TỪ TẤT CẢ PAYMENTS =====
    // Reenrollments có thể dùng price, amount, hoặc total
    const totalRevenue = allPayments.reduce(
      (sum, p) => {
        const amount = p.price ?? p.amount ?? p.total ?? 0;
        console.log("Payment item:", p, "Amount:", amount);
        return sum + Number(amount);
      },
      0
    );
    
    console.log("Total Revenue calculated:", totalRevenue);
    
    return {
      totalPayments: payments.length,
      totalRevenue,
    };
  }, [payments]);

  // ===== TABLE COLUMNS =====
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
      title: "Mã thanh toán",
      dataIndex: "paymentId",
      width: 120,
      render: (id, record) => record.paymentId ?? record.id ?? record.payment_id ?? "—",
    },
    {
      title: "Tên môn học",
      dataIndex: "courseName",
      ellipsis: true,
      render: (courseName, record) =>
        courseName ??
        record.course?.title ??
        record.courseName ??
        "—",
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
      render: (date, record) => {
        const paymentDate =
          record.created_at ??
          date ??
          record.createdAt ??
          record.paymentDate ??
          record.updatedAt;
        
        if (!paymentDate) return "—";
        return dayjs(paymentDate).isValid()
          ? dayjs(paymentDate).format("DD/MM/YYYY HH:mm")
          : "—";
      },
    },
    {
      title: "Giá tiền",
      dataIndex: "amount",
      width: 150,
      align: "right",
      render: (amount, record) => {
        const total = amount ?? record.total ?? 0;
        return (
          <Text strong style={{ color: "#52c41a" }}>
            {VND(total)}
          </Text>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (status) => {
        const upper = (status || "").toString().toUpperCase();
        const colorMap = {
          SUCCESS: "green",
          PENDING: "gold",
          FAILED: "red",
          CANCELLED: "default",
        };
        return (
          <Tag color={colorMap[upper] || "default"}>
            {status || "—"}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="main-content">
      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow:
            "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
          marginBottom: 24,
        }}
      >
        <Title
          level={4}
          style={{
            margin: 0,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            fontSize: "clamp(1rem, 3vw, 1.25rem)",
          }}
        >
          <CreditCardOutlined
            style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
          />
          <span className="mobile-hide-text">Lịch Sử Thanh Toán</span>
          <span className="desktop-hide-text">Thanh toán</span>
        </Title>

        {/* ===== STATISTICS ===== */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={12}> {/* ===== ĐỔI sm={8} THÀNH sm={12} ===== */}
            <Card
              style={{
                borderRadius: 8,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>
                    Tổng số giao dịch
                  </span>
                }
                value={statistics.totalPayments}
                prefix={<CreditCardOutlined />}
                valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 700 }}
              />
            </Card>
          </Col>
          {/* ===== BỎ CARD "GIAO DỊCH THÀNH CÔNG" ===== */}
          <Col xs={24} sm={12} lg={12}> {/* ===== ĐỔI sm={8} THÀNH sm={12} ===== */}
            <Card
              style={{
                borderRadius: 8,
                background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>
                    Tổng đã thanh toán
                  </span>
                }
                value={VND(statistics.totalRevenue)}
                prefix={<WalletOutlined />}
                valueStyle={{ color: "#fff", fontSize: 20, fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>

        {/* ===== PAYMENT HISTORY TABLE ===== */}
        <Card
          bordered={false}
          style={{
            borderRadius: 8,
            boxShadow:
              "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={payments}
              rowKey={(record) =>
                record.paymentId ?? record.id ?? record.payment_id ?? Math.random()
              }
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} giao dịch`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
              }}
              scroll={{ x: "max-content" }}
              locale={{
                emptyText: "Chưa có lịch sử thanh toán nào",
              }}
            />
          </Spin>
        </Card>
      </Card>
    </div>
  );
}
