import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Upload,
  message,
  Image,
  Divider,
  Row,
  Col,
} from "antd";
import {
  BookOutlined,
  DollarOutlined,
  UploadOutlined,
  UserOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { fetchAllCategoriesAPI } from "../../../services/authService";

const { TextArea } = Input;
const { Option } = Select;

const slugify = (s = "") =>
  s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const totalWeightValidator = ({ getFieldValue }) => ({
  validator(_, value) {
    const assignments = getFieldValue("assignments_weight") || 0;
    const quizzes = getFieldValue("quizzes_weight") || 0;
    const exams = getFieldValue("exams_weight") || 0;

    if (value === undefined || value === null) return Promise.resolve();

    if (assignments + quizzes + exams === 100) {
      return Promise.resolve();
    }
    return Promise.reject(new Error("Lỗi: Tổng 3 trọng số phải bằng 100%!"));
  },
});

export default function SubjectEditModalAdmin({
  open,
  initialValues,
  onCancel,
  onSubmit,
  confirmLoading,
  teachers,
  loading,
}) {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [currentThumbnail, setCurrentThumbnail] = useState(null);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetchAllCategoriesAPI();
      const categoriesData = (response.data || []).map((c) => ({
        id: c.categoryId,
        name: c.name,
        description: c.description,
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading categories:", error);
      message.error("Không thể tải danh sách danh mục");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCategories();

      const sanitizedTeacherIds = Array.isArray(initialValues?.teacherIds)
        ? initialValues.teacherIds.map((id) => Number(id))
        : [];
      const sanitizedPrice = Number(initialValues?.price) || 0;

      form.setFieldsValue({
        subjectId: initialValues?.subjectId,
        title: initialValues?.title || "",
        slug: initialValues?.slug || "",
        shortDescription: initialValues?.shortDescription || "",
        description: initialValues?.description || "",
        level: initialValues?.level || "BEGINNER",
        price: sanitizedPrice,
        status: initialValues?.status || "DRAFT",
        categoryId: initialValues?.categoryId ?? null,
        teacherIds: sanitizedTeacherIds,
        // LƯU Ý: Backend trả về camelCase (ví dụ: assignmentsWeight).
        // Form của bạn đang dùng snake_case (assignments_weight)
        assignments_weight: initialValues?.assignmentsWeight ?? 30, // Đã sửa tên thuộc tính từ initialValues
        quizzes_weight: initialValues?.quizzesWeight ?? 20, // Đã sửa tên thuộc tính từ initialValues
        exams_weight: initialValues?.examsWeight ?? 50, // Đã sửa tên thuộc tính từ initialValues
        passing_score: initialValues?.passingScore ?? 70, // Đã sửa tên thuộc tính từ initialValues
      });

      setCurrentThumbnail(initialValues?.thumbnailUrl ?? null);
    } else {
      form.resetFields();
      setCurrentThumbnail(null);
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const submittedValues = {
        ...values,
        teacherIds: values.teacherIds.map(Number),
      };

      onSubmit?.(submittedValues);
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const handleValuesChange = (changedValues) => {
    if (changedValues.title) {
      const newSlug = slugify(changedValues.title);
      form.setFieldsValue({ slug: newSlug });
    }
  };

  return (
    <Modal
      title={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <BookOutlined style={{ color: "#1890ff" }} />
          <span>Chỉnh sửa Môn học</span>
        </span>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Cập nhật"
      cancelText="Hủy"
      width={700}
      confirmLoading={confirmLoading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        onValuesChange={handleValuesChange}
      >
        <Form.Item name="subjectId" hidden>
          <Input />
        </Form.Item>
        <Form.Item
          name="title"
          label="Tên Môn học"
          rules={[{ required: true, message: "Vui lòng nhập tên môn học" }]}
        >
          <Input
            placeholder="e.g. Java Spring Boot Advance"
            prefix={<BookOutlined style={{ color: "#bfbfbf" }} />}
          />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          rules={[{ required: true, message: "Slug được tạo tự động" }]}
        >
          <Input placeholder="Được tạo tự động từ Tên Môn học" disabled />
        </Form.Item>

        <Form.Item
          name="shortDescription"
          label="Mô tả ngắn"
          rules={[{ required: true, message: "Vui lòng nhập mô tả ngắn" }]}
        >
          <TextArea
            rows={3}
            showCount
            maxLength={255}
            placeholder="Tóm tắt ngắn gọn về môn học..."
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả chi tiết"
          rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
        >
          <TextArea
            rows={4}
            placeholder="Mô tả chi tiết về môn học..."
            showCount
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="price"
              label="Giá (VND)"
              rules={[{ required: true, message: "Vui lòng nhập giá" }]}
            >
              <InputNumber
                placeholder="100000"
                prefix={<DollarOutlined style={{ color: "#bfbfbf" }} />}
                style={{ width: "100%" }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v.replace(/(,*)/g, "")}
                min={100000}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="level"
              label="Cấp độ"
              rules={[{ required: true, message: "Vui lòng chọn cấp độ" }]}
            >
              <Select placeholder="Chọn cấp độ">
                <Option value="BEGINNER">BEGINNER</Option>
                <Option value="INTERMEDIATE">INTERMEDIATE</Option>
                <Option value="ADVANCED">ADVANCED</Option>
                <Option value="EXPERT">EXPERT</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="categoryId"
              label="Khóa học"
              rules={[{ required: true, message: "Vui lòng chọn Khóa học" }]}
            >
              <Select placeholder="Chọn khóa học" loading={loadingCategories}>
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select placeholder="Chọn trạng thái">
                <Option value="DRAFT">DRAFT</Option>
                <Option value="PUBLISHED">PUBLISHED</Option>
                <Option value="ARCHIVED">ARCHIVED</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="teacherIds"
          label="Giáo viên"
          rules={[{ required: true, message: "Vui lòng chọn Giáo viên" }]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn giáo viên"
            loading={loading}
          >
            {teachers.map((t) => (
              <Option key={t.id} value={Number(t.id)}>
                <UserOutlined style={{ marginRight: 8, color: "#bfbfbf" }} />
                {t.fullName || t.username}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Chính sách Điểm</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="assignments_weight"
              label="Assignment (%)"
              rules={[
                { required: true, message: "Bắt buộc" },
                totalWeightValidator,
              ]}
              dependencies={["quizzes_weight", "exams_weight"]}
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: "100%" }}
                prefix={<PercentageOutlined style={{ color: "#bfbfbf" }} />}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="quizzes_weight"
              label="Quiz (%)"
              rules={[
                { required: true, message: "Bắt buộc" },
                totalWeightValidator,
              ]}
              dependencies={["assignments_weight", "exams_weight"]}
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: "100%" }}
                prefix={<PercentageOutlined style={{ color: "#bfbfbf" }} />}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="exams_weight"
              label="Exam (%)"
              rules={[
                { required: true, message: "Bắt buộc" },
                totalWeightValidator,
              ]}
              dependencies={["assignments_weight", "quizzes_weight"]}
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: "100%" }}
                prefix={<PercentageOutlined style={{ color: "#bfbfbf" }} />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="passing_score"
          label="Điểm qua môn (Thang 100)"
          rules={[{ required: true, message: "Bắt buộc" }]}
        >
          <InputNumber
            min={0}
            max={100}
            style={{ width: "100%" }}
            placeholder="e.g. 70"
          />
        </Form.Item>

        <Form.Item
          name="thumbnail"
          label="Ảnh bìa (Thumbnail)"
          valuePropName="fileList"
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
        >
          <Upload
            name="thumbnail"
            listType="picture-card"
            maxCount={1}
            beforeUpload={() => false}
            accept="image/*"
          >
            {currentThumbnail && !form.getFieldValue("thumbnail")?.length ? (
              <div
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                <Image
                  src={currentThumbnail}
                  alt="Ảnh bìa hiện tại"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "6px",
                  }}
                  preview={false}
                />
                <style>{`
                  .ant-upload-list-item-name {
                    display: none;
                  }
                `}</style>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  className="upload-overlay"
                >
                  <UploadOutlined
                    style={{ color: "white", fontSize: "20px" }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Tải lên</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
