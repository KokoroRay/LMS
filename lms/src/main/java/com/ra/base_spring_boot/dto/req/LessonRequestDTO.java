package com.ra.base_spring_boot.dto.req;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonRequestDTO {
    private String title;
    private String description;
    private String content;
    
    @JsonIgnore  // Ignore this field when deserializing from JSON
    private MultipartFile videoUrl;
    
    // For JSON requests with video URL (e.g., from Cloudinary)
    private String videoUrlString;
    
    private Integer durationMinutes;
    private Integer orderIndex;
    private Integer quizId;   // thêm để map với entity Lesson
    private Integer sessionId;

    private Integer quizDurationMinutes;
}
