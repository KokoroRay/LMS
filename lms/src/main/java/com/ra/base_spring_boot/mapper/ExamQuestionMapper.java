package com.ra.base_spring_boot.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.ExamQuestionDTO;
import com.ra.base_spring_boot.dto.TestCaseDTO;
import com.ra.base_spring_boot.dto.req.AddExamQuestionDTO;
import com.ra.base_spring_boot.dto.req.CustomQuestionRequestDTO;
import com.ra.base_spring_boot.dto.req.UpdateExamQuestionDTO;
import com.ra.base_spring_boot.model.ExamQuestion;
import com.ra.base_spring_boot.model.constants.QuestionType;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public abstract class ExamQuestionMapper {

    @Autowired
    protected ObjectMapper objectMapper;


    @Mapping(target = "choices", expression = "java(convertJsonToStringList(examQuestion.getChoices()))")
    @Mapping(target = "testCases", expression = "java(convertJsonToTestCases(examQuestion.getTestCases()))")
    public abstract ExamQuestionDTO toDTO(ExamQuestion examQuestion);

    public abstract List<ExamQuestionDTO> toDTOList(List<ExamQuestion> examQuestions);

    @Mapping(target = "exQId", ignore = true)
    @Mapping(target = "exam", ignore = true)
    @Mapping(target = "questionType", expression = "java(convertStringToQuestionType(customQuestionRequestDTO.getQuestionType()))")
    @Mapping(target = "choices", expression = "java(convertListToJson(customQuestionRequestDTO.getChoices()))")
    @Mapping(target = "correctAnswer", expression = "java(convertListToJson(customQuestionRequestDTO.getCorrectAnswers()))")
    @Mapping(target = "testCases", expression = "java(convertTestCasesToJson(customQuestionRequestDTO.getTestCases()))")
    @Mapping(target = "points", source = "customQuestionRequestDTO.points") // ADDED
    public abstract ExamQuestion toEntity(CustomQuestionRequestDTO customQuestionRequestDTO);

    @Mapping(target = "exQId", ignore = true)
    @Mapping(target = "exam", ignore = true)
    @Mapping(target = "orderIndex", ignore = true) // Will be set in service
    public abstract ExamQuestion toEntity(AddExamQuestionDTO addExamQuestionDTO);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "exQId", ignore = true)
    @Mapping(target = "exam", ignore = true)
    public abstract void updateEntityFromDTO(UpdateExamQuestionDTO updateDTO, @MappingTarget ExamQuestion examQuestion);

    
    protected QuestionType convertStringToQuestionType(String questionType) {
        if (questionType == null || questionType.isBlank()) return null;
        try {
            return QuestionType.valueOf(questionType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid question type: " + questionType, e);
        }
    }

    protected List<String> convertJsonToStringList(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error parsing JSON to string list", e);
        }
    }

    protected List<TestCaseDTO> convertJsonToTestCases(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<List<TestCaseDTO>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error parsing JSON to test cases", e);
        }
    }

    protected String convertListToJson(List<?> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error converting list to JSON", e);
        }
    }

    protected String convertTestCasesToJson(List<?> testCases) {
        if (testCases == null || testCases.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(testCases);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error converting test cases to JSON", e);
        }
    }

}
