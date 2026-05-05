package com.ra.base_spring_boot.model;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonProgressId implements Serializable {
    private Integer userId;
    private Integer lessonId;
    private Integer attemptNumber;
}
