package com.ra.base_spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceUpdateDTO {
    private Integer studentId;
    private String studentName;
    private String status;
    private String note;
}