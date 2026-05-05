import React, { useState, useEffect } from "react";
import { Modal, Table, Button, Tag, message, Spin } from "antd";
import {
  ArrowRightOutlined,
  LockOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  RedoOutlined,
  CheckCircleOutlined,
  BookOutlined,
  CalendarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { getAllExamsForStudent } from "../../services/examService";
import dayjs from "dayjs";
import "../../styles/quizModal.css";

const formatSlotTime = (dateTime) => {
  if (!dateTime) return { date: "N/A", time: "N/A" };
  const d = dayjs(dateTime);
  return { date: d.format("DD/MM/YYYY"), time: d.format("HH:mm") };
};

const getSlotDisplayInfo = (slot, exam) => {
  const now = dayjs();
  const slotTime = dayjs(slot.slotTime);
  const slotEndTime = slotTime.add(exam.durationMinutes, "minute");

  if (exam.hasSubmitted) {
    if (exam.studentAttempts < exam.maxAttempts) {
      if (now.isAfter(slotTime) && now.isBefore(slotEndTime)) {
        return {
          text: "Thi lại",
          disabled: false,
          icon: <RedoOutlined />,
          kind: "retake",
        };
      } else {
        if (now.isBefore(slotTime)) {
          return {
            text: "Chưa tới giờ",
            disabled: true,
            icon: <ClockCircleOutlined />,
            kind: "upcoming_retake",
          };
        } else {
          return {
            text: "Đã kết thúc",
            disabled: true,
            icon: <LockOutlined />,
            kind: "finished_retake",
          };
        }
      }
    } else {
      return {
        text: "Đã làm bài",
        disabled: true,
        icon: <CheckOutlined />,
        kind: "submitted_final",
      };
    }
  } else if (now.isBefore(slotTime)) {
    return {
      text: "Chưa tới giờ",
      disabled: true,
      icon: <ClockCircleOutlined />,
      kind: "upcoming",
    };
  } else if (now.isAfter(slotEndTime)) {
    return {
      text: "Đã kết thúc",
      disabled: true,
      icon: <LockOutlined />,
      kind: "finished",
    };
  } else {
    return {
      text: "Vào thi",
      disabled: false,
      icon: <ArrowRightOutlined />,
      kind: "active",
    };
  }
};

export default function QuizSessionsModal({ open, onClose }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setLoading(true);
      getAllExamsForStudent()
        .then((resp) => {
          const allSlots = [];
          const addedKeys = new Set();
          const exams = resp.data?.data || [];
          exams.forEach((exam) => {
            if (exam.examSlots && exam.examSlots.length > 0) {
              exam.examSlots.forEach((slot) => {
                const { date, time } = formatSlotTime(slot.slotTime);
                const displayInfo = getSlotDisplayInfo(slot, exam);

                let displayTime = time;
                if (slot.slotTime && exam.durationMinutes) {
                  const slotStartTime = dayjs(slot.slotTime);
                  const slotEndTime = slotStartTime.add(
                    exam.durationMinutes,
                    "minute"
                  );
                  displayTime = `${slotStartTime.format(
                    "HH:mm"
                  )} - ${slotEndTime.format("HH:mm")}`;
                }
                const key = `${exam.examId}-${slot.slotId}`;
                if (!addedKeys.has(key)) {
                  allSlots.push({
                    key: key,
                    examId: exam.examId,
                    slotId: slot.slotId,
                    subject: exam.className || "N/A",
                    exam: exam.title,
                    date: date,
                    time: displayTime,
                    sortableTime: slot.slotTime,
                    buttonText: displayInfo.text,
                    disabled: displayInfo.disabled,
                    icon: displayInfo.icon,
                    kind: displayInfo.kind,
                  });
                  addedKeys.add(key);
                }
              });
            } else {
              const startTime = exam.startTime ? dayjs(exam.startTime) : null;
              const endTime = exam.endTime ? dayjs(exam.endTime) : null;
              const now = dayjs();

              let buttonText = "Vào thi";
              let disabled = false;
              let icon = <ArrowRightOutlined />;
              let kind = "active";

              if (exam.hasSubmitted) {
                buttonText = "Đã hoàn thành";
                disabled = true;
                icon = <CheckCircleOutlined />;
                kind = "submitted_final";
              } else if (endTime && now.isAfter(endTime)) {
                buttonText = "Đã kết thúc";
                disabled = true;
                icon = <LockOutlined />;
                kind = "finished";
              } else if (startTime && now.isBefore(startTime)) {
                buttonText = "Chưa bắt đầu";
                disabled = true;
                icon = <ClockCircleOutlined />;
                kind = "upcoming";
              }
              const key = `exam-${exam.examId}`;
              if (!addedKeys.has(key)) {
                allSlots.push({
                  key: key,
                  examId: exam.examId,
                  slotId: null,
                  subject: exam.className || "N/A",
                  exam: exam.title,
                  date: startTime ? startTime.format("DD/MM/YYYY") : "N/A",
                  time:
                    startTime && endTime
                      ? `${startTime.format("HH:mm")} - ${endTime.format(
                          "HH:mm"
                        )}`
                      : "N/A",
                  sortableTime: exam.startTime,
                  buttonText: buttonText,
                  disabled: disabled,
                  icon: icon,
                  kind: kind,
                });
                addedKeys.add(key);
              }
            }
          });

          allSlots.sort((a, b) => {
            const order = {
              active: 1,
              retake: 2,
              upcoming: 3,
              upcoming_retake: 4,
              submitted_final: 5,
              finished_retake: 6,
              finished: 7,
            };
            const kindOrder = (order[a.kind] || 99) - (order[b.kind] || 99);
            if (kindOrder !== 0) return kindOrder;
            const timeA = dayjs(a.date + " " + a.time, "DD/MM/YYYY HH:mm");
            const timeB = dayjs(b.date + " " + b.time, "DD/MM/YYYY HH:mm");
            return timeB.diff(timeA);
          });

          setSlots(allSlots);
        })
        .catch((err) => {
          console.error("Failed to fetch all exams:", err);
          message.error("Không thể tải danh sách kỳ thi.");
          setSlots([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  const columns = [
    {
      title: (
        <>
          <BookOutlined style={{ marginRight: 6 }} /> Môn học
        </>
      ),
      dataIndex: "subject",
      key: "subject",
      width: 140,
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: (
        <>
          <FileTextOutlined style={{ marginRight: 6 }} /> Kỳ thi
        </>
      ),
      dataIndex: "exam",
      key: "exam",
      width: 180,
      render: (v) => (
        <Tag color="processing" className="qm-tag">
          {v}
        </Tag>
      ),
    },
    {
      title: (
        <>
          <CalendarOutlined style={{ marginRight: 6 }} /> Ngày thi
        </>
      ),
      dataIndex: "date",
      key: "date",
      width: 140,
      render: (v) => <span style={{ whiteSpace: "nowrap" }}>{v}</span>,
    },
    {
      title: (
        <>
          <ClockCircleOutlined style={{ marginRight: 6 }} /> Thời gian
        </>
      ),
      dataIndex: "time",
      key: "time",
      width: 120,
      render: (v) => <span style={{ whiteSpace: "nowrap" }}>{v}</span>,
    },
    {
      title: (
        <>
          <InfoCircleOutlined style={{ marginRight: 6 }} /> Trạng thái
        </>
      ),
      key: "action",
      fixed: "right",
      width: 120,

      // ================== SỬA LỖI Ở ĐÂY ==================
      render: (_, record) => (
        // Luôn luôn bọc trong Link
        <Link to={`/quiz/${record.examId}`} onClick={onClose}>
          <Button
            className={`qm-btn ${record.disabled ? "is-disabled" : ""}`}
            size="small"
            icon={record.icon}
          >
            {record.buttonText}
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <Modal
      className="quiz-modal"
      title={
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#dd673c",
          }}
        >
          <FileTextOutlined /> Danh sách kỳ thi
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={880}
      centered
      destroyOnClose
      maskClosable
      styles={{
        header: { padding: "10px 16px" },
        body: { padding: 0 },
        content: { borderRadius: 12 },
      }}
    >
      <Spin spinning={loading}>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={slots}
          size="middle"
          pagination={{ pageSize: 10, size: "small" }}
          scroll={{ x: 700 }}
          className="qm-table"
          locale={{ emptyText: "Không có kỳ thi nào." }}
        />
      </Spin>
    </Modal>
  );
}
