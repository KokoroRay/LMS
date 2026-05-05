package com.ra.base_spring_boot.dto.req;

import lombok.Data;

@Data
public class GradeSubmissionRequestDTO {
    private Double grade;
    private String feedback;
    private Integer gradedById; // id của giáo viên chấm
}
