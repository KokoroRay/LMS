package com.ra.base_spring_boot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.resp.CourseDTO;
import com.ra.base_spring_boot.dto.req.CourseRequestDTO;
import com.ra.base_spring_boot.model.constants.CourseLevel;
import com.ra.base_spring_boot.model.constants.CourseStatus;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.CourseService;
import com.ra.base_spring_boot.services.CloudinaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CourseController.class)
@DisplayName("Course Controller Tests")
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CourseService courseService;

    @MockBean
    private CloudinaryService cloudinaryService;

    @Autowired
    private ObjectMapper objectMapper;

    private CourseDTO testCourseDTO;
    private CourseRequestDTO testCourseRequestDTO;
    private MyUserDetails mockUserDetails;

    @BeforeEach
    void setUp() {
        testCourseDTO = CourseDTO.builder()
                .courseId(1)
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
                .thumbnailUrl("http://example.com/image.jpg")
                .build();

        testCourseRequestDTO = CourseRequestDTO.builder()
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

        mockUserDetails = mock(MyUserDetails.class);
        when(mockUserDetails.getId()).thenReturn(1);
    }

    @Test
    @DisplayName("Should return all courses successfully")
    @WithMockUser
    void getAllCourses_ShouldReturnAllCourses() throws Exception {
        List<CourseDTO> courses = Arrays.asList(testCourseDTO);
        when(courseService.getAllCourses()).thenReturn(courses);

        mockMvc.perform(get("/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].title").value("Java Programming"))
                .andExpect(jsonPath("$[0].courseId").value(1));

        verify(courseService).getAllCourses();
    }

    @Test
    @DisplayName("Should return course when valid ID is provided")
    @WithMockUser
    void getCourseById_ShouldReturnCourse_WhenValidId() throws Exception {
        when(courseService.getCourseById(1)).thenReturn(Optional.of(testCourseDTO));

        mockMvc.perform(get("/courses/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(1))
                .andExpect(jsonPath("$.title").value("Java Programming"));

        verify(courseService).getCourseById(1);
    }

    @Test
    @DisplayName("Should return 404 when course not found")
    @WithMockUser
    void getCourseById_ShouldReturn404_WhenCourseNotFound() throws Exception {
        when(courseService.getCourseById(999)).thenReturn(Optional.empty());

        mockMvc.perform(get("/courses/999"))
                .andExpect(status().isNotFound());

        verify(courseService).getCourseById(999);
    }

    @Test
    @DisplayName("Should create course successfully with valid data")
    @WithMockUser
    void createCourse_ShouldCreateCourse_WhenValidData() throws Exception {
        String courseJson = objectMapper.writeValueAsString(testCourseRequestDTO);
        MockMultipartFile courseFile = new MockMultipartFile(
                "course", "", "application/json", courseJson.getBytes());
        MockMultipartFile thumbnailFile = new MockMultipartFile(
                "thumbnail", "image.jpg", "image/jpeg", "image content".getBytes());

        when(cloudinaryService.uploadFile(any(), anyString())).thenReturn("http://example.com/uploaded.jpg");
        when(courseService.createCourse(any(CourseDTO.class))).thenReturn(testCourseDTO);

        mockMvc.perform(multipart("/courses")
                        .file(courseFile)
                        .file(thumbnailFile)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Java Programming"));

        verify(courseService).createCourse(any(CourseDTO.class));
        verify(cloudinaryService).uploadFile(any(), eq("course_thumbnails"));
    }

    @Test
    @DisplayName("Should delete course successfully when exists")
    @WithMockUser
    void deleteCourse_ShouldDeleteCourse_WhenExists() throws Exception {
        when(courseService.deleteCourse(1)).thenReturn(true);

        mockMvc.perform(delete("/courses/1")
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(courseService).deleteCourse(1);
    }

    @Test
    @DisplayName("Should return teacher's courses")
    @WithMockUser
    void getMyCourses_ShouldReturnTeacherCourses() throws Exception {
        List<CourseDTO> courses = Arrays.asList(testCourseDTO);
        when(courseService.getCoursesByTeacherId(1)).thenReturn(courses);

        Authentication auth = new UsernamePasswordAuthenticationToken(mockUserDetails, null);

        mockMvc.perform(get("/courses/my-courses")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].title").value("Java Programming"));

        verify(courseService).getCoursesByTeacherId(1);
    }
}