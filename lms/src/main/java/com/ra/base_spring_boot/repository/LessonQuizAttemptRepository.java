package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.LessonQuizAttempt;
import com.ra.base_spring_boot.model.constants.LessonQuizAttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonQuizAttemptRepository extends JpaRepository<LessonQuizAttempt, Integer> {

    List<LessonQuizAttempt> findByLessonLessonIdAndStudentIdOrderByStartedAtDesc(
            Integer lessonId, Integer studentId);

    Optional<LessonQuizAttempt> findByLessonLessonIdAndStudentIdAndStatus(
            Integer lessonId, Integer studentId, LessonQuizAttemptStatus status);

    long countByLessonLessonIdAndStudentId(Integer lessonId, Integer studentId);

    @Query("SELECT a FROM LessonQuizAttempt a " +
            "WHERE a.lesson.lessonId = :lessonId " +
            "AND a.student.id = :studentId " +
            "AND a.status = 'GRADED' " +
            "ORDER BY a.score DESC")
    Optional<LessonQuizAttempt> findBestAttempt(
            @Param("lessonId") Integer lessonId,
            @Param("studentId") Integer studentId);

    Optional<LessonQuizAttempt> findFirstByLessonLessonIdAndStudentIdAndStatusNotOrderBySubmittedAtDesc(
            Integer lessonId, Integer studentId, LessonQuizAttemptStatus status);

    @Query("SELECT COUNT(DISTINCT a.student.id) FROM LessonQuizAttempt a " +
            "WHERE a.lesson.lessonId = :lessonId")
    long countDistinctStudentsByLessonId(@Param("lessonId") Integer lessonId);

    @Query("SELECT AVG(lqa.score) FROM LessonQuizAttempt lqa " +
            "WHERE lqa.student.id = :studentId " +
            "AND lqa.lesson.course.courseId = :courseId")
    Optional<Double> findAverageScoreByStudentAndCourse(@Param("studentId") Integer studentId,
                                                        @Param("courseId") Integer courseId);

    @Query("SELECT lqa FROM LessonQuizAttempt lqa " +
            "WHERE lqa.student.id = :studentId " +
            "AND lqa.lesson.course.courseId = :courseId " +
            "AND lqa.status = com.ra.base_spring_boot.model.constants.LessonQuizAttemptStatus.GRADED " +
            "ORDER BY lqa.lesson.lessonId, lqa.submittedAt DESC")
    List<LessonQuizAttempt> findAllGradedByStudentAndCourseOrderByLessonAndDate(
            @Param("studentId") Integer studentId,
            @Param("courseId") Integer courseId
    );

    List<LessonQuizAttempt> findByLesson_LessonIdAndStudent_IdAndAttemptNumberOrderBySubmittedAtDesc(
            Integer lessonId, Integer studentId, Integer attemptNumber
    );
}
