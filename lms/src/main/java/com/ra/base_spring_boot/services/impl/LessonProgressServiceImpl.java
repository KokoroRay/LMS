package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.quiz.QuizAttemptDTO;
import com.ra.base_spring_boot.dto.req.LessonProgressRequestDTO;
import com.ra.base_spring_boot.dto.resp.EnrollmentProgressDTO;
import com.ra.base_spring_boot.dto.resp.LessonProgressDTO;
import com.ra.base_spring_boot.dto.resp.SubmissionResponseDTO;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.IQuizService;
import com.ra.base_spring_boot.services.LessonProgressService;
import com.ra.base_spring_boot.services.SubmissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class LessonProgressServiceImpl implements LessonProgressService {

    private final LessonProgressRepository progressRepo;
    private final UserRepository userRepo;
    private final LessonRepository lessonRepo;
    private final EnrollmentRepository enrollmentRepo;
    private final AssignmentRepository assignmentRepository;
    private final CourseGradeRepository courseGradeRepository;
    private final IQuizService quizService;
    private final SubmissionService submissionService;

    @Override
    public LessonProgressDTO createOrUpdateProgress(Integer studentId, LessonProgressRequestDTO dto) {
        log.info("Updating lesson progress for studentId={}, dto={}", studentId, dto);

        User user = userRepo.findById(studentId)
                .orElseThrow(() -> new HttpBadRequest("User not found."));

        Lesson lesson = lessonRepo.findById(dto.getLessonId())
                .orElseThrow(() -> new HttpBadRequest("Lesson not found."));

        // Determine attempt number
        Integer maxAttempt = progressRepo.findMaxAttemptByStudentAndLesson(studentId, dto.getLessonId());
        if (maxAttempt == null) maxAttempt = 0;
        Integer attemptNumber = (dto.getAttemptNumber() != null) ? dto.getAttemptNumber() : maxAttempt + 1;

        // Find or create the progress entity
        LessonProgressId progressId = new LessonProgressId(studentId, dto.getLessonId(), attemptNumber);
        LessonProgress progress = progressRepo.findById(progressId)
                .orElseGet(() -> LessonProgress.builder()
                        .id(progressId).user(user).lesson(lesson).watchedSeconds(0)
                        .isCompleted(false).lastWatchedAt(LocalDateTime.now()).build());

        // Update progress details
        int totalSeconds = lesson.getDurationMinutes() != null ? lesson.getDurationMinutes() * 60 : 0;
        int watched = dto.getWatchedSeconds() != null ? dto.getWatchedSeconds() : 0;
        if (totalSeconds > 0) watched = Math.min(watched, totalSeconds);
        progress.setWatchedSeconds(watched);

        if (dto.getIsCompleted() != null) {
            progress.setIsCompleted(dto.getIsCompleted());
        } else if (totalSeconds > 0) {
            progress.setIsCompleted(watched >= 0.95 * totalSeconds);
        }
        progress.setLastWatchedAt(LocalDateTime.now());
        
        LessonProgress savedProgress = progressRepo.save(progress);
        log.info("Saved LessonProgress: {}", savedProgress);

        // Note: We no longer update the ambiguous Enrollment.progress field here.
        // Overall progress will be calculated on-the-fly by the getEnrollmentProgress endpoint.

        return LessonProgressDTO.fromEntity(savedProgress);
    }

    @Override
    public List<LessonProgressDTO> getProgressByStudent(Integer studentId) {
        return progressRepo.findByUser_Id(studentId)
                .stream()
                .map(LessonProgressDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public LessonProgressDTO getLessonProgress(Integer studentId, Integer lessonId, Integer attemptNumber) {
        Integer attempt = (attemptNumber != null) ? attemptNumber : 1;
        LessonProgressId id = new LessonProgressId(studentId, lessonId, attempt);
        return progressRepo.findById(id)
                .map(LessonProgressDTO::fromEntity)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true) // This method is read-only, good practice to mark it
    public List<EnrollmentProgressDTO> getEnrollmentProgress(Integer studentId) {
        User user = userRepo.findById(studentId).orElseThrow(() -> new HttpBadRequest("User not found"));
        List<Enrollment> enrollments = enrollmentRepo.findByStudent_Id(studentId);

        return enrollments.stream()
            .flatMap(enrollment -> {
                ClassEntity classEntity = enrollment.getClassEntity();
                Set<Course> coursesInClass = classEntity.getCourses();

                return coursesInClass.stream().map(course -> {
                    // Find the grade record to get the correct attempt number
                    CourseGrade grade = courseGradeRepository
                        .findByStudent_IdAndClassEntity_ClassIdAndCourse_CourseId(
                                studentId, classEntity.getClassId(), course.getCourseId())
                        .orElse(null);

                    // If there's no grade record, we can't determine the attempt, so we skip
                    if (grade == null) return null;
                    Integer attemptNumber = grade.getAttemptNumber();

                    double progressPercentage = calculateCourseProgress(course, user, classEntity, attemptNumber);
                    
                    List<Lesson> lessons = lessonRepo.findBySession_Course_CourseId(course.getCourseId());
                    List<Assignment> assignments = assignmentRepository.findByCourse_CourseId(course.getCourseId());
                    int totalItems = lessons.size() + assignments.size();

                    long completedItems = Stream.concat(
                        lessons.stream().map(l -> calculateItemProgress(l, user, classEntity, attemptNumber)),
                        assignments.stream().map(a -> calculateItemProgress(a, user, classEntity, attemptNumber))
                    ).filter(p -> p >= 1.0).count();

                    return EnrollmentProgressDTO.builder()
                            .courseId(course.getCourseId())
                            .courseTitle(course.getTitle())
                            .courseImage(course.getThumbnailUrl())
                            .progress(progressPercentage)
                            .totalWorkItems(totalItems)
                            .completedWorkItems((int) completedItems)
                            .attemptNumber(attemptNumber)
                            .build();
                });
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    // ===================== PROGRESS CALCULATION HELPERS =====================

    private double calculateCourseProgress(Course course, User student, ClassEntity classEntity, Integer attemptNumber) {
        List<Lesson> lessons = lessonRepo.findBySession_Course_CourseId(course.getCourseId());
        List<Assignment> assignments = assignmentRepository.findByCourse_CourseId(course.getCourseId());

        Stream<Double> lessonProgressStream = lessons.stream()
                .map(item -> calculateItemProgress(item, student, classEntity, attemptNumber));
        Stream<Double> assignmentProgressStream = assignments.stream()
                .map(item -> calculateItemProgress(item, student, classEntity, attemptNumber));

        List<Double> allProgressValues = Stream.concat(lessonProgressStream, assignmentProgressStream)
                .collect(Collectors.toList());

        if (allProgressValues.isEmpty()) {
            return 0.0;
        }

        double totalProgress = allProgressValues.stream().mapToDouble(Double::doubleValue).sum();
        return (totalProgress / allProgressValues.size()) * 100; // Return as percentage
    }

    private double calculateItemProgress(Lesson lesson, User student, ClassEntity classEntity, Integer attemptNumber) {
        String itemType = determineLessonType(lesson);

        switch (itemType) {
            case "quiz":
                if (lesson.getQuizId() == null) return 0.0;
                QuizAttemptDTO latestQuizAttempt = quizService.getLatestAttempt(lesson.getQuizId(), student.getId(), attemptNumber);
                return (latestQuizAttempt != null && latestQuizAttempt.getScore() != null) ? 1.0 : 0.0;

            case "video":
            case "readings":
                LessonProgress lp = progressRepo
                        .findTopByUser_IdAndLesson_LessonIdOrderById_AttemptNumberDesc(student.getId(), lesson.getLessonId())
                        .orElse(null);

                if (lp != null) {
                    if (lp.getIsCompleted() != null && lp.getIsCompleted()) {
                        return 1.0;
                    }
                    if (itemType.equals("video")) {
                        int totalSeconds = lesson.getDurationMinutes() != null ? lesson.getDurationMinutes() * 60 : 0;
                        if (totalSeconds > 0) {
                            return Math.min((double) lp.getWatchedSeconds() / totalSeconds, 1.0);
                        }
                    }
                }
                return 0.0;

            default:
                return 0.0;
        }
    }

    private double calculateItemProgress(Assignment assignment, User student, ClassEntity classEntity, Integer attemptNumber) {
        // Assuming submission is also attempt-aware now
        SubmissionResponseDTO latestSubmission = submissionService
                .getMySubmissionForAssignment(assignment.getAssignmentId(), attemptNumber);
        return (latestSubmission != null) ? 1.0 : 0.0;
    }

    private String determineLessonType(Lesson lesson) {
        if (lesson.getQuizId() != null) {
            return "quiz";
        }
        if (lesson.getVideoUrl() != null && !lesson.getVideoUrl().trim().isEmpty()) {
            return "video";
        }
        return "readings";
    }
}