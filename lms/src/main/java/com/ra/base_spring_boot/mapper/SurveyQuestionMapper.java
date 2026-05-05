package com.ra.base_spring_boot.mapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.model.Survey;
import com.ra.base_spring_boot.model.SurveyQuestion;
import com.ra.base_spring_boot.dto.SurveyQuestionDTO;
import java.util.Collections;
import java.util.List;
public class SurveyQuestionMapper {

    private static final ObjectMapper mapper = new ObjectMapper();

    // Convert từ entity -> DTO
    public static SurveyQuestionDTO toDTO(SurveyQuestion entity) {
        List<String> optionsList;
        try {
            if (entity.getOptions() != null && !entity.getOptions().isEmpty()) {
                optionsList = mapper.readValue(entity.getOptions(), new TypeReference<List<String>>() {});
            } else {
                optionsList = Collections.emptyList();
            }
        } catch (Exception e) {
            optionsList = Collections.emptyList();
        }

        return SurveyQuestionDTO.builder()
                .questionId(entity.getQuestionId())
                .surveyId(entity.getSurvey().getSurveyId())
                .questionText(entity.getQuestionText())
                .questionType(entity.getQuestionType().name())
                .options(optionsList)
                .build();
    }

    // Convert từ DTO -> entity
    public static SurveyQuestion toEntity(SurveyQuestionDTO dto, Survey survey) {
        String optionsJson;
        try {
            if (dto.getOptions() != null) {
                optionsJson = mapper.writeValueAsString(dto.getOptions());
            } else {
                optionsJson = "[]";
            }
        } catch (Exception e) {
            optionsJson = "[]";
        }

        return SurveyQuestion.builder()
                .questionId(dto.getQuestionId())
                .survey(survey)
                .questionText(dto.getQuestionText())
                .questionType(SurveyQuestion.QuestionType.valueOf(dto.getQuestionType()))
                .options(optionsJson)
                .build();
    }
}
