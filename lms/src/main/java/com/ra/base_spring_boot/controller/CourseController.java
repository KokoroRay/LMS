package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.resp.CourseDTO;
import com.ra.base_spring_boot.dto.req.CourseRequestDTO;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.CourseStatus;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.CourseService;
import com.ra.base_spring_boot.services.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final CloudinaryService cloudinaryService;


    /**
     * Lấy danh sách khóa học mà GIẢNG VIÊN hiện tại được gán dạy
     */
    @GetMapping("/my-courses")
    public ResponseEntity<List<CourseDTO>> getMyCourses(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof MyUserDetails details)) {
            return ResponseEntity.status(401).build();
        }

        Integer teacherId = details.getId(); // hoặc details.getUser().getId()
        List<CourseDTO> list = courseService.getCoursesByTeacherId(teacherId);
        return ResponseEntity.ok(list);
    }

    /**
     * Lấy danh sách khóa học mà SINH VIÊN hiện tại đã ghi danh
     */
    @GetMapping("/student/my-courses")
    public ResponseEntity<List<CourseDTO>> getStudentCourses(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof MyUserDetails details)) {
            return ResponseEntity.status(401).build();
        }

        Integer studentId = details.getId();
        List<CourseDTO> list = courseService.getEnrolledCoursesByStudentId(studentId);
        return ResponseEntity.ok(list);
    }

    // ------------------- GET -------------------

    /**
     * Lấy danh sách tất cả khóa học
     * @return danh sách CourseDTO
     */
    @GetMapping
    public ResponseEntity<List<CourseDTO>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    /**
     * Lấy chi tiết một khóa học theo ID
     * @param id ID của khóa học
     * @return CourseDTO hoặc 404 nếu không tồn tại
     */
    @GetMapping("/{id}")
    public ResponseEntity<CourseDTO> getCourseById(@PathVariable Integer id) {
        return courseService.getCourseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<CourseDTO>> getCoursesByCategory(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(courseService.getCoursesByCategoryId(categoryId));
    }

    // ------------------- CREATE -------------------

    /**
     * Tạo mới một khóa học
     * - Nhận multipart/form-data gồm:
     *   + `course`: JSON string (CourseRequestDTO)
     *   + `thumbnail`: file ảnh (tùy chọn)
     * - Nếu có file ảnh → upload lên Cloudinary, lấy URL
     * - Gọi service để lưu khóa học mới
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createCourse(
            @RequestPart("course") String courseJson,
            @RequestPart(value = "thumbnail", required = false) MultipartFile file
    ) {
        try {
            // Chuyển JSON string thành DTO
            CourseRequestDTO dto = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(courseJson, CourseRequestDTO.class);

            // Upload ảnh thumbnail (nếu có)
            String thumbnailUrl = null;
            if (file != null && !file.isEmpty()) {
                thumbnailUrl = cloudinaryService.uploadFile(file, "course_thumbnails");
            }

            // Xây dựng CourseDTO để gửi sang service
            CourseDTO courseDTO = CourseDTO.builder()
                    .title(dto.getTitle())
                    .slug(dto.getSlug())
                    .shortDescription(dto.getShortDescription())
                    .description(dto.getDescription())
                    .price(dto.getPrice())
                    .level(dto.getLevel())
                    .categoryId(dto.getCategoryId())
                    .createdById(dto.getCreatedById())
                    .teacherIds(dto.getTeacherIds())
                    .status(dto.getStatus())
                    .thumbnailUrl(thumbnailUrl)
                    .build();

            // Lưu khóa học
            CourseDTO saved = courseService.createCourse(courseDTO);
            return ResponseEntity.ok(saved);

        } catch (IllegalArgumentException | IOException e) {
            // Trả lỗi 500 nếu có lỗi parse JSON hoặc upload file
            return ResponseEntity.status(500)
                    .body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // ------------------- UPDATE -------------------

    /**
     * Cập nhật thông tin khóa học
     * - Nhận multipart/form-data tương tự create
     * - Nếu có file ảnh mới → upload thay thế
     * - Nếu không có → giữ ảnh cũ
     */
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> updateCourse(
            @PathVariable Integer id,
            @RequestPart("course") String courseJson,
            @RequestPart(value = "thumbnail", required = false) MultipartFile file
    ) {
        try {
            // Parse JSON -> DTO
            CourseRequestDTO dto = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(courseJson, CourseRequestDTO.class);

            // Kiểm tra khóa học tồn tại
            CourseDTO existing = courseService.getCourseById(id).orElse(null);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }

            // Upload ảnh mới nếu có, nếu không giữ ảnh cũ
            String thumbnailUrl = (file != null && !file.isEmpty())
                    ? cloudinaryService.uploadFile(file, "course_thumbnails")
                    : existing.getThumbnailUrl();

            // Gộp dữ liệu mới
            CourseDTO courseDTO = CourseDTO.builder()
                    .title(dto.getTitle())
                    .slug(dto.getSlug())
                    .shortDescription(dto.getShortDescription())
                    .description(dto.getDescription())
                    .price(dto.getPrice())
                    .level(dto.getLevel())
                    .categoryId(dto.getCategoryId())
                    .createdById(dto.getCreatedById())
                    .teacherIds(dto.getTeacherIds())
                    .status(dto.getStatus())
                    .thumbnailUrl(thumbnailUrl)
                    .passing_score(dto.getPassing_score())
                    .quizzes_weight(dto.getQuizzes_weight())
                    .assignments_weight(dto.getAssignments_weight())
                    .exams_weight(dto.getExams_weight())
                    .build();

            // Cập nhật khóa học
            return courseService.updateCourse(id, courseDTO)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());

        } catch (IllegalArgumentException | IOException e) {
            return ResponseEntity.status(500)
                    .body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // ------------------- DELETE -------------------

    /**
     * Xóa một khóa học theo ID
     * @param id ID của khóa học
     * @return 204 nếu xóa thành công, 404 nếu không tìm thấy
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Integer id) {
        if (courseService.deleteCourse(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ------------------- PATCH (CẬP NHẬT TRẠNG THÁI) -------------------

    /**
     * Chuyển trạng thái khóa học sang PUBLISHED (xuất bản)
     */
    @PatchMapping("/{id}/publish")
    public ResponseEntity<?> publishCourse(@PathVariable Integer id) {
        try {
            CourseDTO updated = courseService.updateCourseStatus(id, CourseStatus.PUBLISHED);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    /**
     * Chuyển trạng thái khóa học sang ARCHIVED (lưu trữ)
     */
    @PatchMapping("/{id}/archive")
    public ResponseEntity<?> archiveCourse(@PathVariable Integer id) {
        try {
            CourseDTO updated = courseService.updateCourseStatus(id, CourseStatus.ARCHIVED);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    /**
     * Lấy danh sách các khóa học đã được publish
     */
    @GetMapping("/published")
    public ResponseEntity<List<CourseDTO>> getPublishedCourses(@RequestParam(required = false) String title) {
        return ResponseEntity.ok(courseService.getPublishedCourses(title));
    }
    @GetMapping("/archived")
    public ResponseEntity<List<CourseDTO>> getArchivedCourses() {
        return ResponseEntity.ok(courseService.getArchivedCourses());
    }

    @GetMapping("/{courseId}/failed-students")
    public ResponseEntity<List<User>> getFailedStudentsForCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(courseService.getFailedStudentsForCourse(courseId));
    }

    @GetMapping("/{courseId}/instructors")
    public ResponseEntity<List<User>> getInstructorsByCourse(@PathVariable Integer courseId) {
        List<User> instructors = courseService.getInstructorsByCourseId(courseId);
        return ResponseEntity.ok(instructors);
    }

    /**
     * Kiểm tra xem sinh viên hiện tại (đã xác thực) có được ghi danh vào khóa học không
     * @param courseId ID của khóa học
     * @param authentication Đối tượng xác thực chứa thông tin người dùng
     * @return ResponseEntity chứa map với key "isEnrolled" và giá trị boolean
     */
    @GetMapping("/{courseId}/is-enrolled")
    public ResponseEntity<java.util.Map<String, Boolean>> checkEnrollment(
            @PathVariable Integer courseId,
            Authentication authentication) {

        Integer studentId = null;
        if (authentication != null && authentication.getPrincipal() instanceof MyUserDetails) {
            MyUserDetails userDetails = (MyUserDetails) authentication.getPrincipal();
            studentId = userDetails.getId();
        }

        boolean hasAccess = courseService.isStudentEnrolled(studentId, courseId);

        return ResponseEntity.ok(java.util.Collections.singletonMap("isEnrolled", hasAccess));
    }
}


