package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Integer> {

    List<Quiz> findByClassEntity_ClassId(Integer classId);

    @Query("SELECT q FROM Quiz q WHERE q.classEntity.classId = :classId AND q.isPublished = true")
    List<Quiz> findPublishedQuizzesByClass(@Param("classId") Integer classId);

    @Query("SELECT q FROM Quiz q WHERE q.classEntity.classId = :classId " +
            "AND q.isPublished = true " +
            "AND (q.startTime IS NULL OR q.startTime <= :now) " +
            "AND (q.endTime IS NULL OR q.endTime >= :now)")
    List<Quiz> findAvailableQuizzesByClass(@Param("classId") Integer classId, @Param("now") LocalDateTime now);

    @Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.questions WHERE q.quizId = :quizId")
    Optional<Quiz> findByIdWithQuestions(@Param("quizId") Integer quizId);

    long countByClassEntity_ClassId(Integer classId);
}
