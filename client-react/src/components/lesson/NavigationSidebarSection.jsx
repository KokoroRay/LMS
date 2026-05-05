// src/components/lesson/NavigationSidebarSection.jsx

import {
  CheckCircleFilled,
  PlayCircleOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LockOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Col, Row, Typography, Collapse, Button, Tooltip } from "antd";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;
const { Panel } = Collapse;

/* ================== Styles & Config ================== */

const COLORS = {
  PRIMARY: "#F37142",      // Màu cam chủ đạo
  GREEN: "#00C58A",        // Màu xanh lá checkmark (giống hình)
  GRAY_ICON: "#595959",    // Màu icon mặc định
  TEXT: "#292929",
  SUB_TEXT: "#8c8c8c",
  BG_ACTIVE: "#fff6f3",    // Nền cam nhạt khi active
  HOVER: "#fafafa",
  LOCKED: "#d9d9d9",
};

const WORK_ITEM_TYPES = {
  VIDEO: "video",
  READINGS: "readings",
  HOMEWORK: "homework",
  QUIZ: "quiz",
};

// Helper xác định loại bài học
const getLessonType = (l) => {
  const t = (l?.lessonType || "").toLowerCase();
  if (t && Object.values(WORK_ITEM_TYPES).includes(t)) return t;
  if (l?.videoUrl) return WORK_ITEM_TYPES.VIDEO;
  return WORK_ITEM_TYPES.READINGS;
};

// Mapping Icon và Label dựa trên loại
const getTypeConfig = (type) => {
  switch (type) {
    case WORK_ITEM_TYPES.VIDEO:
      return { label: "Video", icon: <PlayCircleOutlined /> };
    case WORK_ITEM_TYPES.READINGS:
      return { label: "Bài đọc", icon: <FileTextOutlined /> }; // Dùng icon File giống hình
    case WORK_ITEM_TYPES.QUIZ:
      return { label: "Quiz", icon: <ThunderboltOutlined /> };
    case WORK_ITEM_TYPES.HOMEWORK:
      return { label: "Bài tập", icon: <QuestionCircleOutlined /> };
    default:
      return { label: "Bài học", icon: <FileTextOutlined /> };
  }
};

const durationText = (lesson) => {
  if (typeof lesson?.durationMinutes === "number")
    return `${lesson.durationMinutes} phút`;
  // Nếu API trả về string dạng "10:34" thì hiển thị luôn, nếu không thì ẩn
  return lesson?.duration || ""; 
};

/* ================== Shared Row Item Component ================== */

/**
 * Component hiển thị 1 dòng (Lesson, Quiz hoặc Assignment)
 * Thiết kế phẳng, icon bên trái, active có border-left màu cam
 */
const ItemRow = ({
  title,
  subTitle, // VD: Video • 10:34
  icon,
  active,
  isCompleted,
  isLocked,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      onMouseEnter={() => !isLocked && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 12px",
        cursor: isLocked ? "not-allowed" : "pointer",
        backgroundColor: active ? COLORS.BG_ACTIVE : isHovered ? COLORS.HOVER : "transparent",
        borderLeft: active ? `3px solid ${COLORS.PRIMARY}` : "3px solid transparent", // Thanh cam bên trái
        transition: "all 0.2s ease",
        marginBottom: 2,
      }}
    >
      {/* Cột Icon */}
      <div
        style={{
          marginRight: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isLocked ? (
          <LockOutlined style={{ fontSize: 20, color: COLORS.LOCKED }} />
        ) : isCompleted ? (
          // Icon check xanh lá đặc trưng
          <CheckCircleFilled style={{ fontSize: 20, color: COLORS.GREEN }} />
        ) : (
          // Icon thường (màu xám hoặc cam nếu active)
          <span style={{ fontSize: 20, color: active ? COLORS.PRIMARY : COLORS.GRAY_ICON }}>
            {icon}
          </span>
        )}
      </div>

      {/* Cột Nội dung */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Text
          ellipsis={{ tooltip: title }}
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: active ? 600 : 400,
            color: isLocked ? COLORS.LOCKED : active ? COLORS.PRIMARY : COLORS.TEXT,
            lineHeight: "1.3",
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        
        {/* Subtext: Video • 10:34 */}
        {!isLocked && (
          <Text
            style={{
              fontSize: 12,
              color: COLORS.SUB_TEXT,
              display: "block",
            }}
          >
            {subTitle}
          </Text>
        )}
      </div>
    </div>
  );
};

/* ================== Main Component ================== */

export default function NavigationSidebarSection({
  isSidebarCollapsed,
  toggleSidebar,
  mobile = false,
  currentLessonId,
  currentType,
  courseId,
  sessions = [],
  completedWorkItems = [],
  flatWorkItems = [],
  submittedAssignmentIds = [],
}) {
  const navigate = useNavigate();
  const [activeSessionKey, setActiveSessionKey] = useState([]);

  // Tự động mở session chứa bài học hiện tại
  useEffect(() => {
    if (!sessions || sessions.length === 0) return;
    if (currentLessonId) {
      const foundSession = sessions.find(
        (s) =>
          s.lessons?.some((l) => String(l.lessonId) === String(currentLessonId)) ||
          s.assignments?.some((a) => String(a.assignmentId) === String(currentLessonId))
      );
      if (foundSession) {
        setActiveSessionKey([`session-${foundSession.sessionId}`]);
      } else {
        // Mặc định mở session đầu tiên
        setActiveSessionKey([`session-${sessions[0]?.sessionId}`]);
      }
    }
  }, [sessions, currentLessonId]);

  // Logic kiểm tra khóa bài học - giờ chỉ dựa vào completedWorkItems
  const isItemLocked = (itemKey, itemIndex) => {
    if (itemIndex <= 0) return false;
    const previousItem = flatWorkItems[itemIndex - 1];
    const requiredKey = previousItem?.key;

    if (!requiredKey) return true;
    if (completedWorkItems.includes(requiredKey)) return false;

    // Check bài tập đã nộp chưa
    if (previousItem?.type === WORK_ITEM_TYPES.HOMEWORK) {
      const prevId = previousItem.assignmentId ? String(previousItem.assignmentId) : String(previousItem.lessonId || "");
      if (prevId && submittedAssignmentIds.includes(prevId)) return false;
    }
    return true;
  };

  // Hàm điều hướng
  const handleNavigate = (id, type, title) => {
    // Logic map loại bài tập về quiz hoặc homework nếu cần
    // Ở đây giữ nguyên logic gốc của bạn
    navigate(`/lesson/${courseId}/${id}/${type}`, { state: { lessonTitle: title } });
  };

  /* --- Render Blocks --- */

  const renderLessonBlock = (lesson, idx) => {
    const type = getLessonType(lesson);
    const config = getTypeConfig(type);
    const lessonId = String(lesson?.lessonId ?? idx);
    
    const lessonKey = `${lessonId}-${type}`;
    const flatIndex = flatWorkItems.findIndex((item) => item.key === lessonKey);
    const locked = isItemLocked(lessonKey, flatIndex);
    const completed = completedWorkItems.includes(lessonKey);
    const active = String(currentLessonId) === lessonId && currentType === type;

    const duration = durationText(lesson);
    const subTitle = duration ? `${config.label} • ${duration}` : config.label;

    return (
      <div key={lessonKey}>
        <ItemRow
          title={lesson?.title || `Lesson ${idx + 1}`}
          subTitle={subTitle}
          icon={config.icon}
          active={active}
          isCompleted={completed}
          isLocked={locked}
          onClick={() => handleNavigate(lessonId, type, lesson?.title)}
        />

        {/* Render Quizzes con nếu có */}
        {Array.isArray(lesson?.quizzes) && lesson.quizzes.length > 0 && (
          renderQuizBlock(lesson, idx)
        )}
      </div>
    );
  };

  const renderQuizBlock = (lesson, idx) => {
    const lessonId = String(lesson?.lessonId);
    const quizKey = `${lessonId}-${WORK_ITEM_TYPES.QUIZ}`;
    const flatIndex = flatWorkItems.findIndex((item) => item.key === quizKey);
    const locked = isItemLocked(quizKey, flatIndex);
    const completed = completedWorkItems.includes(quizKey);
    const active = String(currentLessonId) === lessonId && currentType === WORK_ITEM_TYPES.QUIZ;
    const count = lesson.quizzes.length;

    return (
      <ItemRow
        key={quizKey}
        title={`[Quiz] ${lesson?.title}`}
        subTitle={`Bài kiểm tra • ${count} câu hỏi`}
        icon={<ThunderboltOutlined />}
        active={active}
        isCompleted={completed}
        isLocked={locked}
        onClick={() => handleNavigate(lessonId, WORK_ITEM_TYPES.QUIZ, lesson?.title)}
      />
    );
  };

  const renderAssignmentBlock = (assignment, idx, sessionId) => {
    const id = String(assignment?.assignmentId ?? `a-${sessionId}-${idx}`);
    const key = `${id}-${WORK_ITEM_TYPES.HOMEWORK}-session`;
    const flatIndex = flatWorkItems.findIndex((item) => item.key === key);
    const locked = isItemLocked(key, flatIndex);
    const completed = completedWorkItems.includes(key);
    const submitted = submittedAssignmentIds.includes(id);
    const active = String(currentLessonId) === id && currentType === WORK_ITEM_TYPES.HOMEWORK;
    
    const duration = assignment?.estimatedMinutes ? `${assignment.estimatedMinutes} phút` : "10 phút";

    return (
      <ItemRow
        key={key}
        title={assignment?.title || "Bài tập về nhà"}
        subTitle={`Bài tập • ${duration}`}
        icon={<QuestionCircleOutlined />} // Hoặc icon <ContainerOutlined />
        active={active}
        isCompleted={completed || submitted}
        isLocked={locked}
        onClick={() => handleNavigate(id, WORK_ITEM_TYPES.HOMEWORK, assignment?.title)}
      />
    );
  };

  return (
    <div
      className={`navigation-sidebar-section ${mobile ? "is-mobile" : ""}`}
      style={{ background: "#fff", height: "100%", borderRight: "1px solid #f0f0f0" }}
    >
      {/* --- Header --- */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {!isSidebarCollapsed && (
          // Tiêu đề màu cam đậm giống hình
          <Title level={5} style={{ margin: 0, color: COLORS.PRIMARY, fontWeight: 700 }}>
             Danh sách bài học
          </Title>
        )}
        <Tooltip title={isSidebarCollapsed ? "Mở rộng" : "Thu gọn"}>
          <Button
            type="text"
            icon={isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            style={{ color: COLORS.PRIMARY, fontSize: 18 }}
          />
        </Tooltip>
      </div>

      {/* --- Content --- */}
      {(!isSidebarCollapsed || mobile) && (
        <div style={{ paddingBottom: 20 }}>
          {sessions.length > 0 ? (
            <Collapse
              activeKey={activeSessionKey}
              onChange={setActiveSessionKey}
              ghost // Loại bỏ khung border mặc định của Antd Collapse
              expandIconPosition="end"
            >
              {sessions.map((s, i) => {
                const sessionTitle = s?.title || `Session ${i + 1}`;
                return (
                  <Panel
                    key={`session-${s?.sessionId ?? i}`}
                    header={
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#000" }}>
                        {sessionTitle}
                      </span>
                    }
                    style={{ borderBottom: "none" }} // Xóa gạch chân giữa các session nếu muốn
                  >
                    {/* Danh sách bài học */}
                    <div style={{ marginTop: -8 }}>
                      {s.lessons?.map((l, idx) => renderLessonBlock(l, idx))}
                      
                      {/* Danh sách bài tập session */}
                      {s.assignments?.length > 0 && (
                         <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #eee" }}>
                            {s.assignments.map((a, idx) => renderAssignmentBlock(a, idx, s.sessionId))}
                         </div>
                      )}
                    </div>
                  </Panel>
                );
              })}
            </Collapse>
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: COLORS.SUB_TEXT }}>
              Chưa có bài học
            </div>
          )}
        </div>
      )}
    </div>
  );
}

NavigationSidebarSection.propTypes = {
  isSidebarCollapsed: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  mobile: PropTypes.bool,
  currentLessonId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currentType: PropTypes.string,
  courseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sessions: PropTypes.array,
  completedWorkItems: PropTypes.array,
  flatWorkItems: PropTypes.array,
  submittedAssignmentIds: PropTypes.array,
};