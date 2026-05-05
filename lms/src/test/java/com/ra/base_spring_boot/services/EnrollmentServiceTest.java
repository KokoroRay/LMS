package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.EnrollmentDTO;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.EnrollmentStatus;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.repository.ClassRepository;
import com.ra.base_spring_boot.repository.EnrollmentRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.services.impl.EnrollmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Enrollment Service Tests")
class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private ClassRepository classRepository;
    
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private EnrollmentServiceImpl enrollmentService;

    private ClassEntity testClass;
    private User testStudent;
    private Role studentRole;
    private Enrollment testEnrollment;

    @BeforeEach
    void setUp() {
        studentRole = Role.builder()
                .roleName(RoleName.ROLE_USER)
                .build();

        testClass = ClassEntity.builder()
                .classId(1)
                .className("Java Programming Class")
                .build();

        testStudent = User.builder()
                .username("student1")
                .email("student1@example.com")
                .firstName("John")
                .lastName("Doe")
                .role(studentRole)
                .build();

        testEnrollment = Enrollment.builder()
                .enrollmentId(1)
                .classEntity(testClass)
                .student(testStudent)
                .progress(0.0)
                .status(EnrollmentStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Should return students by class successfully")
    void getStudentsByClass_ShouldReturnStudents_WhenClassExists() {
        List<Enrollment> enrollments = Arrays.asList(testEnrollment);
        when(classRepository.findById(1)).thenReturn(Optional.of(testClass));
        when(enrollmentRepository.findByClassEntity(testClass)).thenReturn(enrollments);

        List<EnrollmentDTO> result = enrollmentService.getStudentsByClass(1);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(classRepository).findById(1);
        verify(enrollmentRepository).findByClassEntity(testClass);
    }

    @Test
    @DisplayName("Should add student to class successfully")
    void addStudentToClass_ShouldAddStudent_WhenValidData() {
        when(classRepository.findById(1)).thenReturn(Optional.of(testClass));
        when(userRepository.findById(1)).thenReturn(Optional.of(testStudent));
        when(enrollmentRepository.findByClassEntityAndStudent(testClass, testStudent)).thenReturn(Optional.empty());
        when(enrollmentRepository.existsByStudentAndStatusAndClassEntity_ClassIdNot(testStudent, EnrollmentStatus.ACTIVE, 1)).thenReturn(false);
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(testEnrollment);
        when(notificationService.createNotification(anyInt(), anyString(), anyString())).thenReturn(new Notification());

        EnrollmentDTO result = enrollmentService.addStudentToClass(1, 1);

        assertNotNull(result);
        verify(enrollmentRepository).save(any(Enrollment.class));
        verify(notificationService).createNotification(eq(1), anyString(), anyString());
        verify(notificationService).sendNotificationToUser(eq(1), any(Notification.class));
    }

    @Test
    @DisplayName("Should throw exception when class not found")
    void addStudentToClass_ShouldThrowException_WhenClassNotFound() {
        when(classRepository.findById(999)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> enrollmentService.addStudentToClass(999, 1)
        );
        assertEquals("Class not found", exception.getMessage());
        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should remove student from class successfully")
    void removeStudentFromClass_ShouldRemoveStudent_WhenValidData() {
        when(classRepository.findById(1)).thenReturn(Optional.of(testClass));
        when(userRepository.findById(1)).thenReturn(Optional.of(testStudent));
        when(enrollmentRepository.findByClassEntityAndStudent(testClass, testStudent)).thenReturn(Optional.of(testEnrollment));
        when(notificationService.createNotification(anyInt(), anyString(), anyString())).thenReturn(new Notification());

        enrollmentService.removeStudentFromClass(1, 1);

        verify(enrollmentRepository).delete(testEnrollment);
        verify(notificationService).createNotification(eq(1), anyString(), anyString());
        verify(notificationService).sendNotificationToUser(eq(1), any(Notification.class));
    }
}