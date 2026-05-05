package com.ra.base_spring_boot.dto.resp;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonDTO {
    private Integer lessonId;
    private Integer sessionId;
    private Integer courseId;
    private String title;
    private String description;
    private String videoUrl;
    private Integer durationMinutes;
    private Integer orderIndex;
    private String content;
    private Integer quizId;
    private Integer quizDurationMinutes;
}
