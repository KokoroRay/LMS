package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.resp.LessonDTO;
import com.ra.base_spring_boot.dto.req.LessonRequestDTO;
import com.ra.base_spring_boot.dto.resp.SessionWithLessonsDTO;

import java.util.List;

public interface ILessonService {

    List<LessonDTO> getCourseStructure(Integer sessionId); // Lấy tất cả lesson trong session

    LessonDTO createLesson(LessonRequestDTO dto); // sessionId nằm trong dto

    LessonDTO updateLesson(Integer lessonId, LessonRequestDTO dto); // cập nhật lesson + video

    void deleteLesson(Integer lessonId);

    List<SessionWithLessonsDTO> getCourseStructureWithSessions(Integer courseId);
    LessonDTO updateLessonVideo(Integer lessonId, String videoUrl);
    LessonDTO findById(Integer lessonId);
}
