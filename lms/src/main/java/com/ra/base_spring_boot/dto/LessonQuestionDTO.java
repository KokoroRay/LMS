package com.ra.base_spring_boot.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonQuestionDTO {

    private Integer lessonQuestionId;

    @NotNull(message = "Lesson ID is required")
    private Integer lessonId;

    @NotNull(message = "Question ID is required")
    private Integer questionId;

    private Integer orderIndex;

    @NotNull(message = "Is required flag is required")
    private Boolean isRequired;

    @NotNull(message = "Added by is required")
    private Integer addedBy;

}
