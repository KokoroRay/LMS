package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.LessonQuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonQuizAnswerRepository extends JpaRepository<LessonQuizAnswer, Integer> {
    void deleteByLessonQuestionLessonQuestionId(Integer lessonQuestionId);

    List<LessonQuizAnswer> findByAttemptAttemptIdOrderByLessonQuestionOrderIndex(Integer attemptId);

    Optional<LessonQuizAnswer> findByAttemptAttemptIdAndLessonQuestionLessonQuestionId(
            Integer attemptId, Integer lessonQuestionId);

    boolean existsByAttemptAttemptIdAndLessonQuestionLessonQuestionId(
            Integer attemptId, Integer lessonQuestionId);

    void deleteByAttemptAttemptId(Integer attemptId);

    long countByAttemptAttemptId(Integer attemptId);

    @Query("SELECT COUNT(a) FROM LessonQuizAnswer a " +
            "WHERE a.attempt.attemptId = :attemptId AND a.isCorrect = true")
    long countCorrectAnswers(@Param("attemptId") Integer attemptId);
}
