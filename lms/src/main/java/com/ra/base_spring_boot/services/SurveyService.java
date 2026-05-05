package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.SurveyDTO;
import com.ra.base_spring_boot.dto.SurveyQuestionDTO;
import com.ra.base_spring_boot.dto.SurveyResponseDTO;
import com.ra.base_spring_boot.dto.SurveyStatisticsDTO;

import java.util.List;

public interface SurveyService {

    // SURVEY
    SurveyDTO createSurvey(SurveyDTO surveyDTO);
    SurveyDTO updateSurvey(Integer surveyId, SurveyDTO surveyDTO);
    void deleteSurvey(Integer surveyId);
    SurveyDTO getSurveyById(Integer surveyId);
    SurveyDTO getSurveyByCourseId(Integer courseId);
    List<SurveyDTO> getAllSurveys(Boolean isActive);
    SurveyDTO activateSurvey(Integer surveyId);
    SurveyDTO deactivateSurvey(Integer surveyId);

    // QUESTIONS
    SurveyQuestionDTO addQuestion(Integer surveyId, SurveyQuestionDTO questionDTO);
    SurveyQuestionDTO updateQuestion(SurveyQuestionDTO questionDTO);
    void deleteQuestion(Integer questionId);
    List<SurveyQuestionDTO> getQuestionsBySurvey(Integer surveyId);

    // RESPONSES
    List<SurveyResponseDTO> submitResponses(List<SurveyResponseDTO> responseDTOs);
    List<SurveyResponseDTO> getResponsesBySurvey(Integer surveyId);
    List<SurveyResponseDTO> getResponsesByUser(Integer userId);
    SurveyResponseDTO updateResponse(SurveyResponseDTO responseDTO);

    boolean hasUserEvaluatedCourse(Integer courseId);


    // STATISTICS
    List<SurveyStatisticsDTO> getSurveyStatistics(Integer surveyId);
    List<SurveyStatisticsDTO> getSurveyStatisticsByClass(Integer surveyId, Integer classId);
}
