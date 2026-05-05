import React from "react";
import { Modal, Typography, Divider } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import DOMPurify from 'dompurify';

const { Title, Text, Paragraph } = Typography;

export default function LessonDetailModal({ modal, setModal, editing }) {
  // Lấy dữ liệu bài học từ state 'editing'
  const l = editing.lesson;

  return (
    <Modal
      open={modal.viewLesson}
      onCancel={() => setModal((m) => ({ ...m, viewLesson: false }))}
      footer={null}
      title="Chi tiết bài học"
      width={700}
    // Đảm bảo modal được hủy khi đóng để video và nội dung nặng được xóa khỏi DOM
    >
      {l ? (
        <>
          {/* --- PHẦN 1: VIDEO (Hiển thị ngay lập tức nếu có) --- */}
          {l.videoUrl && (
            <div style={{ marginBottom: 16 }}>
              {/* Thẻ video HTML5: Hiển thị video, controls cho phép người dùng điều khiển */}
              <video
                src={l.videoUrl}
                controls
                style={{ width: "100%", borderRadius: 8, backgroundColor: '#000' }}
              />
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8, textAlign: 'center' }}>
                <PlayCircleOutlined /> Video Bài Giảng
              </Text>
              <Divider style={{ margin: '16px 0' }} />
            </div>
          )}

          {/* --- PHẦN 2: TIÊU ĐỀ VÀ MÔ TẢ --- */}
          <Title level={4} style={{ marginBottom: 4 }}>
            {l.title}
          </Title>
          <Text type="secondary">{l.description || "Không có mô tả"}</Text>

          {/* --- PHẦN 3: NỘI DUNG CHI TIẾT --- */}
          <Divider orientation="left" style={{ margin: '16px 0 8px 0' }}>
            <Text strong>Nội dung Chi tiết</Text>
          </Divider>
          <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 12 }}>
            {l.content ? (
              <div
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(l.content) }}
                style={{ whiteSpace: 'pre-wrap' }}
              />
            ) : (
              <Text type="secondary">Không có nội dung chi tiết.</Text>
            )}
          </div>


          {/* --- PHẦN 4: THÔNG SỐ KHÁC --- */}
          <Divider orientation="left" style={{ margin: '16px 0 8px 0' }}>
            <Text strong>Thông số</Text>
          </Divider>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <Text strong>Thời lượng: </Text>
              <Text>{l.durationMinutes || 0} phút</Text>
            </div>
            <div>
              <Text strong>Thứ tự: </Text>
              <Text>{l.orderIndex || 0}</Text>
            </div>
            <div>
              <Text strong>Quiz ID: </Text>
              <Text>{l.quizId ? `#${l.quizId}` : "Không có"}</Text>
            </div>
          </div>
        </>
      ) : (
        <Text>Không có dữ liệu bài học để hiển thị.</Text>
      )}
    </Modal>
  );
}
