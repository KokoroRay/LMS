package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.resp.CourseDTO;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.CourseStatus;
import com.ra.base_spring_boot.model.constants.GradeStatus;
import com.ra.base_spring_boot.model.constants.UserStatus;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.CourseService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.text.Normalizer;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private static final Logger logger = LoggerFactory.getLogger(CourseServiceImpl.class);

    private final CourseRepository courseRepository;
    private final CourseCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CourseGradeRepository courseGradeRepository;
    private final ClassRepository classRepository;
    private final GradingPolicyRepository gradingPolicyRepository;
    private final ClassCourseTeacherAssignmentRepository classCourseTeacherAssignmentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final CourseReviewRepository courseReviewRepository;

    private CourseDTO convertToDTO(Course course) {
        Set<Integer> teacherIds = course.getCourseInstructors().stream()
                .map(User::getId)
                .collect(Collectors.toSet());

        Integer createdById = course.getCreatedBy() != null ? course.getCreatedBy().getId() : null;

        GradingPolicy policy = gradingPolicyRepository.findByCourse_CourseId(course.getCourseId()).orElse(null);

        CourseDTO dto = CourseDTO.builder()
                .courseId(course.getCourseId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .shortDescription(course.getShortDescription())
                .description(course.getDescription())
                .price(course.getPrice())
                .level(course.getLevel())
                .categoryId(course.getCategory() != null ? course.getCategory().getCategoryId() : null)
                .createdById(createdById)
                .teacherIds(teacherIds)
                .status(course.getStatus())
                .thumbnailUrl(course.getThumbnailUrl())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();

        if (policy != null) {
            dto.setAssignments_weight(policy.getAssignmentsWeight());
            dto.setQuizzes_weight(policy.getQuizzesWeight());
            dto.setExams_weight(policy.getExamsWeight());
            dto.setPassing_score(policy.getPassingScore());
        }

        return dto;
    }


    private String generateSlug(String title) {
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD);
        String slug = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");

        String originalSlug = slug;
        int count = 1;

        // Nếu slug đã tồn tại thì thêm hậu tố tăng dần
        while (courseRepository.existsBySlug(slug)) {
            slug = originalSlug + "-" + count;
            count++;
        }
        return slug;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<CourseDTO> getCourseById(Integer id) {
        return courseRepository.findById(id).map(this::convertToDTO);
    }

    @Override
    public CourseDTO createCourse(CourseDTO dto) {
        // 1. Kiểm tra tiêu đề trùng
        if (courseRepository.existsByTitle(dto.getTitle())) {
            throw new IllegalArgumentException("Course title already exists");
        }

        // 2. Kiểm tra category bắt buộc
        if (dto.getCategoryId() == null) {
            throw new IllegalArgumentException("Course must have a category");
        }

        // 3. Tìm category tương ứng
        CourseCategory category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        // 4. Gán mô tả ngắn nếu trống
        String shortDesc = (dto.getShortDescription() == null || dto.getShortDescription().isBlank())
                ? "No description"
                : dto.getShortDescription();

        // 5. Sinh slug nếu chưa có
        String slug = (dto.getSlug() == null || dto.getSlug().isBlank())
                ? generateSlug(dto.getTitle())
                : dto.getSlug();

        // 6. Tạo entity mới
        Course course = Course.builder()
                .title(dto.getTitle())
                .slug(slug)
                .shortDescription(shortDesc)
                .description(dto.getDescription())
                .price(dto.getPrice())
                .level(dto.getLevel())
                .status(dto.getStatus() != null ? dto.getStatus() : CourseStatus.DRAFT)
                .thumbnailUrl(dto.getThumbnailUrl())
                .category(category)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .courseInstructors(new HashSet<>())
                .build();

        // 7. Gán người tạo nếu có
        if (dto.getCreatedById() != null) {
            userRepository.findById(dto.getCreatedById()).ifPresent(course::setCreatedBy);
        }

        if (dto.getTeacherIds() != null && !dto.getTeacherIds().isEmpty()) {
            List<User> teachers = userRepository.findAllById(dto.getTeacherIds());
            Set<User> activeTeachers = teachers.stream()
                    .filter(user -> user.getRole().getId() == 2 && user.getStatus() == UserStatus.ACTIVE)
                    .collect(Collectors.toSet());

            if (activeTeachers.size() != dto.getTeacherIds().size()) {
                throw new IllegalArgumentException("One or more user IDs are not valid active teachers or not found.");
            }
            course.setCourseInstructors(activeTeachers);
        }

        try {
            Course savedCourse = courseRepository.save(course);

            GradingPolicy policy = GradingPolicy.builder()
                    .course(savedCourse)
                    .assignmentsWeight(dto.getAssignments_weight() != null ? dto.getAssignments_weight() : 30.0)
                    .quizzesWeight(dto.getQuizzes_weight() != null ? dto.getQuizzes_weight() : 20.0)
                    .examsWeight(dto.getExams_weight() != null ? dto.getExams_weight() : 50.0)
                    .passingScore(dto.getPassing_score() != null ? dto.getPassing_score() : 70.0)
                    .build();
            gradingPolicyRepository.save(policy);

            return convertToDTO(savedCourse);

        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Course slug already exists");
        }
    }


    @Override
    @Transactional
    public Optional<CourseDTO> updateCourse(Integer id, CourseDTO dto) {
        // Kiểm tra title trùng (ngoại trừ chính khóa học đang cập nhật)
        if (courseRepository.existsByTitleAndCourseIdNot(dto.getTitle(), id)) {
            throw new IllegalArgumentException("Course title already exists");
        }

        // Kiểm tra category
        if (dto.getCategoryId() == null) {
            throw new IllegalArgumentException("Course must have a category");
        }

        return courseRepository.findById(id).map(course -> {
            CourseCategory category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));

            // Cập nhật các trường
            course.setTitle(dto.getTitle());
            String slug = (dto.getSlug() == null || dto.getSlug().isBlank())
                    ? generateSlug(dto.getTitle())
                    : dto.getSlug();
            course.setSlug(slug);

            course.setShortDescription(
                    (dto.getShortDescription() == null || dto.getShortDescription().isBlank())
                            ? "No description"
                            : dto.getShortDescription()
            );
            course.setPrice(dto.getPrice());
            course.setLevel(dto.getLevel());
            if (dto.getStatus() != null) {
                course.setStatus(dto.getStatus());
            }
            course.setThumbnailUrl(dto.getThumbnailUrl());
            course.setCategory(category);
            course.setUpdatedAt(LocalDateTime.now());

            if (dto.getCreatedById() != null) {
                userRepository.findById(dto.getCreatedById()).ifPresent(course::setCreatedBy);
            }

            if (dto.getTeacherIds() != null) {
                List<User> teachers = userRepository.findAllById(dto.getTeacherIds());
                Set<User> activeTeachers = teachers.stream()
                        .filter(user -> user.getRole().getId() == 2 && user.getStatus() == UserStatus.ACTIVE)
                        .collect(Collectors.toSet());

                if (activeTeachers.size() != dto.getTeacherIds().size()) {
                    throw new IllegalArgumentException("One or more user IDs are not valid active teachers or not found.");
                }
                course.setCourseInstructors(activeTeachers);
            } else {
                course.setCourseInstructors(Collections.emptySet());
            }

            GradingPolicy policy = gradingPolicyRepository.findByCourse_CourseId(course.getCourseId())
                    .orElse(new GradingPolicy());

            policy.setCourse(course);
            policy.setAssignmentsWeight(dto.getAssignments_weight() != null ? dto.getAssignments_weight() : 30.0);
            policy.setQuizzesWeight(dto.getQuizzes_weight() != null ? dto.getQuizzes_weight() : 20.0);
            policy.setExamsWeight(dto.getExams_weight() != null ? dto.getExams_weight() : 50.0);
            policy.setPassingScore(dto.getPassing_score() != null ? dto.getPassing_score() : 70.0);

            gradingPolicyRepository.save(policy);

            return convertToDTO(courseRepository.save(course));
        });
    }


    @Override
    @Transactional
    public boolean deleteCourse(Integer id) {
        if (courseRepository.existsById(id)) {
            // Delete all related entities first
            lessonRepository.deleteAllByCourse_CourseId(id);
            courseReviewRepository.deleteAllByCourse_CourseId(id);
            gradingPolicyRepository.deleteAllByCourse_CourseId(id);
            courseGradeRepository.deleteAllByCourse_CourseId(id);
            classCourseTeacherAssignmentRepository.deleteAllByCourse_CourseId(id);

            // Finally, delete the course itself
            courseRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Override
    public CourseDTO updateCourseStatus(Integer id, CourseStatus status) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        course.setStatus(status);
        course.setUpdatedAt(LocalDateTime.now());

        return convertToDTO(courseRepository.save(course));
    }

    @Override
    public List<CourseDTO> getPublishedCourses(String title) {
        List<Course> courses;
        if (title != null && !title.isBlank()) {
            courses = courseRepository.findByStatusAndTitleContainingIgnoreCase(CourseStatus.PUBLISHED, title);
        } else {
            courses = courseRepository.findByStatus(CourseStatus.PUBLISHED);
        }
        return courses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    public List<CourseDTO> getArchivedCourses() {
        return courseRepository.findByStatus(CourseStatus.ARCHIVED)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<CourseDTO> getCoursesByCategoryId(Integer categoryId) {
        List<Course> courses = courseRepository.findByCategory_CategoryId(categoryId);
        return courses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> getFailedStudentsForCourse(Integer courseId) {
        List<Integer> classIds = classRepository.findClassesByCourseId(courseId).stream()
                .map(ClassEntity::getClassId)
                .collect(Collectors.toList());

        if (classIds.isEmpty()) {
            return Collections.emptyList();
        }

        return courseGradeRepository.findByClassEntity_ClassIdInAndStatus(classIds, GradeStatus.FAIL).stream()
                .map(CourseGrade::getStudent)
                .distinct()
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getInstructorsByCourseId(Integer courseId) {
        Optional<Course> courseOptional = courseRepository.findById(courseId);

        if (courseOptional.isEmpty()) {
            return Collections.emptyList();
        }

        Course course = courseOptional.get();
        Set<User> instructorsSet = course.getCourseInstructors();

        return instructorsSet.stream()
                .collect(Collectors.toList());
    }
    @Override
    public List<CourseDTO> getCoursesByTeacherId(Integer teacherId) {
        // lấy tất cả mapping: class - course - teacher
        List<ClassCourseTeacherAssignment> mappings =
                classCourseTeacherAssignmentRepository.findByTeacherId(teacherId);

        // Lấy danh sách courseId unique
        Set<Integer> courseIds = mappings.stream()
                .map(m -> m.getCourse().getCourseId())
                .collect(Collectors.toSet());

        if (courseIds.isEmpty()) return List.of();

        List<Course> courses = courseRepository.findAllById(courseIds);

        return courses.stream()
                .map(this::toDTO) // dùng mapper hiện tại của bạn
                .toList();
    }

    @Override
    public boolean isStudentEnrolled(Integer studentId, Integer courseId) {
        logger.info("Checking access for studentId: {} to courseId: {}", studentId, courseId);

        // 1. Find course by ID
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            logger.warn("Access check failed: Course with ID {} not found.", courseId);
            return false;
        }
        Course course = courseOpt.get();
        logger.info("Course found: '{}'. Price: {}", course.getTitle(), course.getPrice());

        // 2. Check if the course is explicitly free (price is not null and is zero)
        if (course.getPrice() != null && course.getPrice().compareTo(BigDecimal.ZERO) == 0) {
            logger.info("Access granted: Course '{}' is explicitly free (price is 0).", course.getTitle());
            return true;
        }
        logger.info("Course '{}' is not free (price is {}). Proceeding to enrollment check.", course.getTitle(), course.getPrice());

        // 3. If the course is not free, check if the user is logged in
        if (studentId == null) {
            logger.warn("Access denied: User is not logged in for a paid course.");
            return false;
        }
        logger.info("User is logged in with studentId: {}. Checking enrollment.", studentId);

        // 4. If logged in, check for enrollment in a class containing the course
        boolean isEnrolled = enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId);
        logger.info("Enrollment check result for studentId: {} in courseId: {}: {}", studentId, courseId, isEnrolled);

        if (isEnrolled) {
            logger.info("Access granted: Student {} is enrolled in a class with course {}.", studentId, courseId);
        } else {
            logger.warn("Access denied: Student {} is NOT enrolled in any class with course {}.", studentId, courseId);
        }

        return isEnrolled;
    }

    // ví dụ mapper
        private CourseDTO toDTO(Course c) {
            return CourseDTO.builder()
                    .courseId(c.getCourseId())
                    .title(c.getTitle())
                    .slug(c.getSlug())
                    .shortDescription(c.getShortDescription())
                    .description(c.getDescription())
                    .price(c.getPrice())
                    .level(c.getLevel())
                    .status(c.getStatus())
                    .categoryId(c.getCategory() != null ? c.getCategory().getCategoryId() : null)
                    .thumbnailUrl(c.getThumbnailUrl())
                    .createdById(c.getCreatedBy() != null ? c.getCreatedBy().getId() : null)
                    .build();
        }

        @Override
        @Transactional(readOnly = true)
        public List<CourseDTO> getEnrolledCoursesByStudentId(Integer studentId) {
            List<Enrollment> enrollments = enrollmentRepository.findActiveEnrollmentsByStudentId(studentId);

            Set<Course> courses = enrollments.stream()
                    .map(Enrollment::getClassEntity)
                    .flatMap(classEntity -> classEntity.getCourses().stream())
                    .collect(Collectors.toSet());

            return courses.stream()
                    .filter(course -> course.getStatus() == CourseStatus.PUBLISHED)
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
    }
