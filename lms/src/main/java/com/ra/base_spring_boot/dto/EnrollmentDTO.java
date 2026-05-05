package com.ra.base_spring_boot.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentDTO {
    private Integer enrollmentId;
    private Integer studentId;
    private String studentName;
    private Double progress;
    private String status;
}
