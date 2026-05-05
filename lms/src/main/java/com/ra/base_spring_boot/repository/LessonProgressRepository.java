package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.LessonProgress;
import com.ra.base_spring_boot.model.LessonProgressId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, LessonProgressId> {

    @Query("SELECT MAX(lp.id.attemptNumber) FROM LessonProgress lp WHERE lp.id.userId = :userId AND lp.id.lessonId = :lessonId")
    Integer findMaxAttemptByStudentAndLesson(@Param("userId") Integer userId, @Param("lessonId") Integer lessonId);

    List<LessonProgress> findByUser_Id(Integer userId);

    List<LessonProgress> findById_UserIdAndLesson_Session_Course_CourseIdOrderByLesson_LessonIdAscId_AttemptNumberDesc(
            Integer userId, Integer courseId
    );
    Optional<LessonProgress> findTopByUser_IdAndLesson_LessonIdOrderById_AttemptNumberDesc(
            Integer userId, Integer lessonId
    );
}