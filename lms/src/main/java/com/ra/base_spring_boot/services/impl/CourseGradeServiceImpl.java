package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.CourseGradeDTO;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.GradeStatus;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.CourseGradeService;
import com.ra.base_spring_boot.services.GradeCalculationService;
import com.ra.base_spring_boot.repository.ReEnrollmentRepository;
import com.ra.base_spring_boot.model.ReEnrollment;
import com.ra.base_spring_boot.model.constants.ReEnrollmentStatus;
import com.ra.base_spring_boot.services.CategoryGradeService;
import com.ra.base_spring_boot.events.GradeUpdatedEvent;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseGradeServiceImpl implements CourseGradeService {

    private final CourseGradeRepository courseGradeRepository;
    private final UserRepository userRepo;
    private final ClassRepository classRepo;
    private final CourseRepository courseRepo;
    private final EnrollmentRepository enrollmentRepository;
    private final GradeCalculationService gradeCalculationService;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final ReEnrollmentRepository reEnrollmentRepository;
    private final CategoryGradeService categoryGradeService;
    private final ApplicationEventPublisher eventPublisher;
    @Override
    public List<CourseGradeDTO> getGradesByStudent(Integer studentId) {
        // Force recalculation of all grades for the student before fetching
        List<Enrollment> enrollments = enrollmentRepository.findActiveEnrollmentsByStudentId(studentId);
        for (Enrollment enrollment : enrollments) {
            if (enrollment.getClassEntity() != null && enrollment.getClassEntity().getClassCourseTeacherAssignments() != null) {
                enrollment.getClassEntity().getClassCourseTeacherAssignments().stream()
                        .map(ClassCourseTeacherAssignment::getCourse)
                        .distinct()
                        .forEach(course -> gradeCalculationService.calculateSingleCourseGrade(
                                studentId,
                                enrollment.getClassEntity().getClassId(),
                                course.getCourseId()
                        ));
            }
        }

        // Now, fetch the freshly calculated grades
        List<CourseGrade> grades = courseGradeRepository.findByStudent_Id(studentId);

        return grades.stream()
                .map(CourseGradeDTO::new)
                .toList();
    }

    @Override
    public List<CourseGradeDTO> getGradesByClass(Integer classId) {
        List<CourseGrade> grades = courseGradeRepository.findByClassEntity_ClassId(classId);

        return grades.stream()
                .map(CourseGradeDTO::new)
                .toList();
    }


    @Override
    public CourseGrade calculateCourseGrade(Integer studentId, Integer classId, Integer courseId) {
        User student = userRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        ClassEntity classEntity = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Lấy courseGrade nếu tồn tại
        CourseGrade grade = courseGradeRepository
                .findByStudent_IdAndClassEntity_ClassIdAndCourse_CourseId(studentId, classId, courseId)
                .orElse(CourseGrade.builder()
                        .student(student)
                        .classEntity(classEntity)
                        .course(course)
                        .build()
                );

        double finalScore =
                grade.getAssignmentScore() * 0.30 +
                        grade.getQuizScore() * 0.20 +
                        grade.getExamScore() * 0.50;

        grade.setFinalScore(finalScore);

        GradeStatus status = finalScore >= 5 ? GradeStatus.PASS : GradeStatus.FAIL;
        grade.setStatus(status);

        CourseGrade savedGrade = courseGradeRepository.save(grade);
        
        // AUTO CERTIFICATE: Tự động kiểm tra và cấp chứng chỉ 100%
        triggerAutomaticCertificateCheck(studentId, savedGrade.getClassEntity().getClassId());

        // ==================== LOGIC ĐÓNG TIẾN TRÌNH KHI FAIL ====================
        if (status == GradeStatus.FAIL) {
            // Lấy tất cả LessonProgress của student trong course này
            List<Lesson> lessons = lessonRepository.findBySession_Course_CourseId(courseId);
            List<LessonProgress> progresses = lessonProgressRepository
                    .findById_UserIdAndLesson_Session_Course_CourseIdOrderByLesson_LessonIdAscId_AttemptNumberDesc(studentId, courseId);

            for (LessonProgress lp : progresses) {
                lp.setIsCompleted(true); // hoặc lp.setStatus("FAILED") nếu có cột status
                lessonProgressRepository.save(lp);
            }
        }
        // ========================================================================

        return savedGrade;
    }


    @Override
    public CourseGrade findByStudentClassAndCourse(Integer studentId, Integer classId, Integer courseId) {
        return courseGradeRepository
                .findByStudent_IdAndClassEntity_ClassIdAndCourse_CourseId(studentId, classId, courseId)
                .orElse(null);
    }

    @Override
    public void triggerGradeCalculation(Integer studentId, Integer courseId) {
        // Find the class the student is enrolled in for this course
        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndCourseId_Custom(studentId, courseId)
                .stream().findFirst().orElse(null);

        if (enrollment != null) {
            gradeCalculationService.calculateSingleCourseGrade(studentId, enrollment.getClassEntity().getClassId(), courseId);
        }
    }

    @Override
    public CourseGrade updateExamScoreForReEnrollment(Integer studentId, Integer classId, Integer courseId, Double examScore) {
        // Kiểm tra xem có re-enrollment nào cho student và courseGrade này không
        CourseGrade courseGrade = courseGradeRepository
                .findByStudent_IdAndClassEntity_ClassIdAndCourse_CourseId(studentId, classId, courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy CourseGrade cho sinh viên này"));

        // Kiểm tra xem có re-enrollment nào cho courseGrade này không
        Optional<ReEnrollment> reEnrollmentOpt = reEnrollmentRepository
                .findByFailedCourseGrade_CourseGradeIdAndStatus(courseGrade.getCourseGradeId(), ReEnrollmentStatus.PAYMENT_SUCCESS);

        if (reEnrollmentOpt.isEmpty()) {
            // Kiểm tra cả trạng thái ENROLLED
            reEnrollmentOpt = reEnrollmentRepository
                    .findByFailedCourseGrade_CourseGradeIdAndStatus(courseGrade.getCourseGradeId(), ReEnrollmentStatus.ENROLLED);
        }

        if (reEnrollmentOpt.isEmpty()) {
            throw new RuntimeException("Sinh viên chưa đóng tiền học lại hoặc chưa đăng ký học lại thành công cho môn này");
        }

        // Cập nhật điểm exam trực tiếp (không thông qua tính toán lại)
        courseGrade.setExamScore(examScore);
        
        // Tính lại điểm cuối kỳ với điểm exam mới
        double finalScore = (courseGrade.getAssignmentScore() != null ? courseGrade.getAssignmentScore() : 0.0) * 0.30 +
                           (courseGrade.getQuizScore() != null ? courseGrade.getQuizScore() : 0.0) * 0.20 +
                           examScore * 0.50;
        
        courseGrade.setFinalScore(finalScore);
        courseGrade.setStatus(finalScore >= 5.0 ? 
            com.ra.base_spring_boot.model.constants.GradeStatus.PASS : 
            com.ra.base_spring_boot.model.constants.GradeStatus.FAIL);
        courseGrade.setGradedAt(LocalDateTime.now());
        
        CourseGrade savedGrade = courseGradeRepository.save(courseGrade);
        
        // AUTO CERTIFICATE: Tự động kiểm tra và cấp chứng chỉ 100%
        triggerAutomaticCertificateCheck(savedGrade.getStudent().getId(), savedGrade.getClassEntity().getClassId());
        
        return savedGrade;
    }
    
    /**
     * Tự động kiểm tra và cấp chứng chỉ khi có CourseGrade mới
     * 100% tự động - không cần click gì
     */
    private void triggerAutomaticCertificateCheck(Integer studentId, Integer classId) {
        try {
            categoryGradeService.calculateCategoryGrade(studentId, classId);
            eventPublisher.publishEvent(new GradeUpdatedEvent(this, studentId, classId, null));
        } catch (Exception e) {
            log.error("Error in automatic certificate check for Student {}, Class {}: {}", studentId, classId, e.getMessage());
        }
    }
    
    /**
     * Tạo hoặc cập nhật CourseGrade - dùng cho testing
     */
    public CourseGrade createOrUpdateCourseGrade(Integer studentId, String classIdStr, Integer courseId, Double finalScore) {
        Integer classId;
        try {
            classId = Integer.parseInt(classIdStr);
        } catch (NumberFormatException e) {
            var classEntity = classRepo.findByClassName(classIdStr)
                .orElseThrow(() -> new EntityNotFoundException("Class not found: " + classIdStr));
            classId = classEntity.getClassId();
        }
        final Integer finalClassId = classId;
        
        var student = userRepo.findById(studentId)
            .orElseThrow(() -> new EntityNotFoundException("Student not found: " + studentId));
        var classEntity = classRepo.findById(finalClassId)
            .orElseThrow(() -> new EntityNotFoundException("Class not found: " + finalClassId));
        var course = courseRepo.findById(courseId)
            .orElseThrow(() -> new EntityNotFoundException("Course not found: " + courseId));
            
        var existingGrade = courseGradeRepository.findByStudent_IdAndClassEntity_ClassIdAndCourse_CourseId(
            studentId, finalClassId, courseId);
            
        CourseGrade courseGrade;
        if (existingGrade.isPresent()) {
            courseGrade = existingGrade.get();
            log.info("Cập nhật CourseGrade cũ cho Student {}, Class {}, Course {}", studentId, finalClassId, courseId);
        } else {
            courseGrade = CourseGrade.builder()
                .student(student)
                .classEntity(classEntity)
                .course(course)
                .build();
            log.info("Tạo CourseGrade mới cho Student {}, Class {}, Course {}", studentId, finalClassId, courseId);
        }
        
        courseGrade.setFinalScore(finalScore);
        courseGrade.setStatus(finalScore >= 5.0 ? GradeStatus.PASS : GradeStatus.FAIL);
        courseGrade.setGradedAt(LocalDateTime.now());
        
        CourseGrade savedGrade = courseGradeRepository.save(courseGrade);
        
        // AUTO CERTIFICATE: Tự động kiểm tra và cấp chứng chỉ 100%
        triggerAutomaticCertificateCheck(studentId, finalClassId);
        
        return savedGrade;
    }
}
