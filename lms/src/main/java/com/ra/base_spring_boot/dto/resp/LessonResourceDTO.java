package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.model.constants.ResourceType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonResourceDTO {
    private Integer resourceId;
    private String title;
    private String fileUrl;
    private ResourceType resourceType;
    private LocalDateTime uploadedAt;
    private Integer lessonId;
}
