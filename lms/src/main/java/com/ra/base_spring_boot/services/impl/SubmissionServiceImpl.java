package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.GradeSubmissionRequestDTO;
import com.ra.base_spring_boot.dto.req.SubmissionRequestDTO;
import com.ra.base_spring_boot.dto.resp.SubmissionResponseDTO;
import com.ra.base_spring_boot.events.GradeUpdatedEvent;
import com.ra.base_spring_boot.model.Assignment;
import com.ra.base_spring_boot.model.Notification;
import com.ra.base_spring_boot.model.Submission;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.AssignmentRepository;
import com.ra.base_spring_boot.repository.EnrollmentRepository;
import com.ra.base_spring_boot.repository.SubmissionRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.NotificationService;
import com.ra.base_spring_boot.services.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;
    private final EnrollmentRepository enrollmentRepository;

    @Override
    public SubmissionResponseDTO createSubmission(SubmissionRequestDTO dto) {
        Assignment assignment = assignmentRepository.findById(dto.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof MyUserDetails principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        Integer studentId = principal.getId();
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        LocalDateTime now = LocalDateTime.now();
        boolean isLate = false;
        long lateMinutes = 0;

        if (assignment.getDueDate() != null && now.isAfter(assignment.getDueDate())) {
            if (!assignment.getAllowLate()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deadline passed!");
            } else {
                isLate = true;
                lateMinutes = Duration.between(assignment.getDueDate(), now).toMinutes();
            }
        }

        // Lấy classId từ Enrollment (nếu có nhiều lớp, lấy lớp đầu tiên)
        // Lấy classId từ Enrollment (nếu có nhiều lớp, lấy lớp đầu tiên)
        List<Integer> classIds = enrollmentRepository.findClassIdByStudentIdAndCourseId(
                studentId, assignment.getCourse().getCourseId());
        Integer classId = classIds.isEmpty() ? null : classIds.get(0);

// Tạo ClassEntity chỉ với ID
        com.ra.base_spring_boot.model.ClassEntity classEntity = null;
        if (classId != null) {
            classEntity = new com.ra.base_spring_boot.model.ClassEntity();
            classEntity.setClassId(classId); // set ID thôi
        }

        Submission submission = Submission.builder()
                .assignment(assignment)
                .student(student)
                .classEntity(classEntity)
                .githubUrl(dto.getGithubUrl())
                .submittedAt(now)
                .attemptNumber(dto.getAttemptNumber() != null ? dto.getAttemptNumber() : 1)
                .build();

        submissionRepository.save(submission);
        return mapToDTO(submission, classId, isLate, lateMinutes);
    }

        @Override
    public List<SubmissionResponseDTO> getSubmissionsByAssignment(Integer assignmentId) {
        return submissionRepository.findByAssignment_AssignmentId(assignmentId)
                .stream()
                .map(s -> mapToDTO(s, s.getClassEntity() != null ? s.getClassEntity().getClassId() : null, null, null))
                .collect(Collectors.toList());
    }

    @Override
    public List<SubmissionResponseDTO> getSubmissionsByStudent(Integer studentId) {
        return submissionRepository.findByStudent_Id(studentId)
                .stream()
                .map(s -> mapToDTO(s, s.getClassEntity() != null ? s.getClassEntity().getClassId() : null, null, null))
                .collect(Collectors.toList());
    }

    @Override
    public SubmissionResponseDTO getMySubmissionForAssignment(Integer assignmentId, Integer attemptNumber) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof MyUserDetails principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        Integer studentId = principal.getId();
        Integer finalAttemptNumber = attemptNumber != null ? attemptNumber : 1;

        Submission submission = submissionRepository
                .findTopByAssignment_AssignmentIdAndStudent_IdAndAttemptNumberOrderBySubmittedAtDesc(assignmentId, studentId, finalAttemptNumber)
                .orElse(null);

        if (submission == null) return null;

        Integer classId = submission.getClassEntity() != null ? submission.getClassEntity().getClassId() : null;
        return mapToDTO(submission, classId, null, null);
    }

    @Override
    @Transactional
    public SubmissionResponseDTO gradeSubmission(Integer submissionId, GradeSubmissionRequestDTO dto) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof MyUserDetails principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        User teacher = userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        submission.setGrade(dto.getGrade());
        submission.setFeedback(dto.getFeedback());
        submission.setGradedBy(teacher);
        submission.setGradedAt(LocalDateTime.now());
        submissionRepository.save(submission);

        Integer studentId = submission.getStudent().getId();
        Integer courseId = submission.getAssignment().getCourse().getCourseId();
        Integer classId = submission.getClassEntity() != null ? submission.getClassEntity().getClassId() : null;

        // Bắn event
        eventPublisher.publishEvent(new GradeUpdatedEvent(this, studentId, classId, courseId));

        // Gửi thông báo
        String title = "Bài tập đã được chấm điểm";
        String message = String.format("Bài tập %s: %.1f điểm - %s",
                submission.getAssignment().getTitle(), dto.getGrade(),
                dto.getFeedback() != null ? dto.getFeedback() : "Không có nhận xét");
        try {
            Notification notification = notificationService.createNotification(studentId, title, message);
            notificationService.sendNotificationToUser(studentId, notification);
        } catch (Exception e) {
            System.err.println("Failed to send grade notification to student " + studentId);
        }

        return mapToDTO(submission, classId, null, null);
    }

    @Override
    public SubmissionResponseDTO getLatestSubmissionForAssignment(Integer assignmentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof MyUserDetails principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        Integer studentId = principal.getId();

        Submission submission = submissionRepository
                .findTopByAssignment_AssignmentIdAndStudent_IdOrderBySubmittedAtDesc(assignmentId, studentId)
                .orElse(null);

        if (submission == null) return null;

        Integer classId = submission.getClassEntity() != null ? submission.getClassEntity().getClassId() : null;
        return mapToDTO(submission, classId, null, null);
    }

    @Override
    public SubmissionResponseDTO getLatestSubmissionForAssignmentAndClass(Integer assignmentId, Integer studentId, Integer classId) {
        Submission submission = submissionRepository
                .findTopByAssignment_AssignmentIdAndStudent_IdAndClassEntity_ClassIdOrderBySubmittedAtDesc(assignmentId, studentId, classId)
                .orElse(null);

        if (submission == null) return null;

        Integer submissionClassId = submission.getClassEntity() != null ? submission.getClassEntity().getClassId() : null;
        return mapToDTO(submission, submissionClassId, null, null);
    }

    // ----- PRIVATE -----
    private SubmissionResponseDTO mapToDTO(Submission submission, Integer classId, Boolean isLate, Long lateMinutes) {
        SubmissionResponseDTO dto = new SubmissionResponseDTO();
        dto.setSubmissionId(submission.getSubmissionId());
        dto.setAssignmentId(submission.getAssignment().getAssignmentId());
        dto.setAssignmentTitle(submission.getAssignment().getTitle());
        dto.setStudentId(submission.getStudent().getId());
        dto.setStudentName(submission.getStudent().getFullName());
        dto.setClassId(classId);
        dto.setGithubUrl(submission.getGithubUrl());
        dto.setGrade(submission.getGrade());
        dto.setFeedback(submission.getFeedback());
        dto.setGradedByName(submission.getGradedBy() != null ? submission.getGradedBy().getFullName() : null);
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setGradedAt(submission.getGradedAt());
        dto.setIsLate(isLate);
        dto.setLateMinutes(lateMinutes);
        return dto;
    }
}
