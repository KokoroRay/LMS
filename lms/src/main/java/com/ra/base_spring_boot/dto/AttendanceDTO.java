package com.ra.base_spring_boot.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceDTO {
    private Integer attendanceId;
    private Integer studentId;
    private String studentName;
    private Integer timetableId;
    private String className;
    private String dayOfWeek;
    private String status;
    private String note;
    private LocalDateTime checkedAt;
}
