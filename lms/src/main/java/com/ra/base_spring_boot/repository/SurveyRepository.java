package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Survey;
import com.ra.base_spring_boot.model.SurveyQuestion;
import com.ra.base_spring_boot.model.SurveyResponse;
import com.ra.base_spring_boot.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyRepository extends JpaRepository<Survey, Integer> {
    List<Survey> findByIsActive(Boolean isActive);
    Optional<Survey> findByCourseId(Integer courseId);
}
