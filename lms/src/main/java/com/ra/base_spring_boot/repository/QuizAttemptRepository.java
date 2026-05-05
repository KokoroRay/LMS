package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.QuizAttempt;
import com.ra.base_spring_boot.model.constants.QuizAttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Integer> {

    List<QuizAttempt> findByQuiz_QuizId(Integer quizId);

    List<QuizAttempt> findByStudent_Id(Integer studentId);

    List<QuizAttempt> findByQuiz_QuizIdAndStudent_Id(Integer quizId, Integer studentId);

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.quiz.quizId = :quizId " +
            "AND qa.student.id = :studentId " +
            "ORDER BY qa.startedAt DESC")
    Optional<QuizAttempt> findLatestAttempt(@Param("quizId") Integer quizId, @Param("studentId") Integer studentId);

    Optional<QuizAttempt> findByQuiz_QuizIdAndStudent_IdAndStatus(
            Integer quizId, Integer studentId, QuizAttemptStatus status);

    @Query("SELECT qa FROM QuizAttempt qa LEFT JOIN FETCH qa.answers WHERE qa.attemptId = :attemptId")
    Optional<QuizAttempt> findByIdWithAnswers(@Param("attemptId") Integer attemptId);

    long countByQuiz_QuizId(Integer quizId);

    long countByQuiz_QuizIdAndStatus(Integer quizId, QuizAttemptStatus status);

    @Query("SELECT AVG(qa.score) FROM QuizAttempt qa " +
            "WHERE qa.student.id = :studentId " +
            "AND qa.quiz.course.courseId = :courseId")
    Optional<Double> findAverageGradeByStudentAndCourse(@Param("studentId") Integer studentId,
                                                        @Param("courseId") Integer courseId);
    Optional<QuizAttempt> findFirstByQuiz_QuizIdAndStudent_IdAndStatusInOrderBySubmittedAtDesc(
            Integer quizId,
            Integer studentId,
            List<QuizAttemptStatus> statuses
    );

    List<QuizAttempt> findByQuiz_QuizIdAndStudent_IdAndAttemptNumberOrderBySubmittedAtDesc(
            Integer quizId, Integer studentId, Integer attemptNumber
    );

    Optional<QuizAttempt> findTopByQuiz_QuizIdAndStudent_IdAndAttemptNumberOrderByStartedAtDesc(
            Integer quizId, Integer studentId, Integer attemptNumber
    );
}