import { Col, Row, Button } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import DOMPurify from "dompurify";
import { useEffect, useMemo, useRef, useState } from "react";
import Prism from "prismjs";

// Ngôn ngữ cần highlight
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";

// Plugin line-numbers (tuỳ chọn)
import "prismjs/plugins/line-numbers/prism-line-numbers.css";

// Theme tối chỉ áp dụng cho pre/code của Prism (không ảnh hưởng nền toàn trang)
import "prismjs/themes/prism-tomorrow.css";

// ------------------------------------------------------------------
// Chuyển <pre class="ql-syntax"> (Quill) -> <pre class="line-numbers"><code class="language-xxx">
// ------------------------------------------------------------------
const transformQuillHtmlToPrism = (htmlContent) => {
  if (!htmlContent) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const codeBlocks = doc.querySelectorAll("pre.ql-syntax");

  codeBlocks.forEach((pre) => {
    // Nếu bên trong chỉ là text thuần
    if (
      pre.childNodes.length === 1 &&
      pre.firstChild.nodeType === Node.TEXT_NODE
    ) {
      const code = doc.createElement("code");

      // language default – tuỳ bạn đổi sang python / clike...
      code.className = "language-javascript";
      code.textContent = pre.textContent;

      pre.innerHTML = "";
      pre.appendChild(code);
    }

    // Prism line numbers
    pre.classList.add("line-numbers");
    pre.classList.remove("ql-syntax");
  });

  return doc.body.innerHTML;
};

const CourseDescriptionSection = ({
  showFullDescription: _initialShowFullDescription,
  description,
  content,
  onMarkAsRead,
  isReadingCompleted,
}) => {
  const rawHtml =
    typeof content === "string" && content.trim()
      ? content
      : typeof description === "string"
      ? description
      : "";

  // 1. sanitize HTML
  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } }),
    [rawHtml]
  );

  // 2. convert code block sang dạng Prism
  const prismReadyHtml = useMemo(
    () => transformQuillHtmlToPrism(sanitizedHtml),
    [sanitizedHtml]
  );

  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);

  // 3. highlight code CHỈ trong phần mô tả
  useEffect(() => {
    if (containerRef.current) {
      Prism.highlightAllUnder(containerRef.current);
    }
  }, [prismReadyHtml]);

  // 4. scroll hết mới cho bấm "Đánh dấu đã đọc"
  useEffect(() => {
    if (!bottomRef.current || isReadingCompleted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setHasReachedBottom(true);
        }
      },
      { root: null, threshold: 0.1 }
    );

    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [isReadingCompleted]);

  const disabledButton =
    !onMarkAsRead || isReadingCompleted || !hasReachedBottom;

  return (
    <Row
      className="course-description-section"
      style={{ width: "100%", padding: 24, background: "#f9fafb" }}
    >
      <Col span={24}>
        {/* Tiêu đề section */}
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            margin: "0 0 16px",
            color: "#111827",
          }}
        >
          Mô tả
        </h2>

        {/* Nội dung mô tả (nền sáng, chỉ code mới nền đen theo Prism theme) */}
        <div
          ref={containerRef}
          className="description-content"
          style={{
            background: "#ffffff",
            color: "#111827",
            padding: 16,
            borderRadius: 12,
            fontSize: 14,
            lineHeight: 1.6,
          }}
          dangerouslySetInnerHTML={{ __html: prismReadyHtml }}
        />

        {/* sentinel để detect user đã cuộn tới đáy */}
        <div ref={bottomRef} style={{ height: 1 }} />

        {/* Nút Đánh dấu đã đọc – cuối trang, góc phải */}
        {onMarkAsRead && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              type={isReadingCompleted ? "primary" : "default"}
              icon={isReadingCompleted ? <CheckOutlined style={{ color: "#ffffff" }} /> : null}
              onClick={onMarkAsRead}
              disabled={disabledButton}
              style={{
                backgroundColor: isReadingCompleted ? "#FF6B35" : "transparent",
                borderColor: "#FF6B35",
                color: isReadingCompleted ? "#ffffff" : "#FF6B35",
                borderRadius: isReadingCompleted ? "2" : undefined
              }}
            >
              {isReadingCompleted
                ? "Đã đọc xong"
                : hasReachedBottom
                ? "Đánh dấu đã đọc"
                : "Cuộn xuống hết để đánh dấu"}
            </Button>
          </div>
        )}
      </Col>
    </Row>
  );
};

CourseDescriptionSection.propTypes = {
  showFullDescription: PropTypes.bool.isRequired,
  description: PropTypes.string,
  content: PropTypes.string,
  onMarkAsRead: PropTypes.func,
  isReadingCompleted: PropTypes.bool,
};

export default CourseDescriptionSection;
