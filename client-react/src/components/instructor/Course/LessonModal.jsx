import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Button,
  Divider,
  message,
  Typography,
  Upload,
} from "antd";
import { InboxOutlined, PlayCircleOutlined } from "@ant-design/icons";
import {
  createLessonWithVideo,
  updateLessonWithVideo,
  deleteLesson,
  getVideoStreamingUrl,
  refreshVideoStreamingUrl,
} from "../../../services/lessonService";

import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "highlight.js/styles/atom-one-dark.css";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
import java from "highlight.js/lib/languages/java";
import cssLang from "highlight.js/lib/languages/css";
import { message as antdMessage } from "antd";

import { uploadToCloudinary } from "../../../utils/cloudinaryUploader";
import { fixQuillContent } from "../../../utils/helpers";
import "../../../styles/texteditor.css";

const { Dragger } = Upload;
const { Text } = Typography;
const { TextArea } = Input;

/* ---------------- HIGHLIGHT.JS + QUILL CONFIG ---------------- */

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("java", java);
hljs.registerLanguage("css", cssLang);

const Syntax = Quill.import("modules/syntax");
Quill.register(Syntax, true);

// align style
const AlignStyle = Quill.import("attributors/style/align");
Quill.register(AlignStyle, true);

// block DIV
const Block = Quill.import("blots/block");
class Div extends Block {}
Div.tagName = "DIV";
Quill.register(Div, true);

// block P
const Paragraph = Quill.import("blots/block");
class P extends Paragraph {}
P.tagName = "P";
Quill.register(P, true);

// formats
const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "video",
  "align",
  "code-block",
];

/** Handler upload ảnh vào Cloudinary và chèn vào Quill */
function imageHandler(quillRef) {
  const quill = quillRef.current?.getEditor();
  if (!quill) {
    antdMessage.error("Editor không khởi tạo.");
    return;
  }

  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("accept", "image/*");
  input.click();

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    const range = quill.getSelection(true);
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      antdMessage.error(`Ảnh nhúng quá lớn! Tối đa ${MAX_SIZE_MB}MB`);
      return;
    }

    const hide = antdMessage.loading(`Đang upload ảnh: ${file.name}...`, 0);
    try {
      const result = await uploadToCloudinary(file, {
        resourceType: "image",
        folder: "post_content_images", // nếu muốn riêng cho lesson thì đổi thành "lesson_content_images"
      });
      const url = result.secure_url;
      quill.insertEmbed(range.index, "image", url, Quill.sources.USER);
      quill.setSelection(range.index + 1, Quill.sources.SILENT);
    } catch (error) {
      antdMessage.error("Upload ảnh thất bại: " + error.message);
    } finally {
      hide();
    }
  };
}

export default function LessonModal({
  modal,
  setModal,
  editing,
  setEditing,
  context,
  loadStructure,
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [streamingUrl, setStreamingUrl] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [content, setContent] = useState("");

  const open = modal.lesson;
  const current = editing.lesson;
  const sessionId = context.sessionId;

  const quillRef = useRef(null);

  // modules cho Quill (toolbar + syntax + handler image)
  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [
            { align: "" },
            { align: "center" },
            { align: "right" },
            { align: "justify" },
          ],
          [
            { list: "ordered" },
            { list: "bullet" },
            { indent: "-1" },
            { indent: "+1" },
          ],
          ["link", "image", "video", "code-block"],
          ["clean"],
        ],
        handlers: {
          image: () => imageHandler(quillRef),
        },
      },
      clipboard: {
        matchVisual: false,
      },
      keyboard: {
        bindings: {},
      },
      syntax: {
        highlight: (text) => hljs.highlightAuto(text).value,
        checkBeforeCreate: true,
      },
    }),
    []
  );

  useEffect(() => {
    if (open) {
      form.resetFields();
      setUploadFile(null);
      setStreamingUrl(null);

      const quizIdValue = current?.quizId ? current.quizId : undefined;
      const fixedContent = fixQuillContent(current?.content || "");

      if (current) {
        form.setFieldsValue({
          title: current?.title ?? "",
          description: current?.description ?? "",
          quizId: quizIdValue,
          durationMinutes: current?.durationMinutes ?? 0,
          quizDurationMinutes: current?.quizDurationMinutes ?? undefined,
        });
        setContent(fixedContent);
      } else {
        form.setFieldsValue({
          title: "",
          description: "",
          quizId: undefined,
          durationMinutes: 0,
          quizDurationMinutes: undefined,
        });
        setContent("");
      }
    }
  }, [open, current, form]);

  const submit = async (values) => {
    const orderIndex =
      current?.lessonId || current?.lessonId === 0
        ? current.orderIndex
        : context.lessonCount;

    const dto = {
      sessionId,
      title: values.title?.trim(),
      description: values.description ?? null,
      content: content || "",
      quizId: values.quizId ? Number(values.quizId) : null,
      durationMinutes: values.durationMinutes
        ? Number(values.durationMinutes)
        : null,
      orderIndex: orderIndex ? Number(orderIndex) : 0,
      quizDurationMinutes: values.quizDurationMinutes
        ? Number(values.quizDurationMinutes)
        : null,
    };

    if (current?.lessonId && current.videoUrl && !uploadFile) {
      dto.videoUrl = current.videoUrl;
    }

    try {
      setSaving(true);
      const hide = uploadFile
        ? message.loading("Đang upload video", 0)
        : null;

      try {
        if (current?.lessonId) {
          await updateLessonWithVideo(current.lessonId, dto, uploadFile);
          message.success("Cập nhật bài học thành công");
          setEditing({});
        } else {
          await createLessonWithVideo(dto, uploadFile);
          message.success("Tạo bài học thành công");
        }
      } finally {
        if (hide) hide();
      }

      setModal((m) => ({ ...m, lesson: false }));
      loadStructure();
    } catch (e) {
      message.error(e?.message || "Lưu bài học thất bại");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await deleteLesson(current.lessonId);
      message.success("Đã xoá bài học");
      setModal((m) => ({ ...m, lesson: false }));
      setEditing({});
      loadStructure();
    } catch {
      message.error("Xoá bài học thất bại");
    }
  };

  const uploadProps = {
    multiple: false,
    maxCount: 1,
    accept: "video/*",
    beforeUpload: (file) => {
      setUploadFile(file);
      return false;
    },
    onRemove: () => setUploadFile(null),
    fileList: uploadFile ? [uploadFile] : [],
  };

  return (
    <Modal
      open={open}
      title={current ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
      onCancel={() => setModal((m) => ({ ...m, lesson: false }))}
      onOk={() => form.submit()}
      confirmLoading={saving}
      destroyOnClose
      width={760}
      footer={
        <Space>
          {current?.lessonId && (
            <Button danger onClick={remove} disabled={saving}>
              Xoá
            </Button>
          )}
          <Button
            onClick={() => setModal((m) => ({ ...m, lesson: false }))}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            {current ? "Cập nhật" : "Tạo mới"}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: "Nhập tiêu đề" }]}
        >
          <Input maxLength={255} showCount placeholder="VD: Form & Table" />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <TextArea rows={3} maxLength={500} showCount placeholder="Tóm tắt" />
        </Form.Item>

        {/* Editor chèn trực tiếp (ReactQuill + Cloudinary + highlight) */}
        <Form.Item label="Nội dung bài học">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={(html) => setContent(html)}
            modules={quillModules}
            formats={formats}
            placeholder="Nhập nội dung bài học..."
            style={{ height: "300px", marginBottom: "42px" }}
          />
        </Form.Item>

        {/* <Space style={{ width: "100%" }} size={16}>
          <Form.Item
            label="Thời lượng Video/Đọc (phút)"
            name="durationMinutes"
            style={{ flex: 1 }}
          >
            <InputNumber min={0} max={10000} style={{ width: "100%" }} />
          </Form.Item>
        </Space> */}

        {/* Hàng 2: Thông tin về Quiz */}
        <Space style={{ width: "100%" }} size={16}>
          {/* <Form.Item
            label="Quiz ID (Tùy chọn)"
            name="quizId"
            style={{ flex: 1 }}
          >
            <InputNumber
              min={0}
              max={999999}
              style={{ width: "100%" }}
              placeholder="Nhập ID để bật Quiz"
            />
          </Form.Item> */}
          <Form.Item
            label="Thời lượng Quiz (phút)"
            name="quizDurationMinutes"
            style={{ flex: 1 }}
            tooltip="Thời gian làm bài quiz (mặc định là 10 nếu bỏ trống)"
          >
            <InputNumber
              min={0}
              max={180}
              style={{ width: "100%" }}
              placeholder="VD: 15, 30, 45, 90"
            />
          </Form.Item>
        </Space>

        <Divider style={{ margin: "16px 0" }} />

        <Form.Item label="Video (tùy chọn)">
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kéo thả hoặc chọn file video</p>
            <p className="ant-upload-hint" style={{ fontSize: 12 }}>
              MP4/AVI/MOV/WMV/FLV/WEBM (tối đa 3GB, upload lên Azure Storage)
            </p>
          </Dragger>
        </Form.Item>

        {current?.videoUrl && !uploadFile && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Video hiện tại:
            </Text>

            {loadingVideo ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 100,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 8,
                  marginTop: 8,
                }}
              >
                <Space>
                  <PlayCircleOutlined style={{ fontSize: 20 }} />
                  <Text type="secondary">Đang tải video preview...</Text>
                </Space>
              </div>
            ) : streamingUrl ? (
              <video
                src={streamingUrl}
                controls
                style={{ width: "100%", borderRadius: 8, marginTop: 8 }}
                onError={async (e) => {
                  console.error("Video playback error:", e);
                  message.warning("Link video hết hạn. Đang tạo link mới...");
                  try {
                    const refreshData = await refreshVideoStreamingUrl(
                      current.lessonId
                    );
                    if (refreshData?.newStreamingUrl) {
                      setStreamingUrl(refreshData.newStreamingUrl);
                      message.success(
                        "Đã tạo link video mới. Vui lòng thử lại."
                      );
                    } else {
                      setStreamingUrl(null);
                      message.error("Không thể tạo link video mới.");
                    }
                  } catch (error) {
                    setStreamingUrl(null);
                    message.error(
                      "Lỗi khi làm mới link video: " + error.message
                    );
                  }
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 100,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 8,
                  marginTop: 8,
                  cursor: "pointer",
                  border: "1px dashed #d9d9d9",
                }}
                onClick={async () => {
                  setLoadingVideo(true);
                  try {
                    const videoData = await getVideoStreamingUrl(
                      current.lessonId
                    );
                    if (videoData?.streamingUrl) {
                      setStreamingUrl(videoData.streamingUrl);
                    } else {
                      setStreamingUrl(null);
                      message.error("Không thể tạo link xem video.");
                    }
                  } catch (error) {
                    setStreamingUrl(null);
                    message.error(
                      "Lỗi khi tạo link xem video: " + error.message
                    );
                  } finally {
                    setLoadingVideo(false);
                  }
                }}
              >
                <Space direction="vertical" style={{ textAlign: "center" }}>
                  <PlayCircleOutlined
                    style={{ fontSize: 24, color: "#1890ff" }}
                  />
                  <Text type="secondary">Click để xem video preview</Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>
                    (Azure Blob Storage)
                  </Text>
                </Space>
              </div>
            )}

            {streamingUrl && (
              <Space style={{ marginTop: 8 }}>
                <Button
                  size="small"
                  type="text"
                  onClick={async () => {
                    setLoadingVideo(true);
                    try {
                      const refreshData = await refreshVideoStreamingUrl(
                        current.lessonId
                      );
                      if (refreshData?.newStreamingUrl) {
                        setStreamingUrl(refreshData.newStreamingUrl);
                        message.success("Đã làm mới link video thành công!");
                      } else {
                        message.error("Không thể làm mới link video.");
                      }
                    } catch (error) {
                      message.error("Lỗi khi làm mới link: " + error.message);
                    } finally {
                      setLoadingVideo(false);
                    }
                  }}
                  disabled={saving || loadingVideo}
                >
                  🔄 Làm mới link video
                </Button>
              </Space>
            )}

            <Button
              size="small"
              danger
              type="text"
              onClick={() => {
                Modal.confirm({
                  title: "Xác nhận xóa video",
                  content:
                    "Bạn có chắc muốn xóa video hiện tại khỏi bài học này?",
                  okText: "Xóa",
                  okButtonProps: { danger: true },
                  cancelText: "Hủy",
                  onOk: async () => {
                    try {
                      setSaving(true);
                      const formValues = form.getFieldsValue();
                      const dtoToUpdate = {
                        sessionId: current.sessionId,
                        title: formValues.title?.trim(),
                        description: formValues.description ?? null,
                        content: content || "",
                        durationMinutes: formValues.durationMinutes
                          ? Number(formValues.durationMinutes)
                          : null,
                        orderIndex: current.orderIndex,
                        quizId: formValues.quizId
                          ? Number(formValues.quizId)
                          : null,
                        quizDurationMinutes: formValues.quizDurationMinutes
                          ? Number(formValues.quizDurationMinutes)
                          : null,
                        videoUrlString: null,
                      };
                      await updateLessonWithVideo(
                        current.lessonId,
                        dtoToUpdate,
                        null
                      );
                      message.success("Đã xóa video khỏi bài học.");
                      setEditing((e) => ({
                        ...e,
                        lesson: { ...e.lesson, videoUrl: null },
                      }));
                      setStreamingUrl(null);
                      loadStructure();
                    } catch (error) {
                      message.error(error?.message || "Xóa video thất bại.");
                    } finally {
                      setSaving(false);
                    }
                  },
                });
              }}
              style={{ marginTop: 4 }}
              disabled={saving}
            >
              Xóa Video Hiện Tại
            </Button>
          </div>
        )}
      </Form>
    </Modal>
  );
}
