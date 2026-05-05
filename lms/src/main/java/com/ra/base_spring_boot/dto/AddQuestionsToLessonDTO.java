package com.ra.base_spring_boot.dto;


import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddQuestionsToLessonDTO {

    @NotNull(message = "Lesson ID is required")
    private Integer lessonId;

    @NotNull(message = "Question IDs are required")
    private List<Integer> questionIds;

    @NotNull(message = "Added by is required")
    private Integer addedBy;
}
