package com.ra.base_spring_boot.dto;

import com.ra.base_spring_boot.dto.req.ClassSubjectAssignmentDTO;
import com.ra.base_spring_boot.model.constants.ClassStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClassDTO {
    private Integer classId;
    private Integer categoryId;
    private String categoryName;

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private Set<Integer> courseIds;
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private Set<String> courseTitles;

    // (Đã xóa logic cũ)
    // private Integer teacherId;
    // private String teacherName;

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private Set<String> teacherNames;

    private String className;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer capacity;
    private Integer currentStudents;
    private ClassStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // SỬA LỖI: Đổi tên 'classCourseTeacherAssignments' -> 'assignments' cho nhất quán
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private Set<ClassSubjectAssignmentDTO> assignments;
}