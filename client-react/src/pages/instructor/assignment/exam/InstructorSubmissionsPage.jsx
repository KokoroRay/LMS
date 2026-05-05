import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  Table,
  message,
  Tag,
  Space,
  Select,
  Spin,
  Card,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
} from "antd";
import {
  SolutionOutlined,
  EditOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getExamsByClass,
  getExamSubmissionsForInstructor,
  getStudentAttemptOverrides,
  grantExtraExamAttempt,
  revokeExtraExamAttempt,
  getStudentsInExamClass,
} from "../../../../services/examService";
import { fetchInstructorClasses } from "../../../../services/timetableService";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export default function InstructorSubmissionsPage() {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);

  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingOverrides, setLoadingOverrides] = useState(false);

  // --- SỬA LỖI 1: Thêm khai báo state này ---
  const [studentAttemptOverrides, setStudentAttemptOverrides] = useState([]);

  const [showGrantModal, setShowGrantModal] = useState(false);
  const [studentToOverride, setStudentToOverride] = useState(null);
  const [grantForm] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setLoadingClasses(true);
    fetchInstructorClasses()
      .then((fetchedClasses) => {
        setClasses(fetchedClasses);
      })
      .catch((err) => {
        message.error(
          err.response?.data?.message || "Failed to fetch classes."
        );
      })
      .finally(() => {
        setLoadingClasses(false);
      });
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      setLoadingExams(true);
      setExams([]);
      setSelectedExamId(null);
      setTableData([]);
      getExamsByClass(selectedClassId, 0, 1000)
        .then((resp) => {
          const fetchedExams = resp.data?.data?.content || [];
          setExams(fetchedExams);
          const examIdFromUrl = searchParams.get("examId");
          if (examIdFromUrl) {
            const examIdNum = parseInt(examIdFromUrl, 10);
            if (fetchedExams.some((ex) => ex.examId === examIdNum)) {
              setSelectedExamId(examIdNum);
            } else {
              setSearchParams({});
            }
          }
        })
        .catch((err) => {
          message.error(
            err.response?.data?.message ||
              "Failed to fetch exams for the selected class."
          );
        })
        .finally(() => {
          setLoadingExams(false);
        });
    } else {
      setExams([]);
      setSelectedExamId(null);
      setTableData([]);
    }
  }, [selectedClassId, searchParams, setSearchParams]);

  const fetchSubmissionsAndOverrides = useCallback(async (examId) => {
    if (!examId) {
      setTableData([]);
      setStudentAttemptOverrides([]);
      return;
    }
    setLoadingStudents(true);
    setLoadingOverrides(true);
    try {
      const [studentsResp, submissionsResp, overridesResp] = await Promise.all([
        getStudentsInExamClass(examId),
        getExamSubmissionsForInstructor(examId),
        getStudentAttemptOverrides(examId),
      ]);

      const allStudents = studentsResp.data?.data || [];
      const submissions = submissionsResp.data?.data || [];
      const overrides = overridesResp.data?.data || [];

      const submissionsMap = new Map(
        submissions.map((sub) => [sub.studentId, sub])
      );
      const overridesMap = new Map(overrides.map((ov) => [ov.studentId, ov]));

      const consolidatedData = allStudents.map((student) => {
        const submission = submissionsMap.get(student.studentId);
        const override = overridesMap.get(student.studentId);

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          studentEmail: student.studentEmail,
          studentCode: student.studentCode,
          hasSubmitted: !!submission,
          submissionStatus: submission ? "Đã nộp" : "Chưa nộp",
          submittedAt: submission?.submittedAt || null,
          score: submission?.score ?? null,
          resultId: submission?.resultId || null,
          override: override || null,
        };
      });

      setTableData(consolidatedData);
      setStudentAttemptOverrides(overrides);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to fetch data.");
      setTableData([]);
      setStudentAttemptOverrides([]);
    } finally {
      setLoadingStudents(false);
      setLoadingOverrides(false);
      // --- SỬA LỖI 2: Đã xóa dòng setLoadingSubmissions(false) vì biến này không tồn tại ---
    }
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchSubmissionsAndOverrides(selectedExamId);
    } else {
      setTableData([]);
      setStudentAttemptOverrides([]);
    }
  }, [selectedExamId, fetchSubmissionsAndOverrides]);

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    setSearchParams({});
  };

  const handleExamChange = (examId) => {
    setSelectedExamId(examId);
    setSearchParams({ examId: examId });
  };

  const handleGrantRetake = (studentId) => {
    setStudentToOverride(studentId);
    grantForm.setFieldsValue({ extraAttempts: 1 });
    setShowGrantModal(true);
  };

  const onGrantModalFinish = async (values) => {
    try {
      await grantExtraExamAttempt(
        selectedExamId,
        studentToOverride,
        values.extraAttempts
      );
      message.success("Quyền thi lại đã được cấp!");
      setShowGrantModal(false);
      fetchSubmissionsAndOverrides(selectedExamId);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể cấp quyền thi lại."
      );
    }
  };

  const handleRevokeRetake = async (studentId) => {
    try {
      await revokeExtraExamAttempt(selectedExamId, studentId);
      message.success("Quyền thi lại đã được thu hồi!");
      fetchSubmissionsAndOverrides(selectedExamId);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể thu hồi quyền thi lại."
      );
    }
  };

  const columns = [
    {
      title: "Mã SV",
      dataIndex: "studentCode",
      key: "studentCode",
      width: 100,
    },
    {
      title: "Tên",
      dataIndex: "studentName",
      key: "studentName",
      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "studentEmail",
      key: "studentEmail",
      ellipsis: true,
    },
    {
      title: "Trạng thái nộp",
      dataIndex: "submissionStatus",
      key: "submissionStatus",
      width: 140,
      render: (status) => (
        <Tag color={status === "Đã nộp" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Thời gian nộp",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (text) => (text ? dayjs(text).format("YYYY-MM-DD HH:mm") : "N/A"),
    },
    {
      title: "Điểm",
      dataIndex: "score",
      key: "score",
      render: (score) => (score !== null ? score : "N/A"),
      sorter: (a, b) => (a.score || -1) - (b.score || -1),
    },
    {
      title: "Trạng thái thi lại",
      key: "retakeStatus",
      render: (_, record) => {
        if (record.override) {
          return (
            <Tag color="green">
              Được phép thi lại ({record.override.extraAttempts} lần)
            </Tag>
          );
        }
        return <Tag color="default">Không có</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => {
        const hasOverride = !!record.override;
        return (
          <Space size="small">
            {record.hasSubmitted && (
              <Tooltip
                title={record.gradedAt ? "View/Edit Grade" : "Grade Submission"}
              >
                <Button
                  type={record.gradedAt ? "default" : "primary"}
                  ghost={!record.gradedAt}
                  icon={<EditOutlined />}
                  size="small"
                  style={
                    record.gradedAt
                      ? { color: "#52c41a", borderColor: "#b7eb8f" }
                      : null
                  }
                  onClick={() =>
                    navigate(`/instructor/submissions/${record.resultId}`)
                  }
                />
              </Tooltip>
            )}
            {hasOverride ? (
              <Popconfirm
                title="Thu hồi quyền thi lại?"
                description="Học viên sẽ không được thi lại nữa."
                onConfirm={() => handleRevokeRetake(record.studentId)}
                okText="Thu hồi"
                cancelText="Hủy"
              >
                <Tooltip title="Thu hồi quyền thi lại">
                  <Button danger icon={<MinusCircleOutlined />} size="small" />
                </Tooltip>
              </Popconfirm>
            ) : (
              <Tooltip title="Cấp quyền thi lại">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => handleGrantRetake(record.studentId)}
                  disabled={!selectedExamId}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
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
          <SolutionOutlined
            style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
          />
          Chấm bài kiểm tra
        </Title>
        <Space wrap>
          <Text>Chọn lớp:</Text>
          <Select
            style={{ width: 300 }}
            placeholder="Select a class first"
            loading={loadingClasses}
            value={selectedClassId}
            onChange={handleClassChange}
          >
            {classes.map((cls) => (
              <Option key={cls.classId} value={cls.classId}>
                {cls.className}
              </Option>
            ))}
          </Select>

          <Text style={{ marginLeft: "10px" }}>Chọn bài kiểm tra:</Text>
          <Select
            style={{ width: 300 }}
            placeholder="Chọn bài kiểm tra"
            loading={loadingExams}
            value={selectedExamId}
            onChange={handleExamChange}
            disabled={!selectedClassId || loadingExams}
          >
            {exams.map((exam) => (
              <Option key={exam.examId} value={exam.examId}>
                {exam.title}
              </Option>
            ))}
          </Select>
        </Space>
      </div>
      <Card bodyStyle={{ padding: 0 }} bordered={false}>
        {/* --- SỬA LỖI 3: Xóa loadingSubmissions khỏi điều kiện spin --- */}
        <Spin
          spinning={
            loadingClasses ||
            loadingExams ||
            loadingOverrides ||
            loadingStudents
          }
        >
          <Table
            columns={columns}
            dataSource={tableData}
            rowKey="studentId"
            pagination={{ pageSize: 10, size: "small" }}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: selectedExamId
                ? "Không tìm thấy sinh viên nào cho bài kiểm tra này."
                : "Vui lòng chọn lớp và bài kiểm tra.",
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="Cấp quyền thi lại"
        open={showGrantModal}
        onCancel={() => setShowGrantModal(false)}
        onOk={() => grantForm.submit()}
        confirmLoading={loadingOverrides}
      >
        <Form form={grantForm} onFinish={onGrantModalFinish}>
          <Form.Item
            name="extraAttempts"
            label="Số lần thi lại bổ sung"
            rules={[
              { required: true, message: "Vui lòng nhập số lần thi lại." },
            ]}
          >
            <InputNumber min={1} defaultValue={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
