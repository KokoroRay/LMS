package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Integer> {
    List<Lesson> findBySession_Course_CourseId(Integer courseId);

    List<Lesson> findBySession_SessionIdOrderByOrderIndex(Integer sessionId);

    @Modifying
    @Query("delete from Lesson l where l.session.sessionId = :sessionId")
    int deleteAllBySessionId(@Param("sessionId") Integer sessionId);

    int countBySession_SessionId(Integer sessionId);

    void deleteAllByCourse_CourseId(Integer courseId);
}
