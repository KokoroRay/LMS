package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.LessonQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonQuestionRepository extends JpaRepository<LessonQuestion, Integer> {

    List<LessonQuestion> findByLessonLessonIdOrderByOrderIndex(Integer lessonId);

    @Query("SELECT lq FROM LessonQuestion lq WHERE lq.lesson.lessonId = :lessonId AND lq.question.questionId = :questionId")
    Optional<LessonQuestion> findByLessonIdAndQuestionId(@Param("lessonId") Integer lessonId,
                                                         @Param("questionId") Integer questionId);

    boolean existsByLessonLessonIdAndQuestionQuestionId(Integer lessonId, Integer questionId);

    long countByLessonLessonId(Integer lessonId);

    @Query("SELECT MAX(lq.orderIndex) FROM LessonQuestion lq WHERE lq.lesson.lessonId = :lessonId")
    Integer findMaxOrderIndexByLessonId(@Param("lessonId") Integer lessonId);

}
