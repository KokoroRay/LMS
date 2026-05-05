// SurveyResponseRepository
package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.SurveyResponse;
import com.ra.base_spring_boot.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Integer> {
    // Lấy tất cả phản hồi của một survey
    List<SurveyResponse> findBySurvey_SurveyId(Integer surveyId);

    // Lấy phản hồi theo student
    List<SurveyResponse> findByStudent_Id(Integer studentId);
    List<SurveyResponse> findByStudent(User student);

    // Lấy tất cả phản hồi của một câu hỏi
    List<SurveyResponse> findByQuestion_QuestionId(Integer questionId);

    // Lấy phản hồi của một survey theo student
    List<SurveyResponse> findBySurvey_SurveyIdAndStudent_Id(Integer surveyId, Integer studentId);

    // Lấy phản hồi của một student cho một survey và một question
    SurveyResponse findBySurvey_SurveyIdAndQuestion_QuestionIdAndStudent_Id(
            Integer surveyId, Integer questionId, Integer studentId);

    boolean existsBySurvey_CourseIdAndStudent_Id(Integer courseId, Integer studentId);
}
