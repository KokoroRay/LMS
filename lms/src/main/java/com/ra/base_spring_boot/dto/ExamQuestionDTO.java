package com.ra.base_spring_boot.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamQuestionDTO {
    private Integer exQId;
    private String questionText;
    private String questionType;
    private Double points;
    private List<String> choices;
    private String starterCode;
    private List<TestCaseDTO> testCases;
    private String language;
    private Integer orderIndex;
}
