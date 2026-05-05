import { useState, useEffect, useMemo } from "react";
import { Typography, Table, Tag, message, Spin, Card, Button } from "antd";
import { BarChartOutlined, ReloadOutlined } from "@ant-design/icons";
import { fetchAllPointAPI } from "../../services/pointService";
import { useSelector } from "react-redux";

const { Text, Title } = Typography;

export default function CheckPointPage() {
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const user = useSelector((state) => state.auth.user);

  const studentId = useMemo(() => {
    return user?.userId || user?.id;
  }, [user]);

  const loadGrades = async () => {
    if (!studentId) {
      return;
    }
    try {
      setLoadingGrades(true);
      const res = await fetchAllPointAPI(studentId);
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setGrades(data);
      } else {
        setGrades([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy điểm:", error);
      message.error("Lỗi khi tải điểm số. Vui lòng kiểm tra API.");
      setGrades([]);
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadGrades();
    }
  }, [studentId]);

  const columns = useMemo(
    () => [
      {
        title: "STT",
        key: "stt",
        width: 60,
        align: "center",
        render: (text, record, index) =>
          (currentPage - 1) * pageSize + index + 1,
      },
      {
        title: "Môn học",
        dataIndex: "courseName",
        key: "courseName",
        sorter: (a, b) => a.courseName.localeCompare(b.courseName),
        width: 250,
      },
      {
        title: "Điểm Assignment",
        dataIndex: "assignmentScore",
        key: "assignmentScore",
        align: "center",
        sorter: (a, b) => (a.assignmentScore || 0) - (b.assignmentScore || 0),
        render: (score) =>
          score !== null ? parseFloat(score).toFixed(2) : "N/A",
      },
      {
        title: "Điểm Quiz",
        dataIndex: "quizScore",
        key: "quizScore",
        align: "center",
        sorter: (a, b) => (a.quizScore || 0) - (b.quizScore || 0),
        render: (score) =>
          score !== null ? parseFloat(score).toFixed(2) : "N/A",
      },
      {
        title: "Điểm Exam",
        dataIndex: "examScore",
        key: "examScore",
        align: "center",
        sorter: (a, b) => (a.examScore || 0) - (b.examScore || 0),
        render: (score) =>
          score !== null ? parseFloat(score).toFixed(2) : "N/A",
      },
      {
        title: "Điểm trung bình",
        dataIndex: "finalScore",
        key: "finalScore",
        align: "center",
        sorter: (a, b) => (a.finalScore || 0) - (b.finalScore || 0),
        render: (score) =>
          score !== null ? (
            <Text strong>{parseFloat(score).toFixed(2)}</Text>
          ) : (
            "N/A"
          ),
      },
      {
        title: "Trạng thái",
        key: "status",
        dataIndex: "status", // Dùng thẳng status từ backend
        align: "center",
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
    ],
    [currentPage, pageSize]
  );

  const customPagination = {
    current: currentPage,
    pageSize: pageSize,
    position: ["bottomRight"],
    total: grades.length,
    showSizeChanger: false,
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
        <BarChartOutlined
          style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
        />
        <span className="mobile-hide-text">Xem Điểm Tổng Kết Khóa Học</span>
        <span className="desktop-hide-text">Xem Điểm</span>
      </Title>

      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={loadGrades}
        loading={loadingGrades}
        size="small"
        className="mobile-button"
      >
        <span className="mobile-hide-text">Tải lại danh sách</span>
        <span className="desktop-hide-text">Tải lại</span>
      </Button>
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
        <Spin spinning={loadingGrades}>
          <Table
            dataSource={grades}
            columns={columns}
            rowKey={(record, index) => record.id || record.courseId || index}
            pagination={customPagination}
            onChange={(pagination) => {
              setCurrentPage(pagination.current);
              setPageSize(pagination.pageSize);
            }}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "Chưa có điểm số nào." }}
          />
        </Spin>
      </Card>
    </div>
  );
}
