package com.ra.base_spring_boot.dto.req;

import lombok.Data;

@Data
public class CompleteReEnrollmentRequestDTO {
    private Integer reEnrollmentId;
    private Double assignmentScore;
    private Double quizScore;
    private Double examScore;
}//
