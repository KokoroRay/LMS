package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.resp.CourseDTO;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.CourseLevel;
import com.ra.base_spring_boot.model.constants.CourseStatus;
import com.ra.base_spring_boot.model.constants.UserStatus;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.impl.CourseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Course Service Tests")
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;
    
    @Mock
    private CourseCategoryRepository categoryRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private GradingPolicyRepository gradingPolicyRepository;

    @InjectMocks
    private CourseServiceImpl courseService;

    private Course testCourse;
    private CourseDTO testCourseDTO;
    private CourseCategory testCategory;
    private User testUser;

    @BeforeEach
    void setUp() {
        testCategory = CourseCategory.builder()
                .categoryId(1)
                .name("Programming")
                .build();

        testUser = User.builder()
                .username("teacher1")
                .status(UserStatus.ACTIVE)
                .build();

        testCourse = Course.builder()
                .courseId(1)
                .title("Java Programming")
                .slug("java-programming")
                .shortDescription("Learn Java basics")
                .description("Complete Java course")
                .price(new BigDecimal("99.99"))
                .level(CourseLevel.Beginner)
                .status(CourseStatus.DRAFT)
                .category(testCategory)
                .createdBy(testUser)
                .courseInstructors(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testCourseDTO = CourseDTO.builder()
                .title("Java Programming")
                .slug("java-programming")
                .shortDescription("Learn Java basics")
                .description("Complete Java course")
                .price(new BigDecimal("99.99"))
                .level(CourseLevel.Beginner)
                .status(CourseStatus.DRAFT)
                .categoryId(1)
                .createdById(1)
                .teacherIds(Set.of(1))
                .build();
    }

    @Test
    @DisplayName("Should return all courses successfully")
    void getAllCourses_ShouldReturnAllCourses() {
        List<Course> courses = Arrays.asList(testCourse);
        when(courseRepository.findAll()).thenReturn(courses);
        when(gradingPolicyRepository.findByCourse_CourseId(anyInt())).thenReturn(Optional.empty());

        List<CourseDTO> result = courseService.getAllCourses();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Java Programming", result.get(0).getTitle());
        verify(courseRepository).findAll();
    }

    @Test
    @DisplayName("Should return course when valid ID is provided")
    void getCourseById_ShouldReturnCourse_WhenValidId() {
        when(courseRepository.findById(1)).thenReturn(Optional.of(testCourse));
        when(gradingPolicyRepository.findByCourse_CourseId(1)).thenReturn(Optional.empty());

        Optional<CourseDTO> result = courseService.getCourseById(1);

        assertTrue(result.isPresent());
        assertEquals("Java Programming", result.get().getTitle());
        verify(courseRepository).findById(1);
    }

    @Test
    @DisplayName("Should create course successfully with valid data")
    void createCourse_ShouldCreateCourse_WhenValidData() {
        when(courseRepository.existsByTitle(anyString())).thenReturn(false);
        when(categoryRepository.findById(1)).thenReturn(Optional.of(testCategory));
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(courseRepository.save(any(Course.class))).thenReturn(testCourse);
        when(gradingPolicyRepository.save(any(GradingPolicy.class))).thenReturn(new GradingPolicy());

        CourseDTO result = courseService.createCourse(testCourseDTO);

        assertNotNull(result);
        assertEquals("Java Programming", result.getTitle());
        verify(courseRepository).save(any(Course.class));
        verify(gradingPolicyRepository).save(any(GradingPolicy.class));
    }

    @Test
    @DisplayName("Should throw exception when course title already exists")
    void createCourse_ShouldThrowException_WhenTitleExists() {
        when(courseRepository.existsByTitle("Java Programming")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> courseService.createCourse(testCourseDTO)
        );
        assertEquals("Course title already exists", exception.getMessage());
        verify(courseRepository, never()).save(any(Course.class));
    }

    @Test
    @DisplayName("Should delete course successfully when exists")
    void deleteCourse_ShouldDeleteCourse_WhenExists() {
        when(courseRepository.existsById(1)).thenReturn(true);

        boolean result = courseService.deleteCourse(1);

        assertTrue(result);
        verify(courseRepository).deleteById(1);
    }
}