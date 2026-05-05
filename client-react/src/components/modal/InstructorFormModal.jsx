import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Upload,
  Row,
  Col,
  message,
  Select,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Option } = Select;

const InstructorFormModal = ({ open, onFinish, onCancel, initialValues }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (initialValues) {
      form.setFieldsValue(initialValues);
      if (initialValues.avatarUrl) {
        setFileList([
          {
            uid: "-1",
            name: "current-avatar.png",
            status: "done",
            url: initialValues.avatarUrl,
          },
        ]);
      } else {
        setFileList([]);
      }
    } else {
      form.resetFields();
      // Set default status for new instructors
      form.setFieldsValue({ status: "ACTIVE" });
      setFileList([]);
    }
  }, [open, initialValues, form]);

  const validateTeacherCode = (_, value) => {
    if (!value || value.trim() === "") {
      return Promise.reject(new Error("Vui lòng nhập mã giảng viên!"));
    }
    return Promise.resolve();
  };

  const handleFinish = async (values) => {
    const formData = new FormData();
    const newAvatarFile = fileList?.[0]?.originFileObj ?? null;

    let finalAvatarUrl;

    if (newAvatarFile) {
      finalAvatarUrl = null;
    } else if (fileList.length > 0) {
      finalAvatarUrl = initialValues?.avatarUrl || null;
    } else {
      finalAvatarUrl = null;
    }

    const dataJson = {
      ...values,
      avatarUrl: finalAvatarUrl,
      ...(initialValues?.userId && { userId: initialValues.userId }),
    };

    formData.append("data", JSON.stringify(dataJson));

    if (newAvatarFile) {
      formData.append("avatar", newAvatarFile);
    }

    try {
      await onFinish(formData);
    } catch (error) {
      if (error.response && error.response.data) {
        const serverMessage = error.response.data.message;
        if (serverMessage?.includes("Teacher code already exists")) {
          form.setFields([
            { name: "teacherCode", errors: ["Mã giảng viên này đã tồn tại!"] },
          ]);
        } else if (serverMessage?.includes("Email already exists")) {
          form.setFields([
            { name: "email", errors: ["Email này đã tồn tại!"] },
          ]);
        } else {
          message.error(serverMessage || "Đã có lỗi xảy ra, vui lòng thử lại.");
        }
      } else {
        message.error("Đã có lỗi không xác định xảy ra!");
      }
    }
  };
  const uploadProps = {
    onRemove: () => {
      setFileList([]);
      return true;
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      const isLessThan2M = file.size / 1024 / 1024 < 2;

      if (!isImage) {
        message.error("You can only upload image files!");
        return false;
      }

      if (!isLessThan2M) {
        message.error("Image must be smaller than 2MB!");
        return false;
      }
      setFileList([
        { uid: file.uid, name: file.name, status: "done", originFileObj: file },
      ]);
      return false;
    },
    fileList,
    listType: "picture-card",
    maxCount: 1,
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <Modal
      title={initialValues ? "Edit Instructor" : "Create New Instructor"}
      open={open}
      onCancel={onCancel}
      width={720}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Save
        </Button>,
      ]}
      destroyOnClose={true}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Avatar">
          <Upload {...uploadProps}>
            {fileList.length >= 1 ? null : uploadButton}
          </Upload>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: "Please enter first name!" }]}
            >
              <Input placeholder="E.g., John" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: "Please enter last name!" }]}
            >
              <Input placeholder="E.g., Doe" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter email!" },
            { type: "email", message: "Invalid email format!" },
          ]}
        >
          <Input placeholder="E.g., example@gmail.com" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                {
                  pattern: /^[0-9]{10,11}$/,
                  message: "Phone number must be 10 or 11 digits!",
                },
              ]}
            >
              <Input placeholder="E.g., 0912345678" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="teacherCode"
              label="Instructor Code"
              rules={[{ validator: validateTeacherCode }]}
            >
              <Input placeholder="E.g., INS-001" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Please select a status!" }]}
            >
              <Select placeholder="Select a status">
                <Option value="ACTIVE">ACTIVE</Option>
                <Option value="INACTIVE">INACTIVE</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="occupation" label="Occupation">
              <Input placeholder="E.g., Software Engineer" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="address" label="Address">
          <Input placeholder="E.g., 123 ABC Street" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="city" label="City">
              <Input placeholder="E.g., New York" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="country" label="Country">
              <Input placeholder="E.g., USA" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="bio"
          label="Biography"
          rules={[
            { max: 500, message: "Biography cannot exceed 500 characters!" },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Short introduction about the instructor..."
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InstructorFormModal;

