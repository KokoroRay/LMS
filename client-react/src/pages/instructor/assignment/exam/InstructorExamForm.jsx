import React, { useState, useEffect } from "react";
import {
  Typography,
  Form,
  Input,
  message,
  Select,
  Button,
  Spin,
  Steps,
  Row,
  Col,
  InputNumber,
  Checkbox,
  Space,
  Card,
} from "antd";
import { FileAddOutlined, EditOutlined } from "@ant-design/icons";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  createExam,
  updateExam,
  getExamDetailsForInstructor,
} from "../../../../services/examService";
import {
  fetchInstructorClasses,
  getInstructorCoursesByClass,
} from "../../../../services/timetableService";
import ManageExamSlots from "../../../../components/instructor/ManageExamSlots";
import ManageExamQuestions from "../../../../components/instructor/ManageExamQuestions";

const { Title } = Typography;
const { Option } = Select;

export default function InstructorExamForm() {
  const [form] = Form.useForm();
  const { examId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = !!examId;

  const [loading, setLoading] = useState(false);
  const [initialDataLoading, setInitialDataLoading] = useState(isEditing);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [initialQuestions, setInitialQuestions] = useState([]);
  const [initialSlots, setInitialSlots] = useState([]);

  const currentExamType = Form.useWatch("examType", form);
  const selectedClassId = Form.useWatch("classId", form);
  const examSlots = Form.useWatch("examSlots", form) || [];

  // LOAD CLASS LIST
  useEffect(() => {
    fetchInstructorClasses()
      .then((classList) => {
        setClasses(classList);
        if (classList.length > 0 && !isEditing) {
          const urlClassId = searchParams.get("classId");
          const selected =
            urlClassId && classList.some((c) => c.classId == urlClassId)
              ? Number(urlClassId)
              : classList[0].classId;
          form.setFieldsValue({ classId: selected });
        }
      })
      .catch(() => message.error("Không thể tải danh sách lớp."))
      .finally(() => setLoadingClasses(false));
  }, [form, isEditing, searchParams]);

  // LOAD COURSE LIST
  useEffect(() => {
    if (!selectedClassId) return;
    const classIdNum = Number(selectedClassId);
    if (!classIdNum) return;
    if (isEditing) return;

    setLoadingCourses(true);
    getInstructorCoursesByClass(classIdNum)
      .then((courseList) => {
        setCourses(courseList);
        if (courseList.length === 1) {
          form.setFieldsValue({ courseId: courseList[0].courseId });
        } else {
          form.setFieldsValue({ courseId: undefined });
        }
      })
      .catch(() => message.error("Không thể tải danh sách môn học."))
      .finally(() => setLoadingCourses(false));
  }, [selectedClassId, isEditing, form]);

  // EDIT MODE: LOAD DATA
  useEffect(() => {
    if (!isEditing) return;
    setInitialDataLoading(true);
    getExamDetailsForInstructor(examId)
      .then((data) => {
        if (!data) {
          message.error("Không tìm thấy đề thi.");
          navigate("/instructor/exams");
          return;
        }
        setInitialQuestions(data.examQuestions || []);
        const classIdNum = Number(data.classId);
        getInstructorCoursesByClass(classIdNum).then((list) => {
          setCourses(list);
        });

        const loadedSlots = (data.examSlots || []).map((slot) => ({
          ...slot,
          slotTime: slot.slotTime ? dayjs(slot.slotTime) : null,
        }));
        setInitialSlots(loadedSlots);

        const formData = {
          ...data,
          classId: classIdNum,
          courseId: Number(data.courseId),
          examSlots: loadedSlots,
          customQuestionsToAdd: [],
        };
        formData.showResultImmediately = !!formData.showResultImmediately;
        formData.isPublished = !!formData.isPublished;
        form.setFieldsValue(formData);
      })
      .catch((err) => {
        console.error("Lỗi tải chi tiết bài thi:", err);
        message.error(
          err.response?.data?.message || "Lỗi tải chi tiết bài thi."
        );
      })
      .finally(() => setInitialDataLoading(false));
  }, [examId, isEditing, navigate, form]);

  const step1Fields = [
    "title",
    "classId",
    "courseId",
    "examType",
    "durationMinutes",
    "totalMarks",
    "maxAttempts",
  ];

  const next = () => {
    form
      .validateFields(step1Fields)
      .then(() => {
        if (currentStep === 1 && examSlots.length === 0) {
          message.warning("Vui lòng thêm ít nhất một ca thi.");
          return;
        }
        setCurrentStep((p) => p + 1);
      })
      .catch(() => message.warning("Vui lòng hoàn thành các trường bắt buộc."));
  };

  const prev = () => setCurrentStep((p) => p - 1);

  const steps = [
    { title: "1. Thông tin chung", key: "info" },
    { title: "2. Ca thi", key: "slots" },
    { title: "3. Câu hỏi", key: "questions" },
  ];

  const stepContent = {
    info: (
      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input placeholder="Nhập tiêu đề" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="classId"
            label="Lớp"
            rules={[{ required: true, message: "Vui lòng chọn lớp!" }]}
          >
            <Select loading={loadingClasses} disabled={isEditing}>
              {classes.map((cls) => (
                <Option key={cls.classId} value={cls.classId}>
                  {cls.className}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="courseId"
            label="Môn học"
            rules={[{ required: true, message: "Vui lòng chọn môn học!" }]}
          >
            <Select
              placeholder="Chọn môn học"
              loading={loadingCourses}
              disabled={!selectedClassId || isEditing}
            >
              {courses.map((c) => (
                <Option key={c.courseId} value={c.courseId}>
                  {c.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="examType"
            label="Loại bài thi"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="MULTIPLE_CHOICE">Trắc nghiệm</Option>
              <Option value="PROGRAMMING">Lập trình</Option>
              <Option value="MIXED">Hỗn hợp</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="durationMinutes"
            label="Thời lượng (phút)"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="totalMarks"
            label="Tổng điểm"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="maxAttempts"
            label="Số lần thử tối đa"
            rules={[{ required: true, message: "Bắt buộc" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="showResultImmediately"
            label="Hiển thị kết quả"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="isPublished" valuePropName="checked" hidden>
            <Checkbox disabled />
          </Form.Item>
        </Col>
      </Row>
    ),
    slots: (
      <>
        <Title level={5}>Quản lý các ca thi</Title>
        <ManageExamSlots form={form} isEditing={isEditing} />
      </>
    ),
    questions: (
      <ManageExamQuestions
        form={form}
        initialQuestions={initialQuestions}
        examId={examId}
        examType={currentExamType}
      />
    ),
  };

  const onFinish = async (values) => {
    if (!values.examSlots || values.examSlots.length === 0) {
      message.error("Vui lòng thêm ít nhất một ca thi.");
      setCurrentStep(1);
      return;
    }

    const now = dayjs(); // Lấy thời gian hiện tại để so sánh

    for (const slot of values.examSlots) {
      if (!slot || !slot.slotTime) {
        message.error("Bạn còn ca thi chưa chọn thời gian!");
        setCurrentStep(1);
        return;
      }
      if (!dayjs.isDayjs(slot.slotTime)) {
        message.error("Thời gian ca thi không hợp lệ!");
        setCurrentStep(1);
        return;
      }

      // --- VALIDATION MỚI: CHECK SLOT QUÁ KHỨ ---
      if (isEditing) {
        const isNewSlot = !slot.slotId;
        const originalSlot = initialSlots.find((s) => s.slotId === slot.slotId);

        let isModified = false;
        if (isNewSlot) {
          isModified = true;
        } else if (originalSlot) {
          if (!slot.slotTime.isSame(originalSlot.slotTime)) {
            isModified = true;
          }
        } else {
          isModified = true;
        }

        if (isModified && slot.slotTime.isBefore(now)) {
          message.error(
            `Ca thi lúc ${slot.slotTime.format(
              "HH:mm DD/MM/YYYY"
            )} đang ở quá khứ! Vui lòng chọn thời gian trong tương lai cho các ca thi mới hoặc đã được chỉnh sửa.`
          );
          setCurrentStep(1);
          return;
        }
      } else {
        if (slot.slotTime.isBefore(now)) {
          message.error(
            `Ca thi lúc ${slot.slotTime.format(
              "HH:mm DD/MM/YYYY"
            )} đang ở quá khứ! Vui lòng chọn thời gian trong tương lai.`
          );
          setCurrentStep(1); // Quay lại tab Ca thi
          return;
        }
      }
    }

    const payload = {
      title: values.title,
      description: values.description,
      classId: values.classId,
      courseId: values.courseId,
      examType: values.examType,
      durationMinutes: values.durationMinutes,
      totalMarks: values.totalMarks,
      maxAttempts: values.maxAttempts,
      showResultImmediately: values.showResultImmediately || false,
      isPublished: values.isPublished || false,
      examSlots: (values.examSlots || []).map((slot) => ({
        slotId: slot?.slotId || null,
        slotTime:
          slot?.slotTime && dayjs.isDayjs(slot.slotTime)
            ? slot.slotTime.format("YYYY-MM-DDTHH:mm:ss")
            : null,
        maxParticipants: slot?.maxParticipants ?? 0,
      })),
      questionsFromBank: [],
      customQuestions: (values.customQuestionsToAdd || []).map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        points: q.points,
        choices: q.options || [],
        correctAnswers: Array.isArray(q.correctAnswer)
          ? q.correctAnswer
          : [q.correctAnswer].filter(Boolean),
        language: q.language,
        starterCode: q.starterCode,
        testCases: q.testCases || [],
      })),
    };

    try {
      setLoading(true);
      if (isEditing) await updateExam(examId, payload);
      else await createExam(payload);
      message.success(
        isEditing ? "Cập nhật thành công!" : "Tạo bài thi thành công!"
      );
      navigate(`/instructor/exams?refresh=${Date.now()}`);
    } catch (err) {
      console.error("Lỗi API:", err);
      message.error(err.response?.data?.message || "Lỗi tạo bài thi.");
    } finally {
      setLoading(false);
    }
  };

  if (initialDataLoading && isEditing)
    return <Spin spinning fullscreen tip="Đang tải dữ liệu..." />;

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        {isEditing ? (
          <>
            <EditOutlined style={{ marginRight: 10 }} /> Chỉnh sửa bài thi
          </>
        ) : (
          <>
            <FileAddOutlined style={{ marginRight: 10 }} /> Tạo bài thi mới
          </>
        )}
      </Title>
      <Card
        style={{ marginBottom: 24 }}
        styles={{ body: { padding: "16px 24px" } }}
      >
        <Steps current={currentStep} items={steps} />
      </Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          examType: "MULTIPLE_CHOICE",
          durationMinutes: 60,
          totalMarks: 100,
          maxAttempts: 1,
          showResultImmediately: false,
        }}
      >
        <Card>
          <div style={{ display: currentStep === 0 ? "block" : "none" }}>
            {stepContent.info}
          </div>
          <div style={{ display: currentStep === 1 ? "block" : "none" }}>
            {stepContent.slots}
          </div>
          <div style={{ display: currentStep === 2 ? "block" : "none" }}>
            {stepContent.questions}
          </div>
        </Card>
        <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
          <Space>
            <Button onClick={() => navigate("/instructor/exams")}>Hủy</Button>
            {currentStep > 0 && <Button onClick={prev}>Quay lại</Button>}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Tiếp tục
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEditing ? "Lưu thay đổi" : "Tạo bài thi"}
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
