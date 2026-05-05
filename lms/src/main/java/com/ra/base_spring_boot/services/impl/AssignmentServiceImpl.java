// File: com/ra/base_spring_boot/services/impl/AssignmentServiceImpl.java
package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.AssignmentRequestDTO;
import com.ra.base_spring_boot.dto.resp.AssignmentDTO;
import com.ra.base_spring_boot.model.Assignment;
import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.Notification;
import com.ra.base_spring_boot.model.Session;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.AssignmentRepository;
import com.ra.base_spring_boot.repository.SessionRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.AssignmentService;
import com.ra.base_spring_boot.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final SessionRepository sessionRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentDTO> getAssignmentsBySession(Integer sessionId) {
        List<Assignment> assignments =
                assignmentRepository.findBySession_SessionIdOrderByPostedAtAsc(sessionId);
        return assignments.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public AssignmentDTO createAssignment(AssignmentRequestDTO dto) {
        if (dto.getSessionId() == null) {
            throw new RuntimeException("sessionId is required");
        }

        Session session = sessionRepository.findById(dto.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Course course = session.getCourse();
        if (course == null) {
            throw new RuntimeException("Session does not belong to any course");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof MyUserDetails)) {
            throw new RuntimeException("Unauthenticated");
        }

        LocalDateTime postedAt = dto.getPostedAt() != null ? dto.getPostedAt() : LocalDateTime.now();
        BigDecimal maxScore = dto.getMaxScore() != null ? dto.getMaxScore() : BigDecimal.valueOf(100);
        Boolean allowLate = dto.getAllowLate() != null ? dto.getAllowLate() : Boolean.FALSE;

        Assignment assignment = Assignment.builder()
                .session(session)
                .course(course) // Gán course
                // Không gán class (vì đã xóa cột)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .postedAt(postedAt)
                .dueDate(dto.getDueDate())
                .maxScore(maxScore)
                .allowLate(allowLate)
                .build();

        Assignment saved = assignmentRepository.save(assignment);

        // Gửi thông báo cho TẤT CẢ học viên đang học MÔN HỌC này
        List<User> students = userRepository.findStudentsByCourseId(course.getCourseId());
        String title = "Bài tập mới";
        String msg = String.format("Bài tập mới: %s - Hạn nộp: %s", saved.getTitle(), saved.getDueDate());

        for (User student : students) {
            try {
                Notification notification = notificationService.createNotification(
                        student.getId(), title, msg);
                notificationService.sendNotificationToUser(student.getId(), notification);
            } catch (Exception ignored) {}
        }

        return mapToDTO(saved);
    }

    @Override
    public AssignmentDTO updateAssignment(Integer assignmentId, AssignmentRequestDTO dto) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (dto.getSessionId() != null) {
            Session session = sessionRepository.findById(dto.getSessionId())
                    .orElseThrow(() -> new RuntimeException("Session not found"));
            assignment.setSession(session);
            if (session.getCourse() != null) {
                assignment.setCourse(session.getCourse());
            }
        }

        if (dto.getTitle() != null) {
            assignment.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            assignment.setDescription(dto.getDescription());
        }
        if (dto.getPostedAt() != null) {
            assignment.setPostedAt(dto.getPostedAt());
        }
        if (dto.getDueDate() != null) {
            assignment.setDueDate(dto.getDueDate());
        }
        if (dto.getMaxScore() != null) {
            assignment.setMaxScore(dto.getMaxScore());
        }
        if (dto.getAllowLate() != null) {
            assignment.setAllowLate(dto.getAllowLate());
        }

        Assignment updated = assignmentRepository.save(assignment);
        return mapToDTO(updated);
    }

    @Override
    public void deleteAssignment(Integer assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        assignmentRepository.delete(assignment);
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentDTO getAssignmentById(Integer assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        return mapToDTO(assignment);
    }

    private AssignmentDTO mapToDTO(Assignment assignment) {
        return AssignmentDTO.builder()
                .assignmentId(assignment.getAssignmentId())
                .sessionId(assignment.getSession().getSessionId())
                .courseId(assignment.getCourse().getCourseId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .postedAt(assignment.getPostedAt())
                .dueDate(assignment.getDueDate())
                .maxScore(assignment.getMaxScore())
                .allowLate(assignment.getAllowLate())
                .build();
    }
}