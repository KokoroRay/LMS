package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.*;
import com.ra.base_spring_boot.dto.req.ClassSubjectAssignmentDTO; // THÊM IMPORT
import com.ra.base_spring_boot.dto.resp.CourseDTO;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set; // THÊM IMPORT
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClassRepository classRepository;
    private final ExamRepository examRepository;
    private final TimetableRepository timetableRepository;
    private final CourseRepository courseRepository;
    // private final UserRepository userRepository; // Bạn có thể cần cái này nếu muốn lấy tên giáo viên

    public DashboardSummaryDTO getInstructorDashboard(Integer teacherId) {
        DashboardSummaryDTO dto = new DashboardSummaryDTO();

        // ===== Classes =====
        // SỬA LỖI 1 (Dòng 29): Lọc theo danh sách assignments
        List<ClassEntity> classes = classRepository.findAll()
                .stream()
                .filter(c -> c.getClassCourseTeacherAssignments().stream()
                        .anyMatch(a -> a.getTeacher() != null && a.getTeacher().getId().equals(teacherId)))
                .collect(Collectors.toList());

        List<ClassDTO> classDTOs = classes.stream().map(c -> ClassDTO.builder()
                        .classId(c.getClassId())
                        .categoryId(c.getCategory().getCategoryId())
                        .categoryName(c.getCategory().getName()) // Sửa: Lấy name từ category
                        // SỬA LỖI 2 & 3 (Dòng 38, 39): Xóa teacherId/teacherName (số ít)
                        // .teacherId(c.getTeacher().getId()) // ĐÃ XÓA
                        // .teacherName(c.getTeacher().getFullName()) // ĐÃ XÓA
                        .startDate(c.getStartDate())
                        .endDate(c.getEndDate())
                        .capacity(c.getCapacity())
                        .currentStudents(c.getEnrollments() != null ? c.getEnrollments().size() : 0)
                        .status(c.getStatus())
                        .createdAt(c.getCreatedAt())
                        .updatedAt(c.getUpdatedAt())
                        // SỬA LỖI 4 (Dòng 44): Dùng đúng tên trường 'classCourseTeacherAssignments'
                        .courseIds(c.getClassCourseTeacherAssignments().stream().map(a -> a.getCourse().getCourseId()).collect(Collectors.toSet()))
                        // SỬA LỖI 5 (Dòng 46): Dùng đúng tên trường 'classCourseTeacherAssignments'
                        .courseTitles(c.getClassCourseTeacherAssignments().stream().map(a -> a.getCourse().getTitle()).collect(Collectors.toSet()))
                        // THÊM MỚI: Điền dữ liệu cho các trường DTO mới
                        .teacherNames(c.getClassCourseTeacherAssignments().stream()
                                .map(a -> a.getTeacher().getFirstName() + " " + a.getTeacher().getLastName()) // Giả định User có getFirstName/LastName
                                .collect(Collectors.toSet()))
                        .assignments(c.getClassCourseTeacherAssignments().stream()
                                .map(a -> ClassSubjectAssignmentDTO.builder()
                                        .courseId(a.getCourse().getCourseId())
                                        .teacherId(a.getTeacher().getId())
                                        .build())
                                .collect(Collectors.toSet()))
                        .build())
                .collect(Collectors.toList());
        dto.setMyClasses(classDTOs);

        // ===== Exams =====
        List<ExamDTO> examDTOs = classes.stream()
                .flatMap(c -> examRepository.findByClassEntity_ClassIdAndIsPublishedTrue(c.getClassId()).stream())
                .map(e -> ExamDTO.builder()
                        .examId(e.getExamId())
                        .classId(e.getClassEntity().getClassId())
                        .className(e.getClassEntity().getClassName())
                        .title(e.getTitle())
                        .description(e.getDescription())
                        .examType(e.getExamType())
                        .totalMarks(e.getTotalMarks())
                        .durationMinutes(e.getDurationMinutes())
                        .isPublished(e.getIsPublished())
                        .maxAttempts(e.getMaxAttempts())
                        .showResultImmediately(e.getShowResultImmediately())
                        .createdAt(e.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        dto.setMyExams(examDTOs);

        // ===== Timetables (upcoming) =====
        List<TimetableDTO> timetableDTOs = classes.stream()
                .flatMap(c -> timetableRepository.findTimetableDetailsByClassId(c.getClassId()).stream())
                .filter(t -> t.getDate() != null && t.getDate().isAfter(LocalDate.now().minusDays(1)))
                .map(t -> TimetableDTO.builder()
                        .classId(t.getClassEntity().getClassId())
                        .courseId(t.getCourse().getCourseId())
                        .dayOfWeek(t.getDayOfWeek().name())
                        .date(t.getDate())
                        .startTime(t.getStartTime())
                        .endTime(t.getEndTime())
                        .meetUrl(t.getMeetUrl())
                        .timezone(t.getTimezone())
                        .note(t.getNote())
                        .build())
                .collect(Collectors.toList());
        dto.setScheduleList(timetableDTOs);

        // ===== Courses =====
        List<CourseDTO> courseDTOs = classes.stream()
                // SỬA LỖI 6 (Dòng 92): Dùng đúng tên trường 'classCourseTeacherAssignments'
                .flatMap(c -> c.getClassCourseTeacherAssignments().stream()
                        // Lọc các course chỉ do giáo viên này dạy (nếu cần)
                        .filter(a -> a.getTeacher() != null && a.getTeacher().getId().equals(teacherId))
                        .map(ClassCourseTeacherAssignment::getCourse))
                .distinct()
                .map(course -> CourseDTO.builder()
                        .courseId(course.getCourseId())
                        .title(course.getTitle())
                        .slug(course.getSlug())
                        .shortDescription(course.getShortDescription())
                        .description(course.getDescription())
                        .price(course.getPrice())
                        .level(course.getLevel())
                        .categoryId(course.getCategory().getCategoryId())
                        .createdById(course.getCreatedBy() != null ? course.getCreatedBy().getId() : null) // Thêm kiểm tra null
                        .status(course.getStatus())
                        .thumbnailUrl(course.getThumbnailUrl())
                        .createdAt(course.getCreatedAt())
                        .updatedAt(course.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
        dto.setMyCourses(courseDTOs);

        // ===== Overview =====
        DashboardSummaryDTO.Overview overview = DashboardSummaryDTO.Overview.builder()
                .classCount(classes.size())
                .examCount(examDTOs.size())
                .totalStudents(classes.stream().mapToInt(c -> c.getEnrollments() != null ? c.getEnrollments().size() : 0).sum())
                .upcomingSchedules(timetableDTOs.size())
                .build();
        dto.setOverview(overview);

        return dto;
    }
}