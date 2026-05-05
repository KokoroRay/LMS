import React, {
  useMemo,
  useRef,
  useCallback,
  useEffect,
  useState,
} from "react"; // Thêm useState
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "highlight.js/styles/atom-one-dark.css";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
import java from "highlight.js/lib/languages/java";
import css from "highlight.js/lib/languages/css";
import { message as antdMessage } from "antd";
import "../../../styles/texteditor.css"; // Giữ nguyên import CSS

// --- QUẢN LÝ HIGHLIGHT.JS ---
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("java", java);
hljs.registerLanguage("css", css);

const Syntax = Quill.import("modules/syntax");
Quill.register(Syntax, true);

// --- QUẢN LÝ FORMAT CƠ BẢN ---
const AlignStyle = Quill.import("attributors/style/align");
Quill.register(AlignStyle, true);
const Header = Quill.import("formats/header");
Quill.register(Header, true);
const Block = Quill.import("blots/block");
class Div extends Block {}
Div.tagName = "DIV";
Quill.register(Div, true);
const Paragraph = Quill.import("blots/block");
class P extends Paragraph {}
P.tagName = "P";
Quill.register(P, true);

// --- IMAGE UPLOADER HANDLER (Giữ nguyên) ---
function imageHandler(quillRef, uploadImageFn) {
  const quill = quillRef.current.getEditor();
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
      const result = await uploadImageFn(file, {
        resourceType: "image",
        folder: "post_content_images",
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

// --- FORMATS CỦA EDITOR (Giữ nguyên) ---
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

// --- TEXT EDITOR COMPONENT ---
const TextEditor = ({ value, onChange, placeholder, uploadImage }) => {
  const quillRef = useRef(null);
  const [internalValue, setInternalValue] = useState(value || "");
  const isComposing = useRef(false);

  // Sync internal state if the external value prop changes (e.g., form reset)
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value || "");
    }
  }, [value]);

  const customImageHandler = useCallback(() => {
    imageHandler(quillRef, uploadImage);
  }, [uploadImage]);

  const modules = useMemo(
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
          image: uploadImage ? customImageHandler : null,
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
    [customImageHandler, uploadImage]
  );

  const handleChange = (content, delta, source, editor) => {
    const html = editor.getHTML();
    setInternalValue(html); // Always update internal state

    if (onChange && !isComposing.current) {
      onChange(html); // Propagate changes if not composing
    }
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
    // After composition ends, ensure the parent has the latest value
    if (onChange && quillRef.current) {
      onChange(quillRef.current.getEditor().getHTML());
    }
  };

  return (
    <ReactQuill
      ref={quillRef}
      theme="snow"
      value={internalValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      style={{ height: "300px", marginBottom: "42px" }}
    />
  );
};
export default TextEditor;
