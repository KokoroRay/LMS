package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Integer> {

    @Query("SELECT COALESCE(MAX(s.position), 0) FROM Session s WHERE s.course.courseId = :courseId")
    Optional<Integer> findMaxPositionByCourseId(@Param("courseId") Integer courseId);


    List<Session> findByCourse_CourseIdOrderByPositionAsc(Integer courseId);

    boolean existsByCourse_CourseIdAndPosition(Integer courseId, Integer position);


}

