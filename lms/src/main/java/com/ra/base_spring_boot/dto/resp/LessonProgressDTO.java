package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.LessonProgress;
import com.ra.base_spring_boot.model.Session;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonProgressDTO {
    private Integer userId;
    private Integer lessonId;
    private Integer courseId;
    private String courseTitle;
    private Integer watchedSeconds;
    private Boolean isCompleted;
    private LocalDateTime lastWatchedAt;

    public static LessonProgressDTO fromEntity(LessonProgress entity) {
        Integer courseId = null;
        String courseTitle = null;

        if (entity.getLesson() != null) {
            Session session = entity.getLesson().getSession();
            if (session != null) {
                Course course = session.getCourse();
                if (course != null) {
                    courseId = course.getCourseId();
                    courseTitle = course.getTitle();
                }
            }
        }

        return LessonProgressDTO.builder()
                .userId(entity.getUser().getId())
                .lessonId(entity.getLesson().getLessonId())
                .courseId(courseId)
                .courseTitle(courseTitle)
                .watchedSeconds(entity.getWatchedSeconds())
                .isCompleted(entity.getIsCompleted())
                .lastWatchedAt(entity.getLastWatchedAt())
                .build();
    }
}
