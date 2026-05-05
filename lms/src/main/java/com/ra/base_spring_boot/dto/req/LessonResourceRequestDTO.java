package com.ra.base_spring_boot.dto.req;

import com.ra.base_spring_boot.model.constants.ResourceType;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonResourceRequestDTO {
    private String title;
    private String fileUrl;
    private ResourceType resourceType;
    private Integer lessonId;
}
