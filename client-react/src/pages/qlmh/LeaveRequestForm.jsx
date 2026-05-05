import React, { useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  message,
  Space,
  Typography,
  Upload,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import {
  createLeaveRequest,
  uploadAttachment,
} from "../../redux/api/slices/leaveRequestSlice";
import dayjs from "dayjs";
import { ArrowRightOutlined, UploadOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title } = Typography;

const mapDatesToApi = (values) => ({
  startDate: values.dates[0].format("YYYY-MM-DD"),
  endDate: values.dates[1].format("YYYY-MM-DD"),
  reason: values.reason,
});

export default function LeaveRequestForm({ onSuccessfulSubmit, onCancel }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.leaveRequests);

  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const customRequest = async ({ file, onSuccess, onError }) => {
    setIsUploading(true);
    try {
      const actionResult = await dispatch(uploadAttachment(file));
      const url = unwrapResult(actionResult);

      setUploadedUrl(url);
      onSuccess(url);
      message.success(`Tải lên ảnh ${file.name} thành công!`);
    } catch (error) {
      const errorMessage =
        error?.message || (typeof error === "string" ? error : "Lỗi tải ảnh");
      onError(new Error(errorMessage));
      message.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("Chỉ chấp nhận file JPG/PNG!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Dung lượng ảnh phải nhỏ hơn 2MB!");
    }
    if (fileList.length >= 1) return Upload.LIST_IGNORE;

    return isJpgOrPng && isLt2M;
  };

  const handleRemove = () => {
    setUploadedUrl(null);
    setFileList([]);
    return true;
  };

  const onFinish = async (values) => {
    if (isUploading) {
      message.warning("Vui lòng chờ ảnh tải lên hoàn tất trước khi gửi đơn.");
      return;
    }

    try {
      const apiData = {
        ...mapDatesToApi(values),
        attachmentUrl: uploadedUrl,
      };

      const actionResult = await dispatch(createLeaveRequest(apiData));
      unwrapResult(actionResult);

      message.success("Đơn xin nghỉ đã được gửi thành công và đang chờ duyệt!");
      form.resetFields();
      setUploadedUrl(null);
      setFileList([]);

      if (onSuccessfulSubmit) {
        onSuccessfulSubmit();
      }
    } catch (error) {
      const errorMessage = error?.message || "Có lỗi xảy ra khi gửi đơn.";
      message.error(errorMessage);
    }
  };

  const disabledDate = (current) => {
    return current && current.isBefore(dayjs().startOf("day"));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      style={{ marginTop: 16 }}
    >
      <Form.Item
        name="dates"
        label="Thời gian nghỉ (Từ ngày - Đến ngày)"
        rules={[{ required: true, message: "Vui lòng chọn thời gian nghỉ!" }]}
      >
        <RangePicker
          style={{ width: "100%" }}
          format="DD/MM/YYYY"
          disabledDate={disabledDate}
          size="large"
          separator={
            <ArrowRightOutlined style={{ fontSize: 14, color: "#aaa" }} />
          }
        />
      </Form.Item>

      <Form.Item
        name="reason"
        label="Lý do xin nghỉ"
        rules={[
          { required: true, message: "Vui lòng nhập lý do!" },
          { min: 10, message: "Lý do phải có ít nhất 10 ký tự." },
        ]}
      >
        <TextArea rows={4} placeholder="Ví dụ: Nghỉ ốm, việc gia đình..." />
      </Form.Item>

      <Form.Item
        label="Ảnh/Tài liệu chứng minh (Không bắt buộc)"
        extra="Chỉ chấp nhận JPG/PNG, tối đa 2MB. Tải lên trước khi gửi đơn."
      >
        <Upload
          customRequest={customRequest}
          beforeUpload={beforeUpload}
          onRemove={handleRemove}
          fileList={fileList}
          onChange={({ fileList: newFileList }) => setFileList(newFileList)}
          maxCount={1}
          accept=".jpg,.jpeg,.png"
          listType="picture"
        >
          <Button
            icon={<UploadOutlined />}
            disabled={fileList.length >= 1 || isUploading}
          >
            {isUploading ? "Đang tải lên..." : "Chọn ảnh"}
          </Button>
        </Upload>
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onCancel} disabled={loading || isUploading}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={isUploading || loading}
          >
            Gửi Đơn
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
