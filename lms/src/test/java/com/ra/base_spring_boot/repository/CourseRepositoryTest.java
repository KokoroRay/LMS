package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.CourseCategory;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.CourseLevel;
import com.ra.base_spring_boot.model.constants.CourseStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@DisplayName("Course Repository Tests")
class CourseRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private CourseRepository courseRepository;

    private Course testCourse;
    private CourseCategory testCategory;
    private User testUser;

    @BeforeEach
    void setUp() {
        testCategory = CourseCategory.builder()
                .name("Programming")
                .description("Programming courses")
                .build();
        entityManager.persistAndFlush(testCategory);

        testUser = User.builder()
                .username("testuser")
                .email("test@example.com")
                .passwordHash("password")
                .build();
        entityManager.persistAndFlush(testUser);

        testCourse = Course.builder()
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
    }

    @Test
    @DisplayName("Should return true when course title exists")
    void existsByTitle_ShouldReturnTrue_WhenTitleExists() {
        entityManager.persistAndFlush(testCourse);

        boolean exists = courseRepository.existsByTitle("Java Programming");

        assertTrue(exists);
    }

    @Test
    @DisplayName("Should return false when course title does not exist")
    void existsByTitle_ShouldReturnFalse_WhenTitleDoesNotExist() {
        boolean exists = courseRepository.existsByTitle("Non-existent Course");

        assertFalse(exists);
    }

    @Test
    @DisplayName("Should return courses with specific status")
    void findByStatus_ShouldReturnCoursesWithStatus() {
        testCourse.setStatus(CourseStatus.PUBLISHED);
        entityManager.persistAndFlush(testCourse);

        Course draftCourse = Course.builder()
                .title("Python Programming")
                .slug("python-programming")
                .shortDescription("Learn Python")
                .price(new BigDecimal("79.99"))
                .level(CourseLevel.Beginner)
                .status(CourseStatus.DRAFT)
                .category(testCategory)
                .createdBy(testUser)
                .courseInstructors(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        entityManager.persistAndFlush(draftCourse);

        List<Course> publishedCourses = courseRepository.findByStatus(CourseStatus.PUBLISHED);
        List<Course> draftCourses = courseRepository.findByStatus(CourseStatus.DRAFT);

        assertEquals(1, publishedCourses.size());
        assertEquals("Java Programming", publishedCourses.get(0).getTitle());
        assertEquals(1, draftCourses.size());
        assertEquals("Python Programming", draftCourses.get(0).getTitle());
    }

    @Test
    @DisplayName("Should return courses by category ID")
    void findByCategory_CategoryId_ShouldReturnCoursesByCategory() {
        entityManager.persistAndFlush(testCourse);

        CourseCategory webCategory = CourseCategory.builder()
                .name("Web Development")
                .description("Web development courses")
                .build();
        entityManager.persistAndFlush(webCategory);

        Course webCourse = Course.builder()
                .title("HTML & CSS")
                .slug("html-css")
                .shortDescription("Learn web basics")
                .price(new BigDecimal("49.99"))
                .level(CourseLevel.Beginner)
                .status(CourseStatus.PUBLISHED)
                .category(webCategory)
                .createdBy(testUser)
                .courseInstructors(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        entityManager.persistAndFlush(webCourse);

        List<Course> programmingCourses = courseRepository.findByCategory_CategoryId(testCategory.getCategoryId());
        List<Course> webCourses = courseRepository.findByCategory_CategoryId(webCategory.getCategoryId());

        assertEquals(1, programmingCourses.size());
        assertEquals("Java Programming", programmingCourses.get(0).getTitle());
        assertEquals(1, webCourses.size());
        assertEquals("HTML & CSS", webCourses.get(0).getTitle());
    }
}