package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.ExamDTO;
import com.ra.base_spring_boot.dto.ExamQuestionDTO;
import com.ra.base_spring_boot.dto.ExamSlotDTO;
import com.ra.base_spring_boot.dto.req.*;
import com.ra.base_spring_boot.dto.resp.*;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.mapper.*;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.QuestionType;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.impl.ExamServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Exam Service Tests")
class ExamServiceTest {

    @Mock private ExamRepository examRepository;
    @Mock private ExamQuestionRepository examQuestionRepository;
    @Mock private ExamResultRepository examResultRepository;
    @Mock private ExamSlotRepository examSlotRepository;
    @Mock private ClassRepository classRepository;
    @Mock private UserRepository userRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private ClassCourseTeacherAssignmentRepository assignmentRepository;
    @Mock private StudentExamAttemptOverrideRepository studentExamAttemptOverrideRepository;
    @Mock private ObjectMapper objectMapper;
    @Mock private ExamMapper examMapper;
    @Mock private ExamSlotMapper examSlotMapper;
    @Mock private ExamQuestionMapper examQuestionMapper;
    @Mock private ExamResultMapper examResultMapper;
    @Mock private StudentExamAttemptOverrideMapper studentExamAttemptOverrideMapper;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ExamServiceImpl examService;

    private Exam testExam;
    private ExamDTO testExamDTO;
    private User testStudent;
    private User testInstructor;
    private ClassEntity testClass;
    private Course testCourse;
    private ExamSlot testExamSlot;

    @BeforeEach
    void setUp() {
        testClass = ClassEntity.builder()
                .classId(1)
                .className("Java Class")
                .build();

        testCourse = Course.builder()
                .courseId(1)
                .title("Java Programming")
                .build();

        testStudent = User.builder()
                .username("student1")
                .email("student1@example.com")
                .firstName("John")
                .lastName("Doe")
                .build();

        testInstructor = User.builder()
                .username("instructor1")
                .email("instructor1@example.com")
                .firstName("Jane")
                .lastName("Smith")
                .build();

        testExamSlot = ExamSlot.builder()
                .slotId(1)
                .slotTime(LocalDateTime.now().plusDays(1))
                .maxParticipants(30)
                .build();

        testExam = Exam.builder()
                .examId(1)
                .title("Java Midterm Exam")
                .description("Midterm exam for Java course")
                .durationMinutes(120)
                .totalMarks(100)
                .maxAttempts(2)
                .isPublished(true)
                .classEntity(testClass)
                .course(testCourse)
                .examSlots(Arrays.asList(testExamSlot))
                .build();

        testExamDTO = ExamDTO.builder()
                .examId(1)
                .title("Java Midterm Exam")
                .description("Midterm exam for Java course")
                .durationMinutes(120)
                .totalMarks(100)
                .maxAttempts(2)
                .isPublished(true)
                .classId(1)
                .courseId(1)
                .build();
    }

    @Test
    @DisplayName("Should return all exams successfully")
    void getAllExams_ShouldReturnAllExams() {
        List<Exam> exams = Arrays.asList(testExam);
        when(examRepository.findAll()).thenReturn(exams);
        when(examMapper.toDTOList(exams)).thenReturn(Arrays.asList(testExamDTO));

        List<ExamDTO> result = examService.getAllExams();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Java Midterm Exam", result.get(0).getTitle());
        verify(examRepository).findAll();
        verify(examMapper).toDTOList(exams);
    }

    @Test
    @DisplayName("Should return exams by class with pagination")
    void getExamByClass_ShouldReturnExamsWithPagination() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Exam> examPage = new PageImpl<>(Arrays.asList(testExam), pageable, 1);
        when(examRepository.findByClassEntity_ClassId(1, pageable)).thenReturn(examPage);
        when(examMapper.toDTOList(Arrays.asList(testExam))).thenReturn(Arrays.asList(testExamDTO));

        Page<ExamDTO> result = examService.getExamByClass(1, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Java Midterm Exam", result.getContent().get(0).getTitle());
        verify(examRepository).findByClassEntity_ClassId(1, pageable);
    }

    @Test
    @DisplayName("Should return available exams for student")
    void getAvailableExamsForStudent_ShouldReturnAvailableExams() {
        when(userRepository.existsById(1)).thenReturn(true);
        when(enrollmentRepository.findActiveClassIdsByStudentId(1)).thenReturn(Arrays.asList(1));
        when(examRepository.findActiveExamsByClass(eq(1), any(LocalDateTime.class))).thenReturn(Arrays.asList(testExam));
        when(examResultRepository.findByStudent_Id(1)).thenReturn(Collections.emptyList());
        when(examMapper.toDTOList(Arrays.asList(testExam))).thenReturn(Arrays.asList(testExamDTO));

        List<ExamDTO> result = examService.getAvailableExamsForStudent(1);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Java Midterm Exam", result.get(0).getTitle());
        verify(userRepository).existsById(1);
        verify(enrollmentRepository).findActiveClassIdsByStudentId(1);
    }

    @Test
    @DisplayName("Should return exam details for student when can attempt")
    void getExamDetailsForStudent_ShouldReturnDetails_WhenCanAttempt() {
        testExamSlot.setSlotTime(LocalDateTime.now().minusMinutes(30));
        when(examRepository.findByExamIdAndIsPublishedTrue(1)).thenReturn(Optional.of(testExam));
        when(enrollmentRepository.existsByStudentIdAndClassEntityClassId(1, 1)).thenReturn(true);
        when(examResultRepository.countByExam_ExamIdAndStudent_IdAndSubmittedAtIsNotNull(1, 1)).thenReturn(0);
        when(studentExamAttemptOverrideRepository.findByStudent_IdAndExam_ExamId(1, 1)).thenReturn(Optional.empty());
        when(examMapper.toDTO(testExam)).thenReturn(testExamDTO);
        when(examSlotMapper.toDTOList(anyList())).thenReturn(Arrays.asList(new ExamSlotDTO()));

        ExamDetailDTO result = examService.getExamDetailsForStudent(1, 1);

        assertNotNull(result);
        assertTrue(result.getCanAttempt());
        assertEquals(2, result.getRemainingAttempts());
        verify(examRepository).findByExamIdAndIsPublishedTrue(1);
    }

    @Test
    @DisplayName("Should create exam successfully")
    void createExam_ShouldCreateExam_WhenValidData() {
        ExamRequestDTO examRequestDTO = ExamRequestDTO.builder()
                .title("New Exam")
                .classId(1)
                .courseId(1)
                .examSlots(Arrays.asList(new ExamSlotRequestDTO()))
                .build();

        when(assignmentRepository.existsByClassEntityClassIdAndCourseCourseIdAndTeacherId(1, 1, 2)).thenReturn(true);
        when(classRepository.findById(1)).thenReturn(Optional.of(testClass));
        when(courseRepository.findById(1)).thenReturn(Optional.of(testCourse));
        when(examMapper.toEntity(examRequestDTO)).thenReturn(testExam);
        when(examRepository.save(testExam)).thenReturn(testExam);
        when(examSlotMapper.toEntityList(anyList())).thenReturn(Arrays.asList(testExamSlot));
        when(examSlotRepository.saveAll(anyList())).thenReturn(Arrays.asList(testExamSlot));
        when(userRepository.findStudentsByClassId(1)).thenReturn(Arrays.asList(testStudent));
        when(notificationService.createNotification(anyInt(), anyString(), anyString())).thenReturn(new Notification());
        when(examMapper.toDTO(testExam)).thenReturn(testExamDTO);

        ExamDTO result = examService.createExam(examRequestDTO, 2);

        assertNotNull(result);
        verify(examRepository).save(testExam);
        verify(notificationService).createNotification(anyInt(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should delete exam successfully when exists")
    void deleteExam_ShouldDeleteExam_WhenExamExists() {
        testExam.setExamSlots(Arrays.asList(testExamSlot));
        testExam.setExamQuestions(Collections.emptyList());
        
        when(examRepository.findById(1)).thenReturn(Optional.of(testExam));
        when(studentExamAttemptOverrideRepository.findByExam_ExamId(1)).thenReturn(Collections.emptyList());

        examService.deleteExam(1);

        verify(examResultRepository).deleteAllByExamSlot_SlotIdIn(anyList());
        verify(examRepository).deleteById(1);
    }
}