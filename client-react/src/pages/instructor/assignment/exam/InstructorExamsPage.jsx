import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Button,
  Table,
  message,
  Tag,
  Space,
  Popconfirm,
  Select,
  Spin,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  SolutionOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  ScheduleOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getExamsByClass,
  deleteExam,
  publishExam,
  unpublishExam,
} from "../../../../services/examService";
import { fetchInstructorClasses } from "../../../../services/timetableService";

const { Title, Text } = Typography;
const { Option } = Select;

export default function InstructorExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ... (Giữ nguyên phần useEffect fetch classes và exams như cũ) ...
  useEffect(() => {
    setLoadingClasses(true);
    fetchInstructorClasses()
      .then((fetchedClasses) => {
        setClasses(fetchedClasses);

        if (fetchedClasses.length > 0) {
          setSelectedClassId(fetchedClasses[0].classId);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        message.error(err.response?.data?.message || "Không thể tải lớp học.");
        setLoading(false);
      })
      .finally(() => {
        setLoadingClasses(false);
      });
  }, []);

  const fetchExams = useCallback(() => {
    if (!selectedClassId) {
      setExams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getExamsByClass(
      selectedClassId,
      pagination.current - 1,
      pagination.pageSize
    )
      .then((resp) => {
        const data = resp.data?.data;
        setExams(data?.content || []);
        setPagination((prev) => ({
          ...prev,
          total: data?.totalElements || 0,
        }));
      })
      .catch((err) => {
        message.error(
          err.response?.data?.message ||
            `Không thể tìm kiếm bài kiểm tra cho ID lớp ${selectedClassId}.`
        );
        setExams([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedClassId, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    const refreshParam = searchParams.get("refresh");
    if (refreshParam && selectedClassId) {
      fetchExams();
    }
  }, [searchParams, selectedClassId, fetchExams]);
  // ... (Kết thúc phần giữ nguyên) ...

  const handleDelete = (examId) => {
    deleteExam(examId)
      .then(() => {
        message.success("Đã xóa bài kiểm tra thành công!");
        fetchExams();
      })
      .catch((err) => {
        message.error(
          err.response?.data?.message || "Không xóa được bài kiểm tra."
        );
      });
  };

  const handlePublish = (examId, isPublished) => {
    const apiCall = isPublished ? unpublishExam(examId) : publishExam(examId);
    apiCall
      .then(() => {
        message.success(
          `Bài kiểm tra ${isPublished ? "khóa" : "mở khóa"} thành công.`
        );
        fetchExams();
      })
      .catch((err) => {
        message.error(err.response?.data?.message || "Thao tác thất bại.");
      });
  };

  const handleClassChange = (value) => {
    setSelectedClassId(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (page) => {
    setPagination((prev) => ({
      ...prev,
      current: page.current,
      pageSize: page.pageSize,
    }));
  };

  // --- CẬP NHẬT CỘT TABLE ĐỂ TÍNH TOÁN THỜI GIAN ---
  const columns = [
    { title: "Tiêu đề", dataIndex: "title", key: "title", ellipsis: true },
    {
      title: "Loại",
      dataIndex: "examType",
      key: "examType",
      width: 120,
      render: (type) => {
        let color = "blue";
        if (type === "PROGRAMMING") color = "purple";
        if (type === "MIXED") color = "orange";
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: "Thời lượng",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
      width: 100,
      align: "center",
      render: (mins) =>
        mins ? <Tag icon={<FieldTimeOutlined />}>{mins}p</Tag> : "N/A",
    },
    // CỘT BẮT ĐẦU: Lấy slot sớm nhất
    {
      title: "Bắt đầu)",
      key: "startTime",
      width: 180,
      render: (_, record) => {
        const slots = record.examSlots || [];
        if (slots.length === 0)
          return (
            <Text type="secondary" italic>
              Chưa xếp lịch
            </Text>
          );

        // Tìm thời gian nhỏ nhất
        const minTime = slots.reduce((min, p) => {
          const current = dayjs(p.slotTime);
          return current.isBefore(min) ? current : min;
        }, dayjs(slots[0].slotTime));

        return (
          <Tooltip title="Thời gian bắt đầu của ca thi đầu tiên">
            {minTime.format("YYYY-MM-DD HH:mm")}
          </Tooltip>
        );
      },
    },
    // CỘT KẾT THÚC: Lấy slot muộn nhất + duration
    {
      title: "Kết thúc",
      key: "endTime",
      width: 180,
      render: (_, record) => {
        const slots = record.examSlots || [];
        if (slots.length === 0) return <Text type="secondary">-</Text>;

        // Tìm thời gian ca thi muộn nhất
        const maxTime = slots.reduce((max, p) => {
          const current = dayjs(p.slotTime);
          return current.isAfter(max) ? current : max;
        }, dayjs(slots[0].slotTime));

        // Thời gian kết thúc = Ca muộn nhất + Duration
        const endTime = maxTime.add(record.durationMinutes || 0, "minute");

        return (
          <Tooltip
            title={`Kết thúc ca cuối (${maxTime.format("HH:mm")} + ${
              record.durationMinutes
            }p)`}
          >
            {endTime.format("YYYY-MM-DD HH:mm")}
          </Tooltip>
        );
      },
    },
    {
      title: "Ca thi",
      key: "slotsCount",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Tag color="cyan">
          {record.examSlots ? record.examSlots.length : 0} ca
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isPublished",
      key: "isPublished",
      width: 100,
      align: "center",
      render: (isPublished) => (
        <Tag color={isPublished ? "green" : "volcano"}>
          {isPublished ? "Published" : "Draft"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() =>
                navigate(`/instructor/exams/edit/${record.examId}`)
              }
            />
          </Tooltip>
          <Tooltip title="Submissions">
            <Button
              ghost
              style={{ color: "#52c41a", borderColor: "#b7eb8f" }}
              icon={<SolutionOutlined />}
              onClick={() =>
                navigate(`/instructor/submissions?examId=${record.examId}`)
              }
            />
          </Tooltip>
          <Tooltip title={record.isPublished ? "Unpublish" : "Publish"}>
            <Button
              ghost
              style={{ color: "#fa8c16", borderColor: "#ffd591" }}
              icon={
                record.isPublished ? (
                  <CloudDownloadOutlined />
                ) : (
                  <CloudUploadOutlined />
                )
              }
              onClick={() => handlePublish(record.examId, record.isPublished)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa bài kiểm tra này?"
              onConfirm={() => handleDelete(record.examId)}
              okText="Yes"
              cancelText="No"
              placement="left"
            >
              <Button danger ghost icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          padding: "16px 24px",
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow:
            "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
        }}
      >
        <Title
          level={4}
          style={{ margin: 0, display: "flex", alignItems: "center" }}
        >
          <ScheduleOutlined
            style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
          />
          Quản lý bài kiểm tra
        </Title>

        <Space wrap>
          <Text>Chọn lớp</Text>
          <Select
            style={{ width: 300 }}
            placeholder="Select a class"
            loading={loadingClasses}
            value={selectedClassId}
            onChange={handleClassChange}
            disabled={loadingClasses}
          >
            {classes.map((cls) => (
              <Option key={cls.classId} value={cls.classId}>
                {cls.className}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              if (selectedClassId) {
                navigate(`/instructor/exams/new?classId=${selectedClassId}`);
              } else {
                message.warning("Please select a class first.");
              }
            }}
            disabled={classes.length === 0 || loadingClasses}
          >
            Tạo bài kiểm tra mới
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={exams}
          rowKey="examId"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: selectedClassId
              ? "Chưa tạo bài kiểm tra."
              : "Vui lòng chọn lớp để xem bài kiểm tra.",
          }}
        />
      </Spin>
    </div>
  );
}
