package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.SurveyStatistics;
import com.ra.base_spring_boot.model.SurveyQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SurveyStatisticsRepository extends JpaRepository<SurveyStatistics, Integer> {
    List<SurveyStatistics> findByQuestion(SurveyQuestion question);
}
