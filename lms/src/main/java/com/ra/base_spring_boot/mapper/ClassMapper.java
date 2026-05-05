package com.ra.base_spring_boot.mapper;

import com.ra.base_spring_boot.dto.ClassDTO;
import com.ra.base_spring_boot.dto.req.ClassRequestDTO;
import com.ra.base_spring_boot.dto.req.ClassSubjectAssignmentDTO;
import com.ra.base_spring_boot.model.ClassCourseTeacherAssignment;
import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.CourseCategory;
import com.ra.base_spring_boot.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ClassMapper {

    @Mapping(target = "classId", source = "classId")
    @Mapping(target = "categoryId", source = "category.categoryId")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "courseIds", source = "classCourseTeacherAssignments", qualifiedByName = "mapAssignmentToCourseIds")
    @Mapping(target = "courseTitles", source = "classCourseTeacherAssignments", qualifiedByName = "mapAssignmentToCourseTitles")
    @Mapping(target = "currentStudents", ignore = true)
    @Mapping(target = "teacherNames", source = "classCourseTeacherAssignments", qualifiedByName = "mapAssignmentToTeacherNames")
    // THÊM MỚI: Ánh xạ 'classCourseTeacherAssignments' (Entity) sang 'assignments' (DTO)
    @Mapping(target = "assignments", source = "classCourseTeacherAssignments", qualifiedByName = "mapAssignmentsToDTOs")
    ClassDTO toDTO(ClassEntity classEntity);

    @Mapping(target = "classId", ignore = true)
    @Mapping(target = "category", source = "categoryId", qualifiedByName = "mapCategory")
    // SỬA LỖI: Ánh xạ từ 'assignments' (DTO) sang 'classCourseTeacherAssignments' (Entity)
    @Mapping(target = "classCourseTeacherAssignments", source = "assignments", qualifiedByName = "mapAssignmentsFromDTO")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "enrollments", ignore = true)
    ClassEntity toEntity(ClassRequestDTO classRequestDTO);

    // THÊM MỚI: Phương thức helper để chuyển Set<Entity> sang Set<DTO>
    @Named("mapAssignmentsToDTOs")
    default Set<ClassSubjectAssignmentDTO> mapAssignmentsToDTOs(Set<ClassCourseTeacherAssignment> assignments) {
        if (assignments == null) return Collections.emptySet();
        return assignments.stream().map(a ->
                ClassSubjectAssignmentDTO.builder()
                        .courseId(a.getCourse() != null ? a.getCourse().getCourseId() : null)
                        .teacherId(a.getTeacher() != null ? a.getTeacher().getId() : null)
                        .build()
        ).collect(Collectors.toSet());
    }

    // --- Các phương thức helper hiện có (Đã cập nhật tên tham số cho rõ ràng) ---

    @Named("mapAssignmentToCourseIds")
    default Set<Integer> mapAssignmentToCourseIds(Set<ClassCourseTeacherAssignment> classCourseTeacherAssignments) {
        if (classCourseTeacherAssignments == null) return Collections.emptySet();
        return classCourseTeacherAssignments.stream()
                .map(a -> a.getCourse() != null ? a.getCourse().getCourseId() : null)
                .collect(Collectors.toSet());
    }

    @Named("mapAssignmentToCourseTitles")
    default Set<String> mapAssignmentToCourseTitles(Set<ClassCourseTeacherAssignment> classCourseTeacherAssignments) {
        if (classCourseTeacherAssignments == null) return Collections.emptySet();
        return classCourseTeacherAssignments.stream()
                .map(a -> a.getCourse() != null ? a.getCourse().getTitle() : "N/A")
                .collect(Collectors.toSet());
    }

    @Named("mapAssignmentToTeacherNames")
    default Set<String> mapAssignmentToTeacherNames(Set<ClassCourseTeacherAssignment> classCourseTeacherAssignments) {
        if (classCourseTeacherAssignments == null) return Collections.emptySet();
        return classCourseTeacherAssignments.stream()
                .map(a -> {
                    if (a.getTeacher() == null) {
                        return "N/A";
                    }
                    // Thêm kiểm tra null cho tên
                    String firstName = a.getTeacher().getFirstName() != null ? a.getTeacher().getFirstName() : "";
                    String lastName = a.getTeacher().getLastName() != null ? a.getTeacher().getLastName() : "";
                    return (firstName + " " + lastName).trim();
                })
                .collect(Collectors.toSet());
    }

    @Named("mapAssignmentsFromDTO")
    default Set<ClassCourseTeacherAssignment> mapAssignmentsFromDTO(Set<ClassSubjectAssignmentDTO> assignments) {
        if (assignments == null) return Collections.emptySet();
        return assignments.stream().map(a -> {
            Course c = new Course();
            c.setCourseId(a.getCourseId());
            User t = new User();
            t.setId(a.getTeacherId());

            return ClassCourseTeacherAssignment.builder()
                    .course(c)
                    .teacher(t)
                    .build();
        }).collect(Collectors.toSet());
    }

    @Named("mapCategory")
    default CourseCategory mapCategory(Integer categoryId) {
        if (categoryId == null) return null;
        CourseCategory category = new CourseCategory();
        category.setCategoryId(categoryId);
        return category;
    }
}