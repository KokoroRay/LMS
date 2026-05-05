package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.resp.ReEnrollmentDTO;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.ReEnrollmentStatus;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.CourseGradeService;
import com.ra.base_spring_boot.services.MailService;
import com.ra.base_spring_boot.services.ReEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReEnrollmentServiceImpl implements ReEnrollmentService {

    private final ReEnrollmentRepository reEnrollmentRepository;
    private final UserRepository userRepository;
    private final CourseGradeRepository courseGradeRepository;
    private final CourseGradeService courseGradeService;
    private final MailService mailService;

    @Override
    public List<ReEnrollmentDTO> getAllByStudent(Integer studentId) {
        return reEnrollmentRepository.findByStudentId(studentId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    @Override
    public List<ReEnrollmentDTO> getAllForAdmin() {
        return reEnrollmentRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReEnrollmentDTO> getAll() {
        return reEnrollmentRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }


    @Transactional
    @Override
    public ReEnrollmentDTO createReEnrollment(Integer studentId, Integer failedCourseGradeId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student không tồn tại"));

        CourseGrade failedGrade = courseGradeRepository.findById(failedCourseGradeId)
                .orElseThrow(() -> new RuntimeException("Failed grade không tồn tại"));

        ReEnrollment reEnrollment = ReEnrollment.builder()
                .student(student)
                .failedCourseGrade(failedGrade)
                .amount(failedGrade.getCourse().getPrice())
                .currency("VND")
                .status(ReEnrollmentStatus.PENDING)
                .build();

        reEnrollmentRepository.save(reEnrollment);
        return toDTO(reEnrollment);
    }

    @Override
    @Transactional
    public void updateStatus(Integer reEnrollmentId, ReEnrollmentStatus status) {
        ReEnrollment reEnrollment = reEnrollmentRepository.findById(reEnrollmentId)
                .orElseThrow(() -> new RuntimeException("ReEnrollment không tồn tại"));
        reEnrollment.setStatus(status);
        reEnrollmentRepository.save(reEnrollment);
    }

    @Transactional
    @Override
    public void completeReEnrollment(Integer reEnrollmentId, Double assignmentScore, Double quizScore, Double examScore) {
        ReEnrollment reEnrollment = reEnrollmentRepository.findById(reEnrollmentId)
                .orElseThrow(() -> new RuntimeException("ReEnrollment không tồn tại"));

        if (reEnrollment.getStatus() != ReEnrollmentStatus.PAYMENT_SUCCESS &&
                reEnrollment.getStatus() != ReEnrollmentStatus.ENROLLED) {
            throw new RuntimeException("Học lại chưa thanh toán hoặc chưa enroll");
        }

        // Cập nhật trạng thái COMPLETED
        reEnrollment.setStatus(ReEnrollmentStatus.COMPLETED);
        reEnrollmentRepository.save(reEnrollment);

        // Cập nhật CourseGrade
        CourseGrade grade = reEnrollment.getFailedCourseGrade();
        grade.setAssignmentScore(assignmentScore);
        grade.setQuizScore(quizScore);
        grade.setExamScore(examScore);

        // Tính lại điểm cuối kỳ và trạng thái PASS/FAIL
        courseGradeService.calculateCourseGrade(
                grade.getStudent().getId(),
                grade.getClassEntity().getClassId(),
                grade.getCourse().getCourseId()
        );

        // Gửi mail thông báo
        String emailContent = """
                Xin chào %s,
                
                Bạn đã hoàn tất học lại môn: %s
                Điểm cuối kỳ: %.2f
                Trạng thái: %s
                """.formatted(
                grade.getStudent().getFirstName(),
                grade.getCourse().getTitle(),
                grade.getFinalScore(),
                grade.getStatus().name()
        );

        try {
            mailService.sendHtmlMail(
                    grade.getStudent().getEmail(),
                    "Hoàn tất học lại môn học",
                    emailContent
            );
            System.out.println("Đã gửi mail hoàn tất học lại tới " + grade.getStudent().getEmail());
        } catch (Exception e) {
            System.err.println("Lỗi gửi mail hoàn tất học lại: " + e.getMessage());
        }
    }

    @Override
    public List<ReEnrollmentDTO> getPaidReEnrollments() {
        return List.of();
    }

    @Override
    public void activateRetakeExam(Integer reEnrollmentId, Integer adminId) {

    }

    @Override
    public List<ReEnrollmentDTO> getPendingActivationReEnrollments() {
        return List.of();
    }

    private ReEnrollmentDTO toDTO(ReEnrollment re) {
        return ReEnrollmentDTO.builder()
                .id(re.getReEnrollmentId())
                .studentId(re.getStudent().getId())
                .failedCourseGradeId(re.getFailedCourseGrade().getCourseGradeId())
                .newClassId(re.getNewClass() != null ? re.getNewClass().getClassId() : null)
                .paymentId(re.getPayment() != null ? re.getPayment().getPaymentId() : null)
                .amount(re.getAmount())
                .currency(re.getCurrency())
                .status(re.getStatus().name())
                .notes(re.getNotes())
                .updatedAt(re.getUpdatedAt())
                .build();
    }
}
