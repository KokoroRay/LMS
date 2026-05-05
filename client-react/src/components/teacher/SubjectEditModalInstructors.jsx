import { Modal, Form, Input, Select, InputNumber, Upload, message, Image } from "antd";
import { BookOutlined, DollarOutlined, UploadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { fetchAllCategoriesAPI } from "../../services/authService";

const { TextArea } = Input;
const { Option } = Select;

export default function SubjectEditModalInstructors({ open, initialValues, onCancel, onSubmit, confirmLoading }) {
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
      // Error loading categories
      message.error("Không thể tải danh sách danh mục");
      setCategories([
        { id: 1, name: "Programming" },
        { id: 2, name: "Design" },
        { id: 3, name: "Marketing" },
        { id: 4, name: "Business" },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCategories();

      form.setFieldsValue({
        title: initialValues?.title || "",
        slug: initialValues?.slug || "",
        shortDescription: initialValues?.shortDescription || "",
        description: initialValues?.description || "",
        level: initialValues?.level || "BEGINNER",
        price: initialValues?.price ?? 0,
        status: initialValues?.status || "DRAFT",
        categoryId: initialValues?.categoryId ?? null,
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
      onSubmit?.({ ...values, createdById: 1 });
    } catch {
      // ignore
    }
  };

  const isEdit = Boolean(initialValues?.subjectId ?? initialValues?.courseId);

  return (
    <Modal
      title={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <BookOutlined style={{ color: "#1890ff" }} />
          <span>{isEdit ? "Edit Subject" : "Create New Subject"}</span>
        </span>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? "Update" : "Create"}
      cancelText="Cancel"
      width={700}
      confirmLoading={confirmLoading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, message: "Please enter subject title" },
            { min: 5, message: "Title must be at least 5 characters" },
          ]}
        >
          <Input placeholder="e.g. Java Spring Boot Advance" prefix={<BookOutlined style={{ color: "#bfbfbf" }} />} />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          tooltip="Lowercase, hyphen-separated. Example: java-spring-boot-co-ban"
          rules={[
            { required: true, message: "Please enter slug" },
            { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: "Slug must be lowercase letters/numbers with hyphens" },
          ]}
        >
          <Input placeholder="e.g. java-spring-boot-co-ban" />
        </Form.Item>

        <Form.Item
          name="shortDescription"
          label="Short Description"
          rules={[
            { required: true, message: "Please enter short description" },
            { max: 255, message: "Must be at most 255 characters" },
          ]}
        >
          <TextArea rows={3} showCount maxLength={255} placeholder="Brief summary of the subject..." />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { required: true, message: "Please enter description" },
            { min: 20, message: "Description must be at least 20 characters" },
          ]}
        >
          <TextArea rows={4} placeholder="Detailed subject description..." showCount />
        </Form.Item>

        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item
            name="price"
            label="Price (VND)"
            rules={[
              { required: true, message: "Please enter price" },
              { type: "number", min: 100000, message: "Price must be at least 100,000 VND" },
            ]}
            style={{ flex: 1 }}
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

          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: "Please choose level" }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Select level">
              <Option value="BEGINNER">BEGINNER</Option>
              <Option value="INTERMEDIATE">INTERMEDIATE</Option>
              <Option value="ADVANCED">ADVANCED</Option>
              <Option value="EXPERT">EXPERT</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="categoryId"
          label="Category"
          rules={[{ required: true, message: "Vui lòng chọn Danh mục" }]}
        >
          <Select placeholder="Select category" loading={loadingCategories}>
            {categories.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please choose status" }]}>
          <Select disabled>
            <Option value="DRAFT">DRAFT</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="thumbnail"
          label="Thumbnail"
          valuePropName="fileList"
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
        >
          <Upload
            name="thumbnail"
            listType="picture-card"
            maxCount={1}
            beforeUpload={() => false}
            accept="image/*"
            onChange={(info) => {
              if (info.file.status === "error") {
                message.error(`${info.file.name} upload failed.`);
              }
            }}
          >
            {currentThumbnail && !form.getFieldValue("thumbnail")?.length ? (
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <Image
                  src={currentThumbnail}
                  alt="Current thumbnail"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "6px",
                    opacity: 0,
                    transition: "opacity 0.3s",
                  }}
                  className="upload-overlay"
                >
                  <UploadOutlined style={{ color: "white", fontSize: "20px" }} />
                </div>
              </div>
            ) : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
