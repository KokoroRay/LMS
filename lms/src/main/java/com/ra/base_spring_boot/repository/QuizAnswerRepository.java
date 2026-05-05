package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.QuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Integer> {

    List<QuizAnswer> findByAttempt_AttemptId(Integer attemptId);

    Optional<QuizAnswer> findByAttempt_AttemptIdAndQuestion_QuestionId(Integer attemptId, Integer questionId);

    long countByAttempt_AttemptId(Integer attemptId);

    void deleteByAttempt_AttemptId(Integer attemptId);
}
