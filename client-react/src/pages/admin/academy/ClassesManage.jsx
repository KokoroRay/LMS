import { useEffect, useState, useCallback, useMemo } from "react";
import debounce from "lodash.debounce";
import {
  deleteClassAPI,
  fetchAllClassAPI,
  createClassAPI,
  updateClassAPI,
  bulkAddStudentsToClassAPI,
} from "../../../services/classService";

import { fetchAllSubjectAPI } from "../../../services/subjectService";
import { getAllInstructors } from "../../../services/instructorService";
import { fetchFailedStudentsForCourseAPI } from "../../../services/subjectService";
import { fetchAllCategoriesAPI } from "../../../services/authService";
import notificationService from '../../../services/notificationService';

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Space,
  Table,
  message,
  Popconfirm,
  Tag,
  Typography,
  Select,
  DatePicker,
  InputNumber,
  Spin,
  Tooltip,
  Divider,
  Modal,
  Checkbox,
  Avatar,
  Radio,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  SaveOutlined,
  UserOutlined,
  FolderOpenOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "../../../styles/admin/class-manager.css";
import eventBus from "../../../utils/eventBus";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const CLASS_STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "LÊN LỊCH" },
  { value: "ONGOING", label: "ĐANG DIỄN RA" },
  { value: "COMPLETED", label: "HOÀN THÀNH" },
  { value: "CANCELLED", label: "ĐÃ HỦY" },
];

// --- Sub-components for Modals ---

const CategorySelectionModal = ({
  open,
  onCancel,
  onSelect,
  selectedCategory,
  allCategories,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelected, setTempSelected] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  useEffect(() => {
    if (open) {
      if (selectedCategory?.id) {
        setTempSelected({
          id: selectedCategory.id,
          name: selectedCategory.name,
        });
      } else {
        setTempSelected(null);
      }
    }
  }, [open, selectedCategory]);

  const filteredData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return (Array.isArray(allCategories) ? allCategories : []).filter(
      (c) =>
        (c.name || "").toLowerCase().includes(lowerCaseSearch) ||
        (c.description || "").toLowerCase().includes(lowerCaseSearch) ||
        (c.categoryId || "").toString().includes(lowerCaseSearch)
    );
  }, [allCategories, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, pagination]);

  const columns = [
    {
      title: "Chọn",
      width: 60,
      align: "center",
      render: (_, record) => (
        <Radio
          checked={tempSelected?.id === record.categoryId}
          onChange={() => {
            setTempSelected({
              id: record.categoryId,
              name: record.name,
            });
          }}
        />
      ),
    },
    {
      title: "Tên Khóa học",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
  ];

  const handleOk = () => {
    if (tempSelected) {
      onSelect(tempSelected.id, tempSelected.name);
    }
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={
        <Space>
          <FolderOpenOutlined style={{ color: "#1890ff" }} />
          <Title level={5} style={{ margin: 0 }}>
            Chọn Khóa học
          </Title>
        </Space>
      }
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="select"
          type="primary"
          onClick={handleOk}
          disabled={!tempSelected}
        >
          Chọn ({tempSelected ? tempSelected.name : "0"})
        </Button>,
      ]}
    >
      <Input.Search
        placeholder="Tìm kiếm khóa học..."
        allowClear
        onSearch={setSearchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table
        rowKey="categoryId"
        columns={columns}
        dataSource={paginatedData}
        loading={false}
        size="small"
        pagination={{
          ...pagination,
          total: filteredData.length,
          showTotal: (total) => `Tổng ${total} khóa`,
          onChange: (page, pageSize) =>
            setPagination({ current: page, pageSize }),
        }}
        locale={{ emptyText: <Empty description="Không tìm thấy khóa học" /> }}
      />
    </Modal>
  );
};

const SubjectSelectionModal = ({
  open,
  onCancel,
  onSelect,
  selectedSubjects,
  allSubjects,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelectedSubjects, setTempSelectedSubjects] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  useEffect(() => {
    if (open) {
      setTempSelectedSubjects(selectedSubjects.map((s) => ({ ...s })));
    }
  }, [open, selectedSubjects]);

  const filteredData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allSubjects.filter(
      (s) =>
        (s.title || "").toLowerCase().includes(lowerCaseSearch) ||
        (s.courseId || "").toString().includes(lowerCaseSearch)
    );
  }, [allSubjects, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, pagination]);

  const handleCheckboxChange = (record) => {
    const isSelected = tempSelectedSubjects.some(
      (s) => s.id === record.courseId
    );

    if (isSelected) {
      setTempSelectedSubjects(
        tempSelectedSubjects.filter((s) => s.id !== record.courseId)
      );
    } else {
      setTempSelectedSubjects([
        ...tempSelectedSubjects,
        {
          id: record.courseId,
          name: record.title,
          teacherIds: record.teacherIds || [],
        },
      ]);
    }
  };

  const columns = [
    {
      title: "Chọn",
      width: 60,
      align: "center",
      render: (_, record) => (
        <Checkbox
          checked={tempSelectedSubjects.some((s) => s.id === record.courseId)}
          onChange={() => handleCheckboxChange(record)}
        />
      ),
    },
    {
      title: "Tên Môn học",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Giáo viên (Số lượng)",
      dataIndex: "teacherIds",
      key: "teacherIds",
      render: (teacherIds) => (
        <Tag color="cyan">{(teacherIds || []).length} GV</Tag>
      ),
    },
  ];

  const handleOk = () => {
    onSelect(tempSelectedSubjects);
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={
        <Space>
          <BookOutlined style={{ color: "#1890ff" }} />
          <Title level={5} style={{ margin: 0 }}>
            Chọn Môn học
          </Title>
        </Space>
      }
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="select"
          type="primary"
          onClick={handleOk}
          disabled={tempSelectedSubjects.length === 0}
        >
          Chọn ({tempSelectedSubjects.length} môn)
        </Button>,
      ]}
    >
      <Input.Search
        placeholder="Tìm kiếm môn học..."
        allowClear
        onSearch={setSearchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table
        rowKey="courseId"
        columns={columns}
        dataSource={paginatedData}
        loading={false}
        size="small"
        pagination={{
          ...pagination,
          total: filteredData.length,
          showTotal: (total) => `Tổng ${total} môn`,
          onChange: (page, pageSize) =>
            setPagination({ current: page, pageSize }),
        }}
        locale={{ emptyText: <Empty description="Không tìm thấy môn học" /> }}
      />
    </Modal>
  );
};

const SubjectTeacherSelectionModal = ({
  open,
  onCancel,
  onSelect,
  subjectName,
  availableTeacherIds,
  selectedTeacherId,
  allTeachers,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelected, setTempSelected] = useState(null);

  useEffect(() => {
    if (open) {
      if (selectedTeacherId) {
        setTempSelected({ id: selectedTeacherId });
      } else {
        setTempSelected(null);
      }
    }
  }, [open, selectedTeacherId]);

  const filteredData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allTeachers
      .filter((t) => availableTeacherIds.includes(Number(t.userId)))
      .filter((t) => {
        const fullName = `${t.firstName || ""} ${
          t.lastName || ""
        }`.toLowerCase();
        return (
          fullName.includes(lowerCaseSearch) ||
          (t.email || "").toLowerCase().includes(lowerCaseSearch) ||
          (t.teacherCode || "").toLowerCase().includes(lowerCaseSearch)
        );
      });
  }, [allTeachers, availableTeacherIds, searchTerm]);

  const columns = [
    {
      title: "Chọn",
      width: 60,
      align: "center",
      render: (_, record) => (
        <Radio
          checked={tempSelected?.id === Number(record.userId)}
          onChange={() => setTempSelected({ id: Number(record.userId) })}
        />
      ),
    },
    {
      title: "Avatar",
      dataIndex: "avatarUrl",
      key: "avatarUrl",
      width: 60,
      render: (url) => (
        <Avatar src={url || undefined} icon={<UserOutlined />} size="small" />
      ),
    },
    {
      title: "Họ tên",
      render: (_, record) =>
        `${record.firstName || ""} ${record.lastName || ""}`.trim(),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
    },
  ];

  return (
    <Modal
      open={open}
      title={
        <Space>
          <UserOutlined style={{ color: "#1890ff" }} />
          <Title level={5} style={{ margin: 0 }}>
            {`Chọn Giáo viên cho "${subjectName}"`}
          </Title>
        </Space>
      }
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="select"
          type="primary"
          onClick={() => {
            if (tempSelected) {
              onSelect(tempSelected.id);
            }
            onCancel();
          }}
          disabled={!tempSelected}
        >
          Chọn
        </Button>,
      ]}
    >
      <Input.Search
        placeholder="Tìm kiếm tên, email..."
        allowClear
        onSearch={setSearchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table
        rowKey="userId"
        columns={columns}
        dataSource={filteredData}
        size="small"
        pagination={{ pageSize: 8, showTotal: (total) => `Tổng ${total} GV` }}
        locale={{
          emptyText: <Empty description="Không tìm thấy giáo viên" />,
        }}
      />
    </Modal>
  );
};

// --- Main Component: ClassForm ---

const ClassForm = ({
  initialValues,
  onFinish,
  allCourses,
  allTeachers,
  setEditingRecord,
  loadClass,
  allCategories,
}) => {
  const [form] = Form.useForm();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectTeacherModalOpen, setSubjectTeacherModalOpen] = useState(false);
  const [currentSubjectForTeacher, setCurrentSubjectForTeacher] =
    useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);

  const allSubjects = useMemo(() => {
    return Array.isArray(allCourses) ? allCourses : [];
  }, [allCourses]);

  const availableSubjects = useMemo(() => {
    if (!selectedCategory?.id) return [];
    return allCourses.filter((c) => c.categoryId === selectedCategory.id);
  }, [selectedCategory?.id, allCourses]);

  useEffect(() => {
    form.resetFields();

    if (initialValues && initialValues.classId) {
      const initialFormValues = {
        ...initialValues,
        startDate: initialValues.startDate
          ? dayjs(initialValues.startDate)
          : null,
        endDate: initialValues.endDate ? dayjs(initialValues.endDate) : null,
      };
      form.setFieldsValue(initialFormValues);

      const assignmentsData = initialValues.assignments || [];

      let subjects = [];

      // Chỉ dùng courseIds để khởi tạo nếu không có assignments chi tiết
      const courseIds =
        initialValues.courseIds && Array.isArray(initialValues.courseIds)
          ? initialValues.courseIds
          : initialValues.courseId
          ? [initialValues.courseId]
          : [];

      if (courseIds.length > 0) {
        subjects = courseIds.map((courseId) => {
          const courseDetail = allCourses.find((c) => c.courseId === courseId);

          // Tìm teacherId đã được gán từ assignments chi tiết
          const assignmentDetail = assignmentsData.find(
            (a) => a.courseId === courseId
          );

          const assignedTeacherId = assignmentDetail?.teacherId || null;

          return {
            id: courseId,
            name: courseDetail?.title || `Môn ID ${courseId}`,
            teacherIds: courseDetail?.teacherIds || [],
            selectedTeacherId: assignedTeacherId, // Gán ID GV đã được tìm thấy
          };
        });
      }

      const firstCourseDetail = allCourses.find(
        (c) => c.courseId === courseIds[0]
      );
      if (firstCourseDetail?.categoryId) {
        const category = allCategories.find(
          (cat) => cat.categoryId === firstCourseDetail.categoryId
        );
        setSelectedCategory({
          id: firstCourseDetail.categoryId,
          name: category?.name,
        });
      }

      setClassSubjects(subjects);
    } else {
      form.setFieldsValue({
        status: "SCHEDULED",
        capacity: 20,
      });
      setSelectedCategory(null);
      setClassSubjects([]);
    }
  }, [initialValues, allCourses, allCategories, form]);

  const handleCategorySelect = (id, name) => {
    setSelectedCategory({ id, name });
    setIsCategoryModalOpen(false);
    setClassSubjects([]);
  };

  const handleSubjectSelect = (subjectsArray) => {
    // Chỉ giữ lại môn học từ Category đã chọn
    const newSubjects = subjectsArray.map((s) => ({
      id: s.id,
      name: s.name,
      teacherIds: s.teacherIds || [],
      selectedTeacherId: null, // Bắt buộc chọn lại GV
    }));
    setClassSubjects(newSubjects);
    setIsSubjectModalOpen(false);
  };

  const handleOpenTeacherModal = (subject) => {
    setCurrentSubjectForTeacher(subject);
    setSubjectTeacherModalOpen(true);
  };

  const handleSelectTeacherForSubject = (teacherId) => {
    if (!currentSubjectForTeacher) return;

    setClassSubjects((prev) =>
      prev.map((s) =>
        s.id === currentSubjectForTeacher.id
          ? { ...s, selectedTeacherId: teacherId }
          : s
      )
    );
    setSubjectTeacherModalOpen(false);
  };

  // ⭐ HÀM CHÍNH - Backend tự động gửi thông báo
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedCategory?.id) {
        message.error("Vui lòng chọn Khóa học.");
        return;
      }

      if (classSubjects.length === 0) {
        message.error("Vui lòng chọn ít nhất một Môn học.");
        return;
      }

      const incompleteSubjects = classSubjects.filter(
        (s) => !s.selectedTeacherId
      );
      if (incompleteSubjects.length > 0) {
        message.error(
          `Vui lòng chọn giáo viên cho: ${incompleteSubjects
            .map((s) => s.name)
            .join(", ")}`
        );
        return;
      }

      // CHUẨN BỊ ASSIGNMENTS (Đây là Set<ClassSubjectAssignmentDTO> Backend mong đợi)
      const assignmentsPayload = classSubjects.map((subject) => ({
        courseId: subject.id,
        teacherId: subject.selectedTeacherId,
      }));

      // ⭐ PAYLOAD CUỐI CÙNG (KHÔNG chứa courseIds hay teacherId dư thừa)
      const payload = {
        className: values.className,
        capacity: values.capacity,
        status: values.status,
        // ⭐ CHỈ GỬI ASSIGNMENTS, CATEGORY ID, và THÔNG TIN LỚP
        assignments: assignmentsPayload,
        categoryId: selectedCategory.id,
        startDate: values.startDate?.format("YYYY-MM-DD") || null,
        endDate: values.endDate?.format("YYYY-MM-DD") || null,
      };

      const classId = initialValues?.classId;
      
      if (classId) {
        // Backend tự động so sánh và gửi thông báo cho teachers mới/bị xóa
        await updateClassAPI(classId, payload);
        message.success("Cập nhật lớp thành công");
      } else {
        // Backend tự động gửi thông báo cho tất cả teachers trong assignments
        await createClassAPI(payload);
        message.success("Tạo lớp thành công");
      }

      setEditingRecord({});
      loadClass();
      eventBus.dispatch("classes-updated");
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        "Lưu lớp thất bại. Vui lòng kiểm tra lại thông tin.";
      message.error(errorMsg);
    }
  };

  return (
    <>
      <Card
        title={
          <Space>
            <BookOutlined style={{ color: "#1890ff" }} />
            <Title level={5} style={{ margin: 0 }}>
              {initialValues && initialValues.classId
                ? "Chỉnh sửa Lớp học"
                : "Tạo Lớp học mới"}
            </Title>
          </Space>
        }
        extra={
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            {initialValues && initialValues.classId ? "Cập nhật" : "Tạo mới"}
          </Button>
        }
        style={{
          marginBottom: 24,
          border:
            initialValues && initialValues.classId
              ? "1px solid #faad14"
              : "1px solid #1890ff",
        }}
      >
        <Form form={form} layout="vertical">
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <Form.Item label="Khóa học" required>
              <Input
                readOnly
                placeholder="Chọn Khóa học"
                value={selectedCategory?.name || ""}
                onClick={() => setIsCategoryModalOpen(true)}
                addonAfter={
                  <Button
                    icon={<FolderOpenOutlined />}
                    onClick={() => setIsCategoryModalOpen(true)}
                    type="link"
                    style={{ padding: 0 }}
                    disabled={initialValues?.classId}
                  />
                }
                style={{ cursor: "pointer" }}
              />
            </Form.Item>

            <Form.Item
              name="className"
              label="Tên Lớp"
              rules={[
                { required: true, message: "Vui lòng nhập tên lớp" },
                { min: 2, message: "Tên lớp phải có ít nhất 2 ký tự" },
              ]}
            >
              <Input placeholder="Ví dụ: Lớp K23-Java" />
            </Form.Item>

            <Form.Item
              name="capacity"
              label="Số lượng Tối đa"
              rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="startDate"
              label="Ngày Bắt đầu"
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item
              name="endDate"
              label="Ngày Kết thúc"
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Chọn trạng thái"
                options={CLASS_STATUS_OPTIONS}
              />
            </Form.Item>
          </div>

          <Divider />

          <div>
            <Space style={{ marginBottom: 16 }}>
              <Text strong>Môn học ({classSubjects.length})</Text>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsSubjectModalOpen(true)}
                disabled={!selectedCategory?.id}
              >
                Thêm Môn học
              </Button>
            </Space>

            {classSubjects.length > 0 && (
              <Table
                rowKey="id"
                columns={[
                  {
                    title: "Tên Môn học",
                    dataIndex: "name",
                    key: "name",
                  },
                  {
                    title: "Giáo viên",
                    render: (_, record) => {
                      const teacher = allTeachers.find(
                        (t) => Number(t.userId) === record.selectedTeacherId
                      );
                      return teacher ? (
                        `${teacher.firstName} ${teacher.lastName}`
                      ) : (
                        <Button
                          size="small"
                          type="dashed"
                          onClick={() => handleOpenTeacherModal(record)}
                        >
                          Chọn GV
                        </Button>
                      );
                    },
                  },
                  {
                    title: "Hành động",
                    align: "right",
                    render: (_, record) => (
                      <Button
                        size="small"
                        onClick={() => handleOpenTeacherModal(record)}
                      >
                        {record.selectedTeacherId ? "Thay đổi" : "Chọn"}
                      </Button>
                    ),
                  },
                ]}
                dataSource={classSubjects}
                pagination={false}
                size="small"
              />
            )}
          </div>
        </Form>
      </Card>

      <CategorySelectionModal
        open={isCategoryModalOpen}
        onCancel={() => setIsCategoryModalOpen(false)}
        onSelect={handleCategorySelect}
        selectedCategory={selectedCategory}
        allCategories={allCategories}
      />

      <SubjectSelectionModal
        open={isSubjectModalOpen}
        onCancel={() => setIsSubjectModalOpen(false)}
        onSelect={handleSubjectSelect}
        selectedSubjects={classSubjects}
        allSubjects={availableSubjects}
      />

      {currentSubjectForTeacher && (
        <SubjectTeacherSelectionModal
          open={subjectTeacherModalOpen}
          onCancel={() => setSubjectTeacherModalOpen(false)}
          onSelect={handleSelectTeacherForSubject}
          subjectName={currentSubjectForTeacher.name}
          availableTeacherIds={currentSubjectForTeacher.teacherIds}
          selectedTeacherId={currentSubjectForTeacher.selectedTeacherId}
          allTeachers={allTeachers}
        />
      )}
    </>
  );
};

// --- Other Components & Exports ---

const ReEnrollmentModal = ({
  open,
  onCancel,
  onCreateClassAndEnroll,
  allCourses, // Prop should be received here
}) => {
  const [isSubjectSelectionModalOpen, setIsSubjectSelectionModalOpen] =
    useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [failedStudents, setFailedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [creatingClass, setCreatingClass] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedCourse(null);
      setFailedStudents([]);
    }
  }, [open, form]);

  const handleCourseSelect = useCallback(
    async (courseId, courseTitle) => {
      setSelectedCourse({ id: courseId, name: courseTitle });
      setIsSubjectSelectionModalOpen(false);
      // Remove courseId from form.setFieldsValue as it's not a direct field in ClassRequestDTO
      form.setFieldsValue({
        className: `Lớp học lại ${courseTitle}`,
      });

      setLoadingStudents(true);
      try {
        const studentIds = await fetchFailedStudentsForCourseAPI(courseId);
        setFailedStudents(studentIds);
      } catch (error) {
        message.error("Lỗi khi tải danh sách sinh viên trượt.");
        console.error("Error fetching failed students:", error);
        setFailedStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    },
    [form]
  );

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedCourse?.id) {
        message.error("Vui lòng chọn khóa học.");
        return;
      }
      if (failedStudents.length === 0) {
        message.warning("Không có sinh viên trượt nào để tạo lớp học lại.");
        return;
      }

      setCreatingClass(true);

      // --- NEW LOGIC FOR PAYLOAD CONSTRUCTION ---
      const selectedCourseDetail = allCourses.find(c => c.courseId === selectedCourse.id);
      if (!selectedCourseDetail) {
        message.error("Không tìm thấy thông tin khóa học để tạo lớp.");
        setCreatingClass(false);
        return;
      }

      const assignmentsPayload = [{
        courseId: selectedCourse.id,
        // For retake classes, the teacher might be assigned later or
        // default to the course's default teacher. Set to null for now,
        // as the BE might handle defaults or allow later assignment.
        teacherId: selectedCourseDetail.teacherIds && selectedCourseDetail.teacherIds.length > 0
          ? selectedCourseDetail.teacherIds[0] // Pick first available teacher or null
          : null,
      }];

      const payload = {
        className: values.className,
        capacity: values.capacity,
        status: values.status,
        startDate: values.startDate?.format("YYYY-MM-DD") || null,
        endDate: values.endDate?.format("YYYY-MM-DD") || null,
        categoryId: selectedCourseDetail.categoryId, // Derive categoryId from selected course
        assignments: assignmentsPayload, // Pass the assignments array
      };

      await onCreateClassAndEnroll({
        ...payload, // Pass the constructed payload
        failedStudentIds: failedStudents, // Keep failedStudentIds separate for parent handler
      });
      // --- END NEW LOGIC ---

      message.success("Đã tạo lớp học lại và ghi danh sinh viên.");
      onCancel();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        "Lưu lớp thất bại. Vui lòng kiểm tra lại thông tin.";
      message.error(errorMsg);
      console.error("Error creating re-enrollment class:", error);
    } finally {
      setCreatingClass(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <Space>
          <PlusOutlined style={{ color: "#1890ff" }} />
          <Title level={5} style={{ margin: 0 }}>
            Tạo Lớp Học Lại
          </Title>
        </Space>
      }
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="create"
          type="primary"
          onClick={handleCreate}
          loading={creatingClass}
          disabled={!selectedCourse?.id || failedStudents.length === 0}
        >
          Tạo Lớp & Ghi danh ({failedStudents.length})
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Khóa học" required>
          <Input
            readOnly
            placeholder="Chọn Khóa học"
            value={selectedCourse?.name || ""}
            onClick={() => setIsSubjectSelectionModalOpen(true)}
            addonAfter={
              <Button
                icon={<FolderOpenOutlined />}
                onClick={() => setIsSubjectSelectionModalOpen(true)}
                type="link"
                style={{ padding: 0 }}
              />
            }
            style={{ cursor: "pointer" }}
          />
        </Form.Item>

        <Form.Item
          name="className"
          label="Tên Lớp Học Lại"
          rules={[{ required: true, message: "Vui lòng nhập tên lớp" }]}
        >
          <Input placeholder="Ví dụ: Lớp học lại Java Cơ bản" />
        </Form.Item>

        <Form.Item label="Sinh viên trượt" style={{ marginBottom: 0 }}>
          {loadingStudents ? (
            <Spin />
          ) : failedStudents.length > 0 ? (
            <Space size={[0, 8]} wrap>
              {failedStudents.map((studentId) => (
                <Tag key={studentId} color="red">
                  {`SV#${studentId}`}
                </Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">
              Không tìm thấy sinh viên trượt cho khóa học này.
            </Text>
          )}
        </Form.Item>
      </Form>

      <SubjectSelectionModal
        open={isSubjectSelectionModalOpen}
        onCancel={() => setIsSubjectSelectionModalOpen(false)}
        onSelect={(subjects) => {
          if (subjects && subjects.length > 0) {
            handleCourseSelect(subjects[0].id, subjects[0].name);
          } else {
            setIsSubjectSelectionModalOpen(false);
          }
        }}
        selectedSubjects={selectedCourse ? [selectedCourse] : []}
        allSubjects={allCourses} // Pass allCourses here
      />
    </Modal>
  );
};

const ClassesPages = () => {
  const [classListManager, setClassListManager] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState({});
  const [isReEnrollmentModalOpen, setIsReEnrollmentModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [allCourses, setAllCourses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const courseMap = useMemo(() => {
    return allCourses.reduce((acc, course) => {
      acc[course.courseId] = course;
      return acc;
    }, {});
  }, [allCourses]);

  const loadClass = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllClassAPI();
      const items = Array.isArray(res?.data?.data) ? res.data.data : [];
      setClassListManager(items);

      if (items.length === 0) {
        setEditingRecord({});
      }
    } catch (error) {
      message.error("Không thể tải danh sách lớp học");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllCourses = useCallback(async () => {
    try {
      const res = await fetchAllSubjectAPI();
      const items = Array.isArray(res?.data)
        ? res.data.map((course) => ({
            ...course,
            teacherIds: Array.isArray(course.teacherIds)
              ? course.teacherIds.map(Number)
              : [],
          }))
        : [];
      setAllCourses(items);
    } catch (e) {
      console.error("Failed to load all courses:", e);
    }
  }, []);

  const loadAllTeachers = useCallback(async () => {
    try {
      const res = await getAllInstructors();
      const items = Array.isArray(res?.data?.data)
        ? res.data.data.map((t) => ({
            ...t,
            userId: Number(t.userId),
            id: Number(t.userId),
            fullName: `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          }))
        : [];
      setAllTeachers(items);
    } catch (e) {
      console.error("Failed to load all instructors:", e);
    }
  }, []);

  const loadAllCategories = useCallback(async () => {
    try {
      const res = await fetchAllCategoriesAPI();
      const items = Array.isArray(res?.data) ? res.data : [];
      setAllCategories(items);
    } catch (e) {
      console.error("Failed to load all categories:", e);
    }
  }, []);

  const filteredClassList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return classListManager;

    return classListManager.filter(
      (cls) =>
        (cls.className || "").toLowerCase().includes(term) ||
        (cls.courseTitles || []).some((title) =>
          title.toLowerCase().includes(term)
        ) ||
        (cls.teacherName || "").toLowerCase().includes(term) ||
        (cls.status || "").toLowerCase().includes(term)
    );
  }, [classListManager, searchTerm]);

  useEffect(() => {
    setPagination((p) => ({ ...p, total: filteredClassList.length }));
  }, [filteredClassList]);

  const handleFormFinish = async (formData) => {
    try {
      const { classId, ...data } = formData;

      const categoryId = courseMap[data.courseIds[0]]?.categoryId || null;

      // DTO Backend đang mong đợi assignments: Set<ClassSubjectAssignmentDTO>
      // LƯU Ý: Đây là DTO cũ, có thể không còn dùng
      const payload = {
        className: data.className,
        capacity: data.capacity,
        status: data.status,
        courseIds: data.courseIds,
        teacherId: data.teacherId,
        startDate: data.startDate,
        endDate: data.endDate,
        categoryId: categoryId,
      };

      if (classId) {
        await updateClassAPI(classId, payload);
        message.success("Cập nhật lớp thành công");
      } else {
        await createClassAPI(payload);
        message.success("Tạo lớp thành công");
      }

      setEditingRecord({});
      loadClass();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        "Lưu lớp thất bại. Vui lòng kiểm tra lại thông tin.";
      message.error(errorMsg);
    }
  };

  const handleCreate = () => {
    setEditingRecord({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (record) => {
    const assignmentsMap = (record.assignments || []).reduce((acc, current) => {
      acc[current.courseId] = current.teacherId;
      return acc;
    }, {});

    const courseIds =
      record.courseIds && Array.isArray(record.courseIds)
        ? record.courseIds
        : record.courseId
        ? [record.courseId]
        : [];

    const extendedRecord = {
      ...record,
      courseIds: courseIds,
      assignments: courseIds.map((courseId) => ({
        courseId,
        teacherId: assignmentsMap[courseId] || record.teacherId,
      })),
    };

    setEditingRecord(extendedRecord);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    try {
      await deleteClassAPI(id);
      message.success("Xóa lớp thành công");
      loadClass();
      eventBus.dispatch("classes-updated");
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      if (backendMessage && backendMessage.includes('foreign key constraint fails')) {
        message.error("Xóa lớp thất bại: Tồn tại dữ liệu liên quan như lịch thi hoặc bài thi.");
      } else {
        message.error(backendMessage || "Xóa lớp thất bại, đã có lỗi xảy ra.");
      }
    }
  };

  const handleCreateClassAndEnroll = async ({
    failedStudentIds,
    ...classData
  }) => {
    try {
      const newClass = await createClassAPI(classData);
      message.success("Tạo lớp học lại thành công.");

      if (failedStudentIds && failedStudentIds.length > 0) {
        await bulkAddStudentsToClassAPI(newClass.classId, failedStudentIds);
        message.success(
          `Ghi danh ${failedStudentIds.length} sinh viên vào lớp học lại.`
        );
      }

      loadClass();
      setIsReEnrollmentModalOpen(false);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        "Lỗi khi tạo lớp học lại hoặc ghi danh sinh viên.";
      message.error(errorMsg);
    }
  };

  useEffect(() => {
    loadClass();
    loadAllCourses();
    loadAllTeachers();
    loadAllCategories();
  }, [loadClass, loadAllCourses, loadAllTeachers, loadAllCategories]);

  const columns = [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Tên Lớp",
      width: 200,
      dataIndex: "className",
      render: (text) => (
        <Space>
          <BookOutlined style={{ color: "#1890ff", fontSize: 16 }} />
          <Tag color="blue" style={{ fontSize: 13, padding: "4px 12px" }}>
            {text}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Môn học",
      key: "courseTitles",
      render: (_, record) => {
        const titles = record.courseTitles || [];

        if (titles.length === 0) {
          return (
            <span style={{ color: "#999", fontStyle: "italic" }}>
              Chưa có môn học
            </span>
          );
        }

        return (
          <Space size={[0, 8]} wrap>
            {titles.map((title, index) => (
              <Tag key={index} color="blue">
                {title}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Giảng viên",
      key: "teacherNames",
      render: (_, record) => {
        const names = record.teacherNames || [];

        if (names.length === 0) {
          return (
            <span style={{ color: "#999", fontStyle: "italic" }}>
              Chưa có giảng viên
            </span>
          );
        }

        return (
          <Space size={[0, 8]} wrap>
            {names.map((name, index) => (
              <Tag key={index} color="geekblue">
                {name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (text) => {
        const opt = CLASS_STATUS_OPTIONS.find((o) => o.value === text);
        const color = opt
          ? text === "ONGOING"
            ? "green"
            : text === "SCHEDULED"
            ? "blue"
            : "gray"
          : "default";
        return (
          <Space>
            <Tag
              color={color}
              style={{ fontSize: 13, padding: "4px 12px" }}
              className="status-class-manager"
            >
              {opt ? opt.label : text}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      align: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              type="primary"
              ghost
            />
          </Tooltip>
          <Popconfirm
            title="Xóa lớp này?"
            description="Thao tác này không thể hoàn tác!"
            onConfirm={() => handleDelete(record.classId)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-dashboard roles-page" style={{ padding: "24px" }}>
      <ClassForm
        initialValues={editingRecord}
        onFinish={handleFormFinish}
        allCourses={allCourses}
        allTeachers={allTeachers}
        setEditingRecord={setEditingRecord}
        loadClass={loadClass}
        allCategories={allCategories}
      />

      <Card
        title={
          <Space>
            <BookOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            <Title level={5} style={{ margin: 0 }}>
              Quản lý Lớp học
            </Title>
          </Space>
        }
        bodyStyle={{ padding: "16px 24px" }}
      >
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Search
            placeholder="Tìm kiếm theo Tên Lớp, Môn học, Giảng viên, Trạng thái..."
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 400 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            Tạo Lớp mới
          </Button>
          <Button
            type="default"
            icon={<PlusOutlined />}
            onClick={() => setIsReEnrollmentModalOpen(true)}
            size="large"
          >
            Tạo Lớp học lại
          </Button>
        </Space>

        <Table
          className="roles-table"
          size="middle"
          rowKey="classId"
          columns={columns}
          loading={loading}
          dataSource={filteredClassList}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredClassList.length,
            showTotal: (total) => `Tổng ${total} lớp học`,
            showSizeChanger: false,
            pageSizeOptions: ["10", "20", "50"],
            onChange: (current, pageSize) =>
              setPagination((p) => ({ ...p, current, pageSize })),
          }}
          locale={{ emptyText: <Empty description="Chưa có lớp học" /> }}
        />
      </Card>

      <ReEnrollmentModal
        open={isReEnrollmentModalOpen}
        onCancel={() => setIsReEnrollmentModalOpen(false)}
        onCreateClassAndEnroll={handleCreateClassAndEnroll}
        allCourses={allCourses}
      />
    </div>
  );
};

export default ClassesPages;
