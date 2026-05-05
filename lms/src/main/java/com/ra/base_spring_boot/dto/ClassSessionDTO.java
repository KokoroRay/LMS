package com.ra.base_spring_boot.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassSessionDTO {
    private Integer sessionId;

    // Thông tin lớp học
    private Integer classId;
    private String className;

    // Thông tin buổi học
    private LocalDate sessionDate;   // Ngày học
    private LocalTime startTime;     // Giờ bắt đầu
    private LocalTime endTime;       // Giờ kết thúc
    private String topic;            // Chủ đề bài học

    // Danh sách điểm danh
    private List<AttendanceRecordDTO> attendanceRecords;
}
