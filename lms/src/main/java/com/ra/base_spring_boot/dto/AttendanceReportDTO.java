package com.ra.base_spring_boot.dto;

import com.ra.base_spring_boot.model.AttendanceSummary;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class AttendanceReportDTO {
    private List<AttendanceSummary> details;       // Chi tiết từng học viên
    private int totalStudents;                     // Tổng học viên
    private int totalSessions;                     // Tổng buổi học
    private int totalAttended;                     // Tổng buổi học viên tham dự
    private BigDecimal averageAttendanceRate;      // Tỷ lệ chuyên cần trung bình
    private int studentsAboveThreshold;            // Số học viên >= 75%
    private int studentsBelowThreshold;            // Số học viên < 75%
}
