package com.ra.base_spring_boot.dto.resp;

import lombok.*;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SessionWithLessonsDTO {
    private Integer sessionId;
    private String title; // session title
    private Integer position;
    private Integer courseId;
    private List<LessonDTO> lessons;
    private List<AssignmentDTO> assignments;
}
