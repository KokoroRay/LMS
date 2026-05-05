import React from "react";
import { Button, Typography, Space, Tag } from "antd";
import { useNavigate } from "react-router-dom";
const { Title, Paragraph, Text } = Typography;

export default function QuizStatusView({
  kind = "not_started", 
  minutesLeft = 90,    
}) {
  const navigate = useNavigate();

  const configs = {
    not_started: {
      title: "Chưa tới thời gian thi",
      subtitle: "Bạn hãy bình tĩnh đợi tới giờ để bắt đầu nhé!",
      btn: "Về trang chủ",
      img: "/images/status/comeearly.png",
      bubble: "Đợi chút nha! Sắp tới giờ rồi!",
      showTimer: true,
    },
    ended: {
      title: "Bài thi đã kết thúc!",
      subtitle: "Bài thi đã kết thúc, hẹn gặp lại bạn trong đợt thi tiếp theo.",
      btn: "Về trang chủ",
      img: "/images/status/testend.png",
      bubble: "Hết giờ, kết thúc rồi!",
    },
    submitted: {
      title: "Bạn đã làm bài thi rồi!",
      subtitle: "Bạn đã nộp bài. Hãy quay lại trang chủ để xem thông tin khác nhé.",
      btn: "Về trang chủ",
      img: "/images/status/testdone.png",
      bubble: "Bạn đã hoàn thành bài thi!",
    },
  };

  const c = configs[kind];

  return (
    <div style={{ maxWidth: 960, margin: "24px auto 40px", padding: "0 24px" }}>
      <div style={{ textAlign: "center", marginTop: 24 }}>

        <div style={{ display: "inline-block" }}>
          <img
            src={c.img}
            alt={c.title}
            width={305}
            height={350}
            style={{ objectFit: "contain" }}
          />
        </div>

        <Title level={3} style={{ marginTop: 12 }}>{c.title}</Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          {c.subtitle}
        </Paragraph>

        {c.showTimer && (
          <Space style={{ marginBottom: 16 }}>
            <Tag
              color="default"
              style={{ borderRadius: 999, padding: "6px 14px", fontWeight: 600 }}
            >
              {String(minutesLeft).padStart(2, "0")}:00
            </Tag>
          </Space>
        )}

        <div>
          <Button
            type="primary"
            onClick={() => navigate("/")}
            style={{ borderRadius: 8 }}
          >
            {c.btn}
          </Button>
        </div>
      </div>
    </div>
  );
}
