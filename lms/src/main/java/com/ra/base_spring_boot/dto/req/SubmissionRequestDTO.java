package com.ra.base_spring_boot.dto.req;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionRequestDTO {
    private Integer assignmentId;
    private String githubUrl;
    private Integer attemptNumber;
}
