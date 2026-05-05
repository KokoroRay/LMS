package com.ra.base_spring_boot.dto.req;

import lombok.*;
import java.util.List; // <-- THÊM IMPORT NÀY

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeSubmissionDTO {

    private Double score;

    private String feedback;

    private List<AnswerScoreDTO> answerScores;
}