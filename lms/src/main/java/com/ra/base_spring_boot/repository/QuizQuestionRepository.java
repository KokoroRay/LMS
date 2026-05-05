package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Integer> {

    List<QuizQuestion> findByQuiz_QuizId(Integer quizId);

    long countByQuiz_QuizId(Integer quizId);

    void deleteByQuiz_QuizId(Integer quizId);
}
