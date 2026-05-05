package com.ra.base_spring_boot.mapper;

import com.ra.base_spring_boot.dto.ExamDTO;
import com.ra.base_spring_boot.dto.req.ExamRequestDTO;
import com.ra.base_spring_boot.model.Exam;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {ExamSlotMapper.class, ExamQuestionMapper.class},
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface ExamMapper {

    @Mapping(source = "classEntity.classId", target = "classId")
    @Mapping(source = "classEntity.className", target = "className")

    @Mapping(source = "course.courseId", target = "courseId")
    @Mapping(source = "course.title", target = "courseTitle")

    @Mapping(source = "examSlots", target = "examSlots")
    @Mapping(source = "examQuestions", target = "examQuestions")
    ExamDTO toDTO(Exam exam);

    List<ExamDTO> toDTOList(List<Exam> exams);

    @Mapping(target = "examId", ignore = true)
    @Mapping(target = "classEntity", ignore = true)
    @Mapping(target = "course", ignore = true)
    @Mapping(target = "examQuestions", ignore = true)
    @Mapping(target = "examSlots", ignore = true)
    @Mapping(target = "examResults", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Exam toEntity(ExamRequestDTO examRequestDTO);

    @Mapping(target = "examId", ignore = true)
    @Mapping(target = "classEntity", ignore = true)
    @Mapping(target = "course", ignore = true)
    @Mapping(target = "examQuestions", ignore = true)
    @Mapping(target = "examSlots", ignore = true)
    @Mapping(target = "examResults", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntityFromDTO(ExamRequestDTO examRequestDTO, @MappingTarget Exam exam);
}
