import {
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Form,
  Input,
  Modal,
  Space,
  Select,
  DatePicker,
  InputNumber,
} from "antd";
import { useState, useEffect } from "react";
import {
  fetchAllTeacherAPI,
  fetchAllCourseAPI,
} from "../../services/instructorService";

const ClassEditModal = ({
  editingId,
  open,
  setOpen,
  handleSubmit,
  form,
  submitting = false,
}) => {
  const [teacherList, setTeacherList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load danh sách giáo viên
  const loadTeachers = async () => {
    try {
      setLoading(true);
      const res = await fetchAllTeacherAPI();
      // Teacher API response received
      const teachers = Array.isArray(res?.data?.data) ? res.data.data : [];
      // Teachers array processed
      setTeacherList(teachers);
    } catch (error) {
      // Failed to load teacher list
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await fetchAllCourseAPI();
      // Course API response received
      const courses = Array.isArray(res?.data) ? res.data : [];
      setCourseList(courses);
    } catch (error) {
      // Failed to load course list
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadTeachers();
      loadCourses();
    }
  }, [open]);

  return (
    <Modal
      title={
        <Space>
          <BookOutlined style={{ color: "#1890ff" }} />
          <span>{editingId ? "Chỉnh sửa Lớp học" : "Tạo Lớp học mới"}</span>
        </Space>
      }
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okText={editingId ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      width={600}
      confirmLoading={submitting}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="className"
          label="Tên Lớp"
          rules={[
            { required: true, message: "Vui lòng nhập tên lớp" },
            { min: 2, message: "Tên lớp phải có ít nhất 2 ký tự" },
          ]}
        >
          <Input
            placeholder="Ví dụ: Lớp Spring Boot Advance"
            prefix={<BookOutlined style={{ color: "#bfbfbf" }} />}
          />
        </Form.Item>

        <Form.Item
          name="teacherId"
          label="Giảng viên"
          rules={[{ required: true, message: "Vui lòng chọn giảng viên" }]}
        >
          <Select
            placeholder="Chọn giảng viên"
            loading={loading}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {teacherList.map((teacher, index) => (
              <Select.Option
                key={teacher.userId || `teacher-${index}`}
                value={teacher.userId}
              >
                {`${teacher.firstName} ${teacher.lastName}`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="courseId"
          label="Khóa học"
          rules={[{ required: true, message: "Vui lòng chọn khóa học" }]}
        >
          <Select
            placeholder="Chọn khóa học"
            loading={loading}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {courseList.map((course, index) => (
              <Select.Option
                key={course.courseId || `course-${index}`}
                value={course.courseId}
              >
                {course.courseTitle || course.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select placeholder="Chọn trạng thái">
            <Select.Option value="SCHEDULED">SCHEDULED</Select.Option>
            <Select.Option value="ONGOING">ONGOING</Select.Option>
            <Select.Option value="COMPLETED">COMPLETED</Select.Option>
            <Select.Option value="CANCELLED">CANCELLED</Select.Option>
          </Select>
        </Form.Item>

        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu" }]}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Chọn ngày bắt đầu"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="Ngày kết thúc"
            rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc" }]}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Chọn ngày kết thúc"
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="capacity"
          label="Số lượng học viên"
          rules={[
            { required: true, message: "Vui lòng nhập số lượng học viên" },
            { type: "number", min: 1, message: "Số lượng phải lớn hơn 0" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Ví dụ: 20"
            min={1}
            max={100}
            prefix={<TeamOutlined style={{ color: "#bfbfbf" }} />}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ClassEditModal;
