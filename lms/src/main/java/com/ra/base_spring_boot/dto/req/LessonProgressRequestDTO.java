package com.ra.base_spring_boot.dto.req;

import lombok.Data;

@Data
public class LessonProgressRequestDTO {
    private Integer lessonId;
    private Integer watchedSeconds;
    private Boolean isCompleted;
    private Integer attemptNumber;
}
