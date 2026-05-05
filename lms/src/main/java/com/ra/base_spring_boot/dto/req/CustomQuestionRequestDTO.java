package com.ra.base_spring_boot.dto.req;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // Import annotation
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomQuestionRequestDTO {
    private String questionText;
    private String questionType;
    private Double points;
    private List<String> choices;
    private List<String> correctAnswers;
    private String starterCode;
    private List<TestCaseRequestDTO> testCases;
    private String language;
}