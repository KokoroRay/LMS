package com.ra.base_spring_boot.mapper;

import com.ra.base_spring_boot.dto.resp.ExamResultDTO;
import com.ra.base_spring_boot.model.ExamResult;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ExamResultMapper {

    @Mapping(source = "exam.title", target = "examTitle")
    @Mapping(source = "student.fullName", target = "studentName")
    @Mapping(source = "student.id", target = "studentId")
    @Mapping(source = "exam.examId", target = "examId")
    @Mapping(source = "feedback", target = "feedback")
    ExamResultDTO toDTO(ExamResult examResult);

    List<ExamResultDTO> toDTOList(List<ExamResult> examResults);
}