package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.EnrollmentDTO;
import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.Enrollment;
import com.ra.base_spring_boot.model.Notification;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.EnrollmentStatus;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.repository.ClassRepository;
import com.ra.base_spring_boot.repository.EnrollmentRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.services.EnrollmentService;
import com.ra.base_spring_boot.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    
    // Thêm NotificationService để gửi thông báo
    private final NotificationService notificationService;

    @Override
    public List<EnrollmentDTO> getStudentsByClass(Integer classId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        return enrollmentRepository.findByClassEntity(classEntity)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public EnrollmentDTO addStudentToClass(Integer classId, Integer studentId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Kiểm tra role
        if (student.getRole() == null || student.getRole().getRoleName() != RoleName.ROLE_USER) {
            throw new RuntimeException("User is not a student");
        }

        // Kiểm tra đã đăng ký chưa
        if (enrollmentRepository.findByClassEntityAndStudent(classEntity, student).isPresent()) {
            throw new RuntimeException("Student already enrolled in this class");
        }

        // --- NEW VALIDATION: Check if student is already actively enrolled in ANY OTHER class ---
        if (enrollmentRepository.existsByStudentAndStatusAndClassEntity_ClassIdNot(student, EnrollmentStatus.ACTIVE, classId)) {
            // Fetch the class name for the error message (optional, but good for user feedback)
            // This might require another repo call or an entity join if not already available
            List<Enrollment> existingActiveEnrollments = enrollmentRepository.findByStudentAndStatusAndClassEntity_ClassIdNot(student, EnrollmentStatus.ACTIVE, classId);
            String existingClassName = "another class"; // Default message

            if (!existingActiveEnrollments.isEmpty()) {
                 existingClassName = existingActiveEnrollments.get(0).getClassEntity().getClassName();
            }

            throw new RuntimeException(
                "Student is already actively enrolled in: " + existingClassName
            );
        }
        // --- END NEW VALIDATION ---

        // Tạo enrollment và lưu vào database
        Enrollment enrollment = Enrollment.builder()
                .classEntity(classEntity)
                .student(student)
                .progress(0.0)
                .status(EnrollmentStatus.ACTIVE)
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        // ===== PHẦN MỚI: GỬI THÔNG BÁO REAL-TIME =====
        // 1. Tạo nội dung thông báo
        String title = "Bạn đã được thêm vào lớp học";
        String message = String.format("Bạn đã được thêm vào lớp học: %s", classEntity.getClassName());
        
        // 2. Tạo thông báo và lưu vào database
        Notification notification = notificationService.createNotification(
                studentId,  // Gửi cho student này
                title,      // Tiêu đề
                message     // Nội dung
        );
        
        // 3. Gửi thông báo real-time qua WebSocket
        // Nếu student đang online và đã kết nối WebSocket, sẽ nhận được ngay lập tức
        notificationService.sendNotificationToUser(studentId, notification);
        // ===== KẾT THÚC PHẦN MỚI =====

        return toDTO(savedEnrollment);
    }

    @Override
    public void removeStudentFromClass(Integer classId, Integer studentId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Enrollment enrollment = enrollmentRepository.findByClassEntityAndStudent(classEntity, student)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));


        String className = classEntity.getClassName();

        String title = "Bạn bị xóa khỏi lớp học";
        String message = String.format("Bạn đã bị xóa khỏi lớp học: %s", className);

        Notification notification = notificationService.createNotification(
                studentId,  // Gửi cho student này
                title,      // Tiêu đề
                message     // Nội dung
        );

        notificationService.sendNotificationToUser(studentId, notification);

        enrollmentRepository.delete(enrollment);
    }

    @Override
    public EnrollmentDTO updateStudentProgress(Integer classId, Integer studentId, Double progress, String status) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Enrollment enrollment = enrollmentRepository.findByClassEntityAndStudent(classEntity, student)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        enrollment.setProgress(progress);
        enrollment.setStatus(parseStatus(status));

        return toDTO(enrollmentRepository.save(enrollment));
    }

    private EnrollmentDTO toDTO(Enrollment e) {
        return EnrollmentDTO.builder()
                .enrollmentId(e.getEnrollmentId())
                .studentId(e.getStudent().getId())
                .studentName(e.getStudent().getFirstName() + " " + e.getStudent().getLastName())
                .progress(e.getProgress())
                .status(e.getStatus().name())
                .build();
    }

    private EnrollmentStatus parseStatus(String status) {
        try {
            return EnrollmentStatus.valueOf(status.toUpperCase());
        } catch (Exception e) {
            throw new RuntimeException("Invalid status value: " + status);
        }
    }

    @Override
    public void bulkAddStudentsToClass(Integer classId, List<Integer> studentIds) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        for (Integer studentId : studentIds) {
            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

            // Kiểm tra role
            if (student.getRole() == null || student.getRole().getRoleName() != RoleName.ROLE_USER) {
                throw new RuntimeException("User is not a student: " + studentId);
            }

            // Kiểm tra đã đăng ký chưa
            if (enrollmentRepository.findByClassEntityAndStudent(classEntity, student).isEmpty()) {
                Enrollment enrollment = Enrollment.builder()
                        .classEntity(classEntity)
                        .student(student)
                        .progress(0.0)
                        .status(EnrollmentStatus.ACTIVE)
                        .build();
                enrollmentRepository.save(enrollment);

                // ===== PHẦN MỚI: GỬI THÔNG BÁO CHO MỖI STUDENT =====
                String title = "Bạn đã được thêm vào lớp học";
                String message = String.format("Bạn đã được thêm vào lớp học: %s", classEntity.getClassName());
                
                // Tạo và gửi thông báo cho từng student
                Notification notification = notificationService.createNotification(
                        studentId, 
                        title, 
                        message
                );
                notificationService.sendNotificationToUser(studentId, notification);
                // ===== KẾT THÚC PHẦN MỚI =====
            }
        }
    }
}
