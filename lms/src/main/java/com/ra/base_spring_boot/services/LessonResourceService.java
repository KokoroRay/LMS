package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.LessonResourceRequestDTO;
import com.ra.base_spring_boot.dto.resp.LessonResourceDTO;
import java.util.List;

public interface LessonResourceService {
    List<LessonResourceDTO> getResourcesByLesson(Integer lessonId);
    LessonResourceDTO addResource(LessonResourceRequestDTO dto);
    void deleteResource(Integer resourceId);
    LessonResourceDTO updateResource(Integer id, LessonResourceRequestDTO dto);

}
