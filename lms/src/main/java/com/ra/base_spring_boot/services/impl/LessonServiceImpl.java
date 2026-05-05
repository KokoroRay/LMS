package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.resp.AssignmentDTO;
import com.ra.base_spring_boot.dto.resp.LessonDTO;
import com.ra.base_spring_boot.dto.req.LessonRequestDTO;
import com.ra.base_spring_boot.dto.resp.SessionWithLessonsDTO;
import com.ra.base_spring_boot.model.Assignment;
import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.Lesson;
import com.ra.base_spring_boot.model.Session;
import com.ra.base_spring_boot.repository.AssignmentRepository;
import com.ra.base_spring_boot.repository.LessonRepository;
import com.ra.base_spring_boot.repository.SessionRepository;
import com.ra.base_spring_boot.services.ILessonService;
import com.ra.base_spring_boot.services.S3VideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class LessonServiceImpl implements ILessonService {

    private final LessonRepository lessonRepository;
    private final SessionRepository sessionRepository;
    private final S3VideoService s3VideoService;
    private final AssignmentRepository assignmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<LessonDTO> getCourseStructure(Integer sessionId) {
        List<Lesson> lessons = lessonRepository.findBySession_SessionIdOrderByOrderIndex(sessionId);
        return lessons.stream()
                .map(this::mapToLessonDTO)
                .collect(Collectors.toList());
    }

    @Override
    public LessonDTO createLesson(LessonRequestDTO dto) {
        Session session = sessionRepository.findById(dto.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Course course = session.getCourse(); // lấy course từ session

        String videoUrl = null;
        log.info("Checking video for lesson: {}", dto.getTitle());
        log.info("Video file present: {}", dto.getVideoUrl() != null && !dto.getVideoUrl().isEmpty());
        log.info("Video URL string present: {}", dto.getVideoUrlString() != null);

        // Ưu tiên 1: Upload file video lên S3 nếu có
        if (dto.getVideoUrl() != null && !dto.getVideoUrl().isEmpty()) {
            try {
                // Tạo lesson tạm để có lessonId
                Lesson tempLesson = Lesson.builder()
                        .session(session)
                        .course(course)
                        .title(dto.getTitle())
                        .description(dto.getDescription())
                        .content(dto.getContent())
                        .videoUrl(null)
                        .durationMinutes(dto.getDurationMinutes())
                        .orderIndex(dto.getOrderIndex())
                        .quizId(dto.getQuizId())
                        .quizDurationMinutes(dto.getQuizDurationMinutes())
                        .build();

                Lesson savedTempLesson = lessonRepository.save(tempLesson);
                String lessonId = savedTempLesson.getLessonId().toString();

                log.info("Uploading video to R2 for lesson: {} (ID: {})", dto.getTitle(), lessonId);
                String s3Key = s3VideoService.uploadVideo(
                        dto.getVideoUrl(),
                        course.getCourseId().toString(),
                        lessonId
                );

                savedTempLesson.setVideoUrl(s3Key);
                Lesson finalLesson = lessonRepository.save(savedTempLesson);

                log.info("Video uploaded to R2 successfully: {}", s3Key);
                return mapToLessonDTO(finalLesson);

            } catch (Exception e) {
                log.error("Failed to upload video to R2 for lesson: {}", dto.getTitle(), e);
                throw new RuntimeException("Failed to upload video: " + e.getMessage());
            }
        }
        // Ưu tiên 2: dùng URL video có sẵn
        else if (dto.getVideoUrlString() != null && !dto.getVideoUrlString().trim().isEmpty()) {
            videoUrl = dto.getVideoUrlString().trim();
            log.info("Using provided video URL for lesson: {} - {}", dto.getTitle(), videoUrl);
        } else {
            log.info("No video file or URL provided for lesson: {}", dto.getTitle());
        }

        Lesson lesson = Lesson.builder()
                .session(session)
                .course(course)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .content(dto.getContent())
                .videoUrl(videoUrl)
                .durationMinutes(dto.getDurationMinutes())
                .orderIndex(dto.getOrderIndex())
                .quizId(dto.getQuizId())
                .quizDurationMinutes(dto.getQuizDurationMinutes())
                .build();

        Lesson savedLesson = lessonRepository.save(lesson);
        return mapToLessonDTO(savedLesson);
    }

    @Override
    public LessonDTO updateLesson(Integer lessonId, LessonRequestDTO dto) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        // Đổi session / course nếu có sessionId mới
        if (dto.getSessionId() != null
                && !dto.getSessionId().equals(lesson.getSession().getSessionId())) {

            Session newSession = sessionRepository.findById(dto.getSessionId())
                    .orElseThrow(() -> new RuntimeException("Session not found"));
            lesson.setSession(newSession);
            lesson.setCourse(newSession.getCourse());
        }

        lesson.setTitle(dto.getTitle());
        lesson.setDescription(dto.getDescription());
        lesson.setContent(dto.getContent());
        lesson.setDurationMinutes(dto.getDurationMinutes());
        lesson.setOrderIndex(dto.getOrderIndex());
        lesson.setQuizId(dto.getQuizId());
        lesson.setQuizDurationMinutes(dto.getQuizDurationMinutes());

        // Xử lý đổi video
        log.info("Checking video update for lesson: {}", lessonId);
        log.info("Video file present: {}", dto.getVideoUrl() != null && !dto.getVideoUrl().isEmpty());
        log.info("Video URL string present: {}", dto.getVideoUrlString() != null);

        if (dto.getVideoUrl() != null && !dto.getVideoUrl().isEmpty()) {
            try {
                String oldVideoKey = s3VideoService.extractObjectKey(lesson.getVideoUrl());
                if (oldVideoKey != null && oldVideoKey.startsWith("uploads/")) {
                    log.info("Deleting old video from R2: {}", oldVideoKey);
                    s3VideoService.deleteVideo(oldVideoKey);
                }

                log.info("Uploading new video to R2 for lesson: {}", lessonId);
                String s3Key = s3VideoService.uploadVideo(
                        dto.getVideoUrl(),
                        lesson.getCourse().getCourseId().toString(),
                        lessonId.toString()
                );

                lesson.setVideoUrl(s3Key);
                log.info("Video updated successfully for lesson {}: {}", lessonId, s3Key);

            } catch (Exception e) {
                log.error("Failed to update video for lesson: {}", lessonId, e);
                throw new RuntimeException("Failed to update video: " + e.getMessage());
            }
        } else if (dto.getVideoUrlString() != null && !dto.getVideoUrlString().trim().isEmpty()) {
            lesson.setVideoUrl(dto.getVideoUrlString().trim());
            log.info("Updated video URL for lesson {}: {}", lessonId, dto.getVideoUrlString());
        } else {
            log.info("No video file or URL provided for lesson update: {}", lessonId);
        }

        Lesson updatedLesson = lessonRepository.save(lesson);
        return mapToLessonDTO(updatedLesson);
    }

    @Override
    public void deleteLesson(Integer lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        String storedVideoKey = s3VideoService.extractObjectKey(lesson.getVideoUrl());
        if (storedVideoKey != null && storedVideoKey.startsWith("uploads/")) {
            try {
                s3VideoService.deleteVideo(storedVideoKey);
                log.info("Video deleted from R2: {}", storedVideoKey);
            } catch (Exception e) {
                log.warn("Failed to delete video from R2: {}", e.getMessage());
            }
        }

        log.info("Deleting lesson: {} with video URL: {}", lessonId, lesson.getVideoUrl());
        lessonRepository.delete(lesson);
    }

    @Override
    public LessonDTO updateLessonVideo(Integer lessonId, String videoUrl) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));
        lesson.setVideoUrl(videoUrl);
        lessonRepository.save(lesson);
        return mapToLessonDTO(lesson);
    }

    private LessonDTO mapToLessonDTO(Lesson lesson) {
        return LessonDTO.builder()
                .lessonId(lesson.getLessonId())
                .sessionId(lesson.getSession() != null ? lesson.getSession().getSessionId() : null)
                .courseId(lesson.getCourse() != null ? lesson.getCourse().getCourseId() : null)
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .content(lesson.getContent())
                .videoUrl(s3VideoService.resolvePublicUrl(lesson.getVideoUrl()))
                .durationMinutes(lesson.getDurationMinutes())
                .orderIndex(lesson.getOrderIndex())
                .quizId(lesson.getQuizId())
                .quizDurationMinutes(lesson.getQuizDurationMinutes())
                .build();
    }

    /**
     * Lấy cấu trúc khoá học: Session + Lessons + Assignments (theo Session).
     * Assignment KHÔNG còn dính tới Class / Lesson.
     */
    public List<SessionWithLessonsDTO> getCourseStructureWithSessions(Integer courseId) {
        List<Session> sessions =
                sessionRepository.findByCourse_CourseIdOrderByPositionAsc(courseId);

        return sessions.stream()
                .map(session -> {
                    // Lessons
                    List<LessonDTO> lessonDTOs = lessonRepository
                            .findBySession_SessionIdOrderByOrderIndex(session.getSessionId())
                            .stream()
                            .map(this::mapToLessonDTO)
                            .collect(Collectors.toList());

                    // Assignments của session (không có classId nữa)
                    List<AssignmentDTO> assignmentDTOs = assignmentRepository
                            .findBySession_SessionIdOrderByPostedAtAsc(session.getSessionId())
                            .stream()
                            .map(a -> AssignmentDTO.builder()
                                    .assignmentId(a.getAssignmentId())
                                    .sessionId(a.getSession() != null
                                            ? a.getSession().getSessionId()
                                            : null)
                                    .title(a.getTitle())
                                    .description(a.getDescription())
                                    .postedAt(a.getPostedAt())
                                    .dueDate(a.getDueDate())
                                    .maxScore(a.getMaxScore())
                                    .allowLate(a.getAllowLate())
                                    .build())
                            .collect(Collectors.toList());

                    return SessionWithLessonsDTO.builder()
                            .sessionId(session.getSessionId())
                            .title(session.getTitle())
                            .position(session.getPosition())
                            .courseId(session.getCourse().getCourseId())
                            .lessons(lessonDTOs)
                            .assignments(assignmentDTOs)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public LessonDTO findById(Integer lessonId) {
        log.info("Finding lesson by ID: {}", lessonId);

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found with ID: " + lessonId));

        return mapToLessonDTO(lesson);
    }

    private String extractBlobNameFromUrl(String url) {
        if (url == null) return null;

        String[] parts = url.split("/");
        if (parts.length >= 5) {
            StringBuilder blobName = new StringBuilder();
            for (int i = 4; i < parts.length; i++) {
                if (i > 4) blobName.append("/");
                blobName.append(parts[i]);
            }
            return blobName.toString();
        }
        return url;
    }
}
