package com.ra.base_spring_boot.dto.req;

import com.ra.base_spring_boot.dto.resp.TestCaseResultDTO; // Import DTO này
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerSubmissionDTO {
    private Integer questionId;
    private List<String> selectedOptions;
    private String answerText;
    private String code;

    private List<TestCaseResultDTO> testCaseResults;
}