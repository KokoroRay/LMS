// SurveyQuestionRepository
package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.SurveyQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SurveyQuestionRepository extends JpaRepository<SurveyQuestion, Integer> {
    List<SurveyQuestion> findBySurvey_SurveyId(Integer surveyId);
}
