// src/components/modal/CourseCategoryFormModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, message, Space, Tag } from 'antd';

const CourseCategoryFormModal = ({ open, onFinish, onCancel, initialValues, isSaving }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues || { name: '', description: '' });
    }
  }, [open, initialValues, form]);

  const handleFormFinish = (values) => {
    // Gọi onFinish từ parent component
    onFinish(values);
  };

  return (
    <Modal
      open={open}
      title={initialValues?.categoryId ? "Chỉnh sửa Danh mục" : "Tạo Danh mục mới"}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isSaving}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormFinish}
      >
        <Form.Item
          name="name"
          label="Tên Danh mục"
          rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
        >
          <Input maxLength={100} placeholder="Ví dụ: Lập trình Web Frontend" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Mô tả"
        >
          <Input.TextArea rows={3} maxLength={500} placeholder="Mô tả ngắn về nội dung danh mục" />
        </Form.Item>

        {initialValues?.categoryId && (
          <Form.Item label="Các khoá học trong danh mục">
            {initialValues.courses && initialValues.courses.length > 0 ? (
              <Space size={[0, 8]} wrap>
                {initialValues.courses.map(course => (
                  <Tag key={course.courseId} color="geekblue">
                    {course.title}
                  </Tag>
                ))}
              </Space>
            ) : (
              <p>Chưa có khoá học nào trong danh mục này.</p>
            )}
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default CourseCategoryFormModal;