import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  DatePicker,
  Typography,
  Progress,
  message as antdMessage,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import api from "../../../services/authService";
import TextEditor from "./TextEditor";
import { uploadToCloudinary } from "../../../utils/cloudinaryUploader";
import {
  slugify,
  toPreview,
  safeParseDate,
  fixQuillContent,
  CATEGORY_OPTIONS,
  formatCategoryDisplay,
} from "../../../utils/helpers";

const { Text } = Typography;
const MAX_VIDEO_MB = 200;
const POST_TYPES = CATEGORY_OPTIONS;
const POST_STATUS = [
  { value: "DRAFT", label: "DRAFT" },
  { value: "PUBLISHED", label: "PUBLISHED" },
  { value: "ARCHIVED", label: "ARCHIVED" },
];
const PostFormModal = ({ open, editingPost, onCancel, onComplete }) => {
  const [form] = Form.useForm();
  const { user: loggedInUser } = useSelector((state) => state.auth);
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [imgProgress, setImgProgress] = useState(0);
  const [vidProgress, setVidProgress] = useState(0);
  const editingId = editingPost?.id || null;
  const titleWatch = Form.useWatch("title", form);
  const postTypeWatch = Form.useWatch("postType", form);
  useEffect(() => {
    if (!editingId && titleWatch) {
      form.setFieldsValue({ slug: slugify(titleWatch) });
    }
  }, [titleWatch, editingId, form]);
  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setCoverFile(null);
      setVideoFile(null);
      setImgProgress(0);
      setVidProgress(0);
      if (editingPost) {
        const fixedContent = fixQuillContent(editingPost.content);
        form.setFieldsValue({
          title: editingPost.title,
          slug: editingPost.slug,
          postType: editingPost.postType || editingPost.category || "FRONT_END",
          status: editingPost.status || "DRAFT",
          coverUrl: editingPost.coverUrl || "",
          videoUrl: editingPost.videoUrl || "",
          publishedAt: safeParseDate(editingPost.publishedAt),
          content: fixedContent || "",
        });
        setCoverPreview(editingPost.coverUrl || null);
        setVideoPreview(editingPost.videoUrl || null);
      } else {
        form.resetFields();
        form.setFieldsValue({
          postType: "FRONT_END",
          status: "DRAFT",
          content: "",
        });
        setCoverPreview(null);
        setVideoPreview(null);
      }
    }
  }, [open, editingPost, form]);
  const handleSelectCover = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        antdMessage.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
        return;
      }
      const MAX_SIZE_MB = 10;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        antdMessage.error(`Ảnh Cover quá lớn! Tối đa ${MAX_SIZE_MB}MB`);
        return;
      }
      setCoverFile(file);
      setCoverPreview(toPreview(file));
    };
    input.click();
  };
  const handleSelectVideo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const maxSize = MAX_VIDEO_MB * 1024 * 1024;
      if (file.size > maxSize) {
        antdMessage.error(
          `Video quá lớn! Tối đa ${MAX_VIDEO_MB}MB (file: ${(
            file.size /
            1024 /
            1024
          ).toFixed(2)}MB)`
        );
        return;
      }
      const validTypes = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ];
      if (!validTypes.includes(file.type)) {
        antdMessage.error("Chỉ chấp nhận file video (MP4, WebM, OGG, MOV)");
        return;
      }
      setVideoFile(file);
      setVideoPreview(toPreview(file));
    };
    input.click();
  };
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      const authorId = loggedInUser?.userId;

      if (!authorId) {
        antdMessage.error("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
        setSubmitting(false);
        return;
      }
      
      const isVideo = false; // Không còn hỗ trợ video riêng, chỉ dùng category
      let videoUrl = isVideo ? values.videoUrl || "" : "";
      if (isVideo && videoFile) {
        const vf = videoFile?.originFileObj || videoFile;
        const hide = antdMessage.loading("Đang upload video...", 0);
        try {
          const res = await uploadToCloudinary(vf, {
            resourceType: "video",
            folder: "course_videos",
            onProgress: setVidProgress,
          });
          videoUrl = res.secure_url;
        } finally {
          hide();
          setVidProgress(0);
        }
      }
      const fd = new FormData();
      if (coverFile) {
        fd.append("coverImage", coverFile);
      }
      const dto = {
        id: editingId || null,
        authorId,
        title: values.title,
        slug: values.slug,
        content: values.content,
        postType: values.postType || "FRONT_END",
        videoUrl,
        status: values.status || "DRAFT",
        createdAt: null,
        updatedAt: null,
      };
      fd.append("post", JSON.stringify(dto));

      const POSTS_URL = "/posts"; // Define URL here for clarity

      if (editingId) {
        await api.put(`${POSTS_URL}/${editingId}`, fd, {
          params: { authorId },
        });
        antdMessage.success("Cập nhật bài viết thành công");
      } else {
        await api.post(POSTS_URL, fd, { params: { authorId } });
        antdMessage.success("Tạo bài viết thành công");
      }
      onComplete();
    } catch (error) {
      if (error?.errorFields) return;
      let msg =
        error?.response?.data?.message ||
        error?.response?.data?.data ||
        error?.response?.data?.error ||
        error?.message ||
        "Lưu bài viết thất bại";
      antdMessage.error(msg);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Modal
      title={editingId ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText={editingId ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      destroyOnClose
      width={700}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="Tiêu đề bài viết" />
        </Form.Item>
        <Form.Item
          name="slug"
          label="Slug"
          rules={[{ required: true, message: "Vui lòng nhập slug" }]}
        >
          <Input placeholder="unique-slug" />
        </Form.Item>
        <Form.Item name="postType" label="Loại bài viết">
          <Select options={POST_TYPES} placeholder="Chọn loại bài viết" />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái">
          <Select options={POST_STATUS} />
        </Form.Item>
        <Form.Item label="Cover Image" required={true}>
          <Button icon={<UploadOutlined />} block onClick={handleSelectCover}>
            {coverFile ? "Thay ảnh" : "Chọn ảnh"}
          </Button>
          {coverFile && (
            <Text
              type="secondary"
              style={{ display: "block", marginTop: 8, fontSize: 12 }}
            >
              {coverFile.name} ({(coverFile.size / 1024 / 1024).toFixed(2)} MB)
            </Text>
          )}
          {(coverPreview || form.getFieldValue("coverUrl")) && (
            <div style={{ marginTop: 12 }}>
              <img
                src={coverPreview || form.getFieldValue("coverUrl")}
                alt="cover preview"
                style={{
                  width: "100%",
                  maxHeight: 280,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #d9d9d9",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
          {imgProgress > 0 && imgProgress < 100 && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Đang upload ảnh: {imgProgress}%</Text>
              <Progress percent={imgProgress} size="small" />
            </div>
          )}
        </Form.Item>
        <Form.Item name="coverUrl" hidden>
          <Input />
        </Form.Item>
        {false && postTypeWatch === "VIDEO" && (
          <>
            <Form.Item label="Video File">
              <Button
                icon={<UploadOutlined />}
                block
                onClick={handleSelectVideo}
              >
                {videoFile ? "Thay video" : "Chọn video"}
              </Button>
              {videoFile && (
                <Text
                  type="secondary"
                  style={{ display: "block", marginTop: 8, fontSize: 12 }}
                >
                  {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)}{" "}
                  MB)
                </Text>
              )}
              {(videoPreview || form.getFieldValue("videoUrl")) && (
                <div style={{ marginTop: 12 }}>
                  <video
                    controls
                    style={{
                      width: "100%",
                      maxHeight: 320,
                      borderRadius: 8,
                      border: "1px solid #d9d9d9",
                    }}
                    src={videoPreview || form.getFieldValue("videoUrl")}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              {vidProgress > 0 && vidProgress < 100 && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    Đang upload video: {vidProgress}%
                  </Text>
                  <Progress percent={vidProgress} size="small" />
                </div>
              )}
            </Form.Item>
            <Form.Item name="videoUrl" hidden>
              <Input />
            </Form.Item>
          </>
        )}
        <Form.Item name="publishedAt" label="Ngày xuất bản">
          <DatePicker
            showTime
            style={{ width: "100%" }}
            format="YYYY-MM-DD HH:mm"
          />
        </Form.Item>
        <Form.Item
          name="content"
          label="Nội dung"
          rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
        >
          <TextEditor
            placeholder="Nhập nội dung bài viết..."
            uploadImage={uploadToCloudinary}
          />
        </Form.Item>
        <div style={{ height: "42px" }}></div>
      </Form>
    </Modal>
  );
};
export default PostFormModal;
