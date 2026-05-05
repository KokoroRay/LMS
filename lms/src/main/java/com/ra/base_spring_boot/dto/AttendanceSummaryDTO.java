    package com.ra.base_spring_boot.dto;

    import lombok.*;

    import java.math.BigDecimal;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public class AttendanceSummaryDTO {
        private Integer studentId;
        private String studentName;
        private Integer classId;
        private String className;
        private Integer totalSessions;
        private Integer attendedSessions;
        private Integer absentSessions;
        private BigDecimal attendanceRate;


    }