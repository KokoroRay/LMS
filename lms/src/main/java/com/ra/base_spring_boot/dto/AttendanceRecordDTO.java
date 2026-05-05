package com.ra.base_spring_boot.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecordDTO {
    private Integer recordId;
    private Integer sessionId;
    private Integer studentId;
    private String studentName;
    private String status;
    private String note;
    private LocalDateTime recordedAt;

}