package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.events.GradeUpdatedEvent;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.GradeStatus;
import com.ra.base_spring_boot.model.constants.ReEnrollmentStatus;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.CategoryGradeService;
import com.ra.base_spring_boot.services.GradeCalculationService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GradeCalculationServiceImpl implements GradeCalculationService {

    private final SubmissionRepository submissionRepository;
    private final LessonQuizAttemptRepository lessonQuizAttemptRepository;
    private final ExamResultRepository examResultRepository;
    private final GradingPolicyRepository gradingPolicyRepository;
    private final CourseGradeRepository courseGradeRepository;
    private final CategoryGradeService categoryGradeService;
    private final ClassRepository classRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ReEnrollmentRepository reEnrollmentRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public void calculateAllCourseGradesForStudent(Integer studentId, String classIdStr) {
        try {
            Integer classId = Integer.parseInt(classIdStr);
            calculateAllCourseGradesForStudent(studentId, classId);
        } catch (NumberFormatException e) {
            ClassEntity classEntity = classRepository.findByClassName(classIdStr)
                .orElseThrow(() -> new EntityNotFoundException("Class not found: " + classIdStr));
            calculateAllCourseGradesForStudent(studentId, classEntity.getClassId());
        }
    }
    
    @Override
    public void calculateAllCourseGradesForStudent(Integer studentId, Integer classId) {

        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new EntityNotFoundException("Class not found"));

        User student = userRepository.getReferenceById(studentId);

        List<Course> courses = classEntity.getCourses().stream().toList();

        for (Course c : courses) {
            calculateAndSaveCourseGrade(student, classEntity, c.getCourseId());
        }

        categoryGradeService.calculateCategoryGrade(studentId, classId);
    }

    @Override
    @Transactional
    public void calculateSingleCourseGrade(Integer studentId, Integer classId, Integer courseId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new EntityNotFoundException("Class not found"));
        User student = userRepository.getReferenceById(studentId);

        calculateAndSaveCourseGrade(student, classEntity, courseId);
    }

    private void calculateAndSaveCourseGrade(User student, ClassEntity classEntity, Integer courseId) {

        GradingPolicy policy = gradingPolicyRepository
                .findByCourse_CourseId(courseId)
                .orElseThrow(() -> new RuntimeException("No grading policy for course: " + courseId));

        // Step 1: Fetch scores as Optionals to check for presence
        Optional<Double> optAvgAssignment = submissionRepository
                .findAverageGradeByStudentAndClassAndCourse(student.getId(), classEntity.getClassId(), courseId);

        // --- Logic for latest quiz attempts ---
        List<LessonQuizAttempt> allQuizAttempts = lessonQuizAttemptRepository
                .findAllGradedByStudentAndCourseOrderByLessonAndDate(student.getId(), courseId);
        Map<Integer, LessonQuizAttempt> latestQuizAttemptsByLesson = new LinkedHashMap<>();
        for (LessonQuizAttempt attempt : allQuizAttempts) {
            latestQuizAttemptsByLesson.putIfAbsent(attempt.getLesson().getLessonId(), attempt);
        }
        Optional<Double> optAvgQuiz = latestQuizAttemptsByLesson.values().stream()
                .mapToDouble(LessonQuizAttempt::getScore)
                .average().stream().boxed().findFirst();

        // --- Logic for exam attempts with re-enrollment support ---
        Optional<Double> optAvgExam = calculateExamScoreWithRetakeSupport(student.getId(), classEntity.getClassId(), courseId);


        // Step 2: Check if all components are graded based on the policy
        boolean assignmentComplete = (policy.getAssignmentsWeight() == null || policy.getAssignmentsWeight() == 0) || optAvgAssignment.isPresent();
        boolean quizComplete = (policy.getQuizzesWeight() == null || policy.getQuizzesWeight() == 0) || optAvgQuiz.isPresent();
        boolean examComplete = (policy.getExamsWeight() == null || policy.getExamsWeight() == 0) || optAvgExam.isPresent();
        boolean allComponentsGraded = assignmentComplete && quizComplete && examComplete;

        // Step 3: Get scores, defaulting to 0.0 for calculation
        Double avgAssignment = optAvgAssignment.orElse(0.0);
        Double avgQuiz = optAvgQuiz.orElse(0.0);
        Double avgExam = optAvgExam.orElse(0.0);

        // Step 4: Determine status and final score
        double finalScore;
        GradeStatus status;

        finalScore = avgAssignment * (policy.getAssignmentsWeight() / 100.0) +
                     avgQuiz * (policy.getQuizzesWeight() / 100.0) +
                     avgExam * (policy.getExamsWeight() / 100.0);

        if (allComponentsGraded) {
            status = finalScore >= policy.getPassingScore() ? GradeStatus.PASS : GradeStatus.FAIL;
        } else {
            status = GradeStatus.IN_PROGRESS;
        }

        // Step 5: Find or create the CourseGrade entity
        CourseGrade grade = courseGradeRepository
                .findByStudent_IdAndClassEntity_ClassIdAndCourse_CourseId(
                        student.getId(),
                        classEntity.getClassId(),
                        courseId
                )
                .orElseGet(() -> {
                    CourseGrade cg = new CourseGrade();
                    cg.setStudent(student);
                    cg.setClassEntity(classEntity);
                    cg.setCourse(courseRepository.getReferenceById(courseId));
                    cg.setPolicy(policy);
                    return cg;
                });

        // Step 6: Update and save the grade record
        grade.setAssignmentScore(avgAssignment);
        grade.setQuizScore(avgQuiz);
        grade.setExamScore(avgExam);
        grade.setFinalScore(finalScore);
        grade.setStatus(status);
        grade.setGradedAt(LocalDateTime.now());

        courseGradeRepository.save(grade);
    }

    /**
     * Tính điểm exam với hỗ trợ học lại:
     * - Nếu có re-enrollment được kích hoạt: chỉ tính điểm lần thi sau khi kích hoạt
     * - Nếu không: tính điểm lần thi gần nhất của mỗi exam
     */
    private Optional<Double> calculateExamScoreWithRetakeSupport(Integer studentId, Integer classId, Integer courseId) {
        // Kiểm tra xem có re-enrollment được kích hoạt không
        Optional<CourseGrade> courseGradeOpt = courseGradeRepository
                .findByStudent_IdAndClassEntity_ClassIdAndCourse_CourseId(studentId, classId, courseId);
        
        LocalDateTime retakeActivationTime = null;
        if (courseGradeOpt.isPresent()) {
            Optional<ReEnrollment> activeRetakeOpt = reEnrollmentRepository
                    .findByFailedCourseGrade_CourseGradeIdAndStatus(
                        courseGradeOpt.get().getCourseGradeId(), 
                        ReEnrollmentStatus.RETAKE_ACTIVATED
                    );
            
            if (activeRetakeOpt.isPresent()) {
                retakeActivationTime = activeRetakeOpt.get().getRetakeActivatedAt();
            }
        }
        
        // Lấy tất cả kết quả thi của sinh viên trong course này
        List<ExamResult> allExamAttempts = examResultRepository
                .findAllGradedByStudentAndCourseOrderByExamAndDate(studentId, courseId);
        
        Map<Integer, ExamResult> examScores = new LinkedHashMap<>();
        
        for (ExamResult attempt : allExamAttempts) {
            Integer examId = attempt.getExam().getExamId();
            
            if (retakeActivationTime != null) {
                // Nếu có kích hoạt học lại, chỉ tính điểm sau thời điểm kích hoạt
                if (attempt.getSubmittedAt() != null && attempt.getSubmittedAt().isAfter(retakeActivationTime)) {
                    examScores.put(examId, attempt); // Lấy lần thi mới nhất sau kích hoạt
                }
            } else {
                // Không có học lại, lấy lần thi gần nhất của mỗi exam
                examScores.putIfAbsent(examId, attempt);
            }
        }
        
        // Tính trung bình điểm của các exam
        return examScores.values().stream()
                .mapToDouble(ExamResult::getScore)
                .average().stream().boxed().findFirst();
    }

    @Override
    @Transactional
    public void calculateGradesForClass(Integer classId) {
        List<Integer> studentIds = submissionRepository.findStudentIdsByClass(classId);
        for (Integer studentId : studentIds) {
            calculateAllCourseGradesForStudent(studentId, classId);
        }
    }
}

