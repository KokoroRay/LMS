package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.model.Enrollment;
import jakarta.persistence.EntityManager;
import com.ra.base_spring_boot.dto.ClassDTO;
import com.ra.base_spring_boot.dto.req.ClassRequestDTO;
import com.ra.base_spring_boot.dto.req.ClassSubjectAssignmentDTO;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.mapper.ClassMapper;
import com.ra.base_spring_boot.model.ClassCourseTeacherAssignment;
import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.CourseCategory;
import com.ra.base_spring_boot.model.Exam;
import com.ra.base_spring_boot.model.Notification;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.ClassStatus;
import com.ra.base_spring_boot.model.constants.EnrollmentStatus;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.IClassService;
import com.ra.base_spring_boot.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import com.ra.base_spring_boot.dto.req.ClassSubjectAssignmentDTO;
import com.ra.base_spring_boot.model.constants.RoleName;

@Service
@RequiredArgsConstructor
public class ClassServiceImpl implements IClassService {

    private final ClassRepository classRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassMapper classMapper;
    private final CourseCategoryRepository categoryRepository;
    private final ClassCourseTeacherAssignmentRepository assignmentRepository;
    private final TimetableRepository timetableRepository;
    private final ExamRepository examRepository;
    private final ExamSlotRepository examSlotRepository;
    private final ExamResultRepository examResultRepository;
    private final EntityManager entityManager;
    
    // Thêm NotificationService để gửi thông báo cho teacher
    private final NotificationService notificationService;

    private void syncAssignments(ClassEntity existingClass, Set<ClassCourseTeacherAssignment> savedAssignments) {
        existingClass.getClassCourseTeacherAssignments().clear();
        existingClass.getClassCourseTeacherAssignments().addAll(savedAssignments);
    }

    private Set<ClassCourseTeacherAssignment> saveAssignments(ClassEntity classEntity, Set<ClassSubjectAssignmentDTO> assignmentsDTO) {
        if (assignmentsDTO == null || assignmentsDTO.isEmpty()) {
            throw new IllegalArgumentException("Class must have at least one subject assigned.");
        }

        CourseCategory category = categoryRepository.findById(classEntity.getCategory().getCategoryId())
                .orElseThrow(() -> new HttpNotFound("Category not found with id: " + classEntity.getCategory().getCategoryId()));
        classEntity.setCategory(category);


        // Lưu danh sách assignments cũ để so sánh (bao gồm cả courseId và teacherId)
        Set<String> existingAssignments = new HashSet<>(); // Format: "courseId:teacherId"
        List<ClassCourseTeacherAssignment> oldAssignments = new ArrayList<>();
        
        if(classEntity.getClassId() != null) {
            List<ClassCourseTeacherAssignment> existingAssignmentsList = assignmentRepository.findByClassEntityClassId(classEntity.getClassId());
            oldAssignments = new ArrayList<>(existingAssignmentsList);
            
            for (ClassCourseTeacherAssignment oldAssignment : existingAssignmentsList) {
                String key = oldAssignment.getCourse().getCourseId() + ":" + oldAssignment.getTeacher().getId();
                existingAssignments.add(key);
            }
            
            assignmentRepository.deleteAllByClassEntity(classEntity);
            entityManager.flush();
        }


        Set<ClassCourseTeacherAssignment> newAssignments = new HashSet<>();
        Set<Integer> processedCourseIds = new HashSet<>();
        Set<String> newAssignmentsKeys = new HashSet<>(); // Để so sánh với cũ

        for (ClassSubjectAssignmentDTO assignmentDTO : assignmentsDTO) {
            if (processedCourseIds.contains(assignmentDTO.getCourseId())) {
                continue;
            }

            Course course = courseRepository.findById(assignmentDTO.getCourseId())
                    .orElseThrow(() -> new HttpNotFound("Course not found: " + assignmentDTO.getCourseId()));

            User teacher = userRepository.findById(assignmentDTO.getTeacherId())
                    .orElseThrow(() -> new HttpNotFound("Teacher not found: " + assignmentDTO.getTeacherId()));

            ClassCourseTeacherAssignment assignment = ClassCourseTeacherAssignment.builder()
                    .classEntity(classEntity)
                    .course(course)
                    .teacher(teacher)
                    .build();

            ClassCourseTeacherAssignment savedAssignment = assignmentRepository.save(assignment);
            newAssignments.add(savedAssignment);

            String newKey = assignmentDTO.getCourseId() + ":" + assignmentDTO.getTeacherId();
            newAssignmentsKeys.add(newKey);

            // ===== GỬI THÔNG BÁO CHO TEACHER MỚI =====
            // Chỉ gửi thông báo nếu assignment mới (không có trong danh sách cũ)
            // Hoặc nếu là class mới (classId == null)
            boolean isNewAssignment = classEntity.getClassId() == null || 
                                     !existingAssignments.contains(newKey);
            
            if (isNewAssignment) {
                String title = "Bạn đã được phân công vào lớp học";
                String message = String.format("Bạn đã được phân công vào lớp học: %s (Môn học: %s)", 
                        classEntity.getClassName(), course.getTitle());
                
                // Tạo thông báo và lưu vào database
                Notification notification = notificationService.createNotification(
                        teacher.getId(),  // Gửi cho teacher này
                        title,            // Tiêu đề
                        message          // Nội dung
                );
                
                // Gửi thông báo real-time qua WebSocket
                notificationService.sendNotificationToUser(teacher.getId(), notification);
            }
            // ===== KẾT THÚC PHẦN THÔNG BÁO MỚI =====

            processedCourseIds.add(assignmentDTO.getCourseId());
        }

        // ===== GỬI THÔNG BÁO CHO TEACHER BỊ XÓA/THAY THẾ =====
        if (classEntity.getClassId() != null && !oldAssignments.isEmpty()) {
            for (ClassCourseTeacherAssignment oldAssignment : oldAssignments) {
                String oldKey = oldAssignment.getCourse().getCourseId() + ":" + oldAssignment.getTeacher().getId();
                
                // Nếu assignment cũ không có trong danh sách mới → teacher bị xóa hoặc bị thay thế
                if (!newAssignmentsKeys.contains(oldKey)) {
                    User oldTeacher = oldAssignment.getTeacher();
                    Course oldCourse = oldAssignment.getCourse();
                    
                    String title = "Bạn đã được xóa khỏi lớp học";
                    String message = String.format("Bạn đã được xóa khỏi lớp học: %s (Môn học: %s)", 
                            classEntity.getClassName(), oldCourse.getTitle());
                    
                    // Tạo thông báo và lưu vào database
                    Notification notification = notificationService.createNotification(
                            oldTeacher.getId(),  // Gửi cho teacher cũ
                            title,               // Tiêu đề
                            message             // Nội dung
                    );
                    
                    // Gửi thông báo real-time qua WebSocket
                    notificationService.sendNotificationToUser(oldTeacher.getId(), notification);
                }
            }
        }
        // ===== KẾT THÚC PHẦN THÔNG BÁO XÓA =====

        return newAssignments;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassDTO> getAllClasses() {
        return classRepository.findAll().stream().map(this::enrichClassDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ClassDTO getClassById(Integer id) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new HttpNotFound("Class not found with id: " + id));
        return enrichClassDTO(classEntity);
    }

    @Override
    @Transactional
    public ClassDTO createClass(ClassRequestDTO classRequestDTO) {
        if (classRequestDTO.getAssignments() == null || classRequestDTO.getAssignments().isEmpty()) {
            throw new IllegalArgumentException("Class must have at least one subject assigned.");
        }

        ClassEntity classEntity = classMapper.toEntity(classRequestDTO);

        CourseCategory category = categoryRepository.findById(classRequestDTO.getCategoryId())
                .orElseThrow(() -> new HttpNotFound("Category not found with id: " + classRequestDTO.getCategoryId()));
        classEntity.setCategory(category);

        ClassEntity savedClass = classRepository.save(classEntity);

        Set<ClassCourseTeacherAssignment> savedAssignments = saveAssignments(savedClass, classRequestDTO.getAssignments());

        syncAssignments(savedClass, savedAssignments);

        return enrichClassDTO(savedClass);
    }

    @Override
    @Transactional
    public ClassDTO updateClass(Integer classId, ClassRequestDTO classRequestDTO) {
        ClassEntity existingClass = classRepository.findById(classId)
                .orElseThrow(() -> new HttpNotFound("Class not found with id: " + classId));

        if (classRequestDTO.getAssignments() == null || classRequestDTO.getAssignments().isEmpty()) {
            throw new IllegalArgumentException("Class must have at least one subject assigned.");
        }

        if (classRequestDTO.getClassName() != null) {
            existingClass.setClassName(classRequestDTO.getClassName());
        }
        if (classRequestDTO.getStartDate() != null) {
            existingClass.setStartDate(classRequestDTO.getStartDate());
        }
        if (classRequestDTO.getEndDate() != null) {
            existingClass.setEndDate(classRequestDTO.getEndDate());
        }
        if (classRequestDTO.getCapacity() != null) {
            existingClass.setCapacity(classRequestDTO.getCapacity());
        }
        if (classRequestDTO.getStatus() != null) {
            existingClass.setStatus(classRequestDTO.getStatus());
        }
        if (classRequestDTO.getCategoryId() != null && !existingClass.getCategory().getCategoryId().equals(classRequestDTO.getCategoryId())) {
            CourseCategory category = categoryRepository.findById(classRequestDTO.getCategoryId())
                    .orElseThrow(() -> new HttpNotFound("Category not found with id: " + classRequestDTO.getCategoryId()));
            existingClass.setCategory(category);
        }

        Set<ClassCourseTeacherAssignment> savedAssignments = saveAssignments(existingClass, classRequestDTO.getAssignments());
        syncAssignments(existingClass, savedAssignments);

        existingClass.setUpdatedAt(LocalDateTime.now());

        return enrichClassDTO(existingClass);
    }

    @Override
    @Transactional
    public void deleteClass(Integer classId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new HttpNotFound("Class not found with id: " + classId));

        // 1. Delete Timetables
        timetableRepository.deleteAllByClassEntity(classEntity);

        // 2. Delete Enrollments
        enrollmentRepository.deleteAllByClassEntity(classEntity);

        // 3. Delete Teacher Assignments
        assignmentRepository.deleteAllByClassEntity(classEntity);

        // 4. Delete Exams and their dependent ExamSlots/ExamResults
        List<Exam> exams = examRepository.findAllByClassEntity(classEntity);
        for (Exam exam : exams) {
            // Before deleting an exam, delete its results and slots
            examResultRepository.deleteAllByExam(exam);
            examSlotRepository.deleteAllByExam(exam);
        }
        // Now delete all exams for the class
        examRepository.deleteAll(exams);

        // 5. Finally, delete the class
        classRepository.delete(classEntity);
    }

    @Override
    @Transactional
    public ClassDTO updateStatus(Integer id, ClassStatus status) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new HttpNotFound("Class not found"));
        classEntity.setStatus(status);
        classEntity.setUpdatedAt(LocalDateTime.now());
        return enrichClassDTO(classEntity);
    }

    @Override
    public Long countStudentsInClass(Integer classId) {
        return enrollmentRepository.countByClassEntityClassIdAndStatus(classId, EnrollmentStatus.ACTIVE);
    }

    private ClassDTO enrichClassDTO(ClassEntity classEntity) {
        ClassDTO classDTO = classMapper.toDTO(classEntity);

        Long studentCount = countStudentsInClass(classEntity.getClassId());
        classDTO.setCurrentStudents(studentCount != null ? studentCount.intValue() : 0);

        Set<ClassSubjectAssignmentDTO> assignmentDTOs = classEntity.getClassCourseTeacherAssignments().stream()
                .map(assignment -> ClassSubjectAssignmentDTO.builder()
                        .courseId(assignment.getCourse().getCourseId())
                        .teacherId(assignment.getTeacher().getId())
                        .build())
                .collect(Collectors.toSet());

        classDTO.setAssignments(assignmentDTOs);

        return classDTO;
    }

    @Override
    @Transactional
    public void bulkEnrollStudents(Integer classId, List<Integer> studentIds) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found with ID: " + classId));

        List<User> students = userRepository.findAllById(studentIds);

        if (students.size() != studentIds.size()) {
            Set<Integer> foundIds = students.stream().map(User::getId).collect(Collectors.toSet());
            List<Integer> notFound = studentIds.stream().filter(id -> !foundIds.contains(id)).collect(Collectors.toList());
            throw new IllegalArgumentException("One or more student IDs are invalid or not found: " + notFound);
        }

        List<Enrollment> newEnrollments = new ArrayList<>();
        for(User student : students) {

            if(!enrollmentRepository.existsByStudentIdAndClassEntityClassId(student.getId(), classId)) {
                Enrollment enrollment = Enrollment.builder()
                        .classEntity(classEntity)
                        .student(student)
                        .status(EnrollmentStatus.ACTIVE)
                        .enrolledAt(LocalDateTime.now())
                        .build();
                newEnrollments.add(enrollment);
            }
        }

        if(!newEnrollments.isEmpty()) {
            enrollmentRepository.saveAll(newEnrollments);
        }
    }

    @Override
    @Transactional
    public ClassSubjectAssignmentDTO addTeacherToClass(Integer classId, ClassSubjectAssignmentDTO assignmentDTO) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new HttpNotFound("Class not found with id: " + classId));

        Course course = courseRepository.findById(assignmentDTO.getCourseId())
                .orElseThrow(() -> new HttpNotFound("Course not found: " + assignmentDTO.getCourseId()));

        User teacher = userRepository.findById(assignmentDTO.getTeacherId())
                .orElseThrow(() -> new HttpNotFound("Teacher not found: " + assignmentDTO.getTeacherId()));

        // Kiểm tra role
        if (teacher.getRole() == null || teacher.getRole().getRoleName() != RoleName.ROLE_MODERATOR) {
            throw new RuntimeException("User is not a teacher");
        }

        // Kiểm tra đã được assign chưa
        if (assignmentRepository.existsByClassEntityClassIdAndCourseCourseIdAndTeacherId(
                classId, assignmentDTO.getCourseId(), assignmentDTO.getTeacherId())) {
            throw new RuntimeException("Teacher already assigned to this course in this class");
        }

        // Tạo assignment và lưu vào database
        ClassCourseTeacherAssignment assignment = ClassCourseTeacherAssignment.builder()
                .classEntity(classEntity)
                .course(course)
                .teacher(teacher)
                .build();

        ClassCourseTeacherAssignment savedAssignment = assignmentRepository.save(assignment);

        // ===== GỬI THÔNG BÁO CHO TEACHER =====
        String title = "Bạn đã được thêm vào lớp học";
        String message = String.format("Bạn đã được thêm vào lớp học: %s (Môn học: %s)",
                classEntity.getClassName(), course.getTitle());
        
        // Tạo thông báo và lưu vào database
        Notification notification = notificationService.createNotification(
                teacher.getId(),  // Gửi cho teacher này
                title,            // Tiêu đề
                message          // Nội dung
        );
        
        // Gửi thông báo real-time qua WebSocket
        notificationService.sendNotificationToUser(teacher.getId(), notification);
        // ===== KẾT THÚC PHẦN THÔNG BÁO =====

        return ClassSubjectAssignmentDTO.builder()
                .courseId(savedAssignment.getCourse().getCourseId())
                .teacherId(savedAssignment.getTeacher().getId())
                .build();
    }

    @Override
    @Transactional
    public void removeTeacherFromClass(Integer classId, Integer courseId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new HttpNotFound("Class not found with id: " + classId));

        ClassCourseTeacherAssignment assignment = assignmentRepository
                .findByClassEntityClassIdAndCourseCourseId(classId, courseId)
                .orElseThrow(() -> new HttpNotFound("Teacher assignment not found"));

        User teacher = assignment.getTeacher();
        Course course = assignment.getCourse();
        String className = classEntity.getClassName();

        // ===== GỬI THÔNG BÁO CHO TEACHER =====
        String title = "Bạn bị xóa khỏi lớp học";
        String message = String.format("Bạn đã bị xóa khỏi lớp học: %s (Môn học: %s)",
                className, course.getTitle());

        Notification notification = notificationService.createNotification(
                teacher.getId(),  // Gửi cho teacher này
                title,            // Tiêu đề
                message          // Nội dung
        );

        notificationService.sendNotificationToUser(teacher.getId(), notification);
        // ===== KẾT THÚC PHẦN THÔNG BÁO =====

        // Xóa assignment
        assignmentRepository.delete(assignment);
    }
}