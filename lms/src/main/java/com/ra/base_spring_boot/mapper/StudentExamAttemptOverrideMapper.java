package com.ra.base_spring_boot.mapper;

import com.ra.base_spring_boot.dto.resp.StudentExamAttemptOverrideDTO;
import com.ra.base_spring_boot.model.StudentExamAttemptOverride;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface StudentExamAttemptOverrideMapper {

    StudentExamAttemptOverrideMapper INSTANCE = Mappers.getMapper(StudentExamAttemptOverrideMapper.class);

    @Mapping(source = "student.id", target = "studentId")
    @Mapping(source = "student.fullName", target = "studentName")
    @Mapping(source = "exam.examId", target = "examId")
    @Mapping(source = "exam.title", target = "examTitle")
    @Mapping(source = "grantedByInstructor.id", target = "grantedByInstructorId")
    @Mapping(source = "grantedByInstructor.fullName", target = "grantedByInstructorName")
    StudentExamAttemptOverrideDTO toDto(StudentExamAttemptOverride entity);
}
