package com.ra.base_spring_boot.dto.req;

import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSubmissionDTO {
    private Integer examId;
    private Integer slotId;
    private List<AnswerSubmissionDTO> answers;
    private String githubUrl;
    private String ideSessionId;
    private Integer violationCount;
}


