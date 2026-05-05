// File: com/ra/base_spring_boot/repository/AssignmentRepository.java
package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Integer> {

    List<Assignment> findBySession_SessionIdOrderByPostedAtAsc(Integer sessionId);

    @Modifying
    @Query("delete from Assignment a where a.session.sessionId = :sessionId")
    int deleteAllBySessionId(@Param("sessionId") Integer sessionId);

    int countBySession_SessionId(Integer sessionId);

    List<Assignment> findByDueDateBetween(LocalDateTime start, LocalDateTime end);

    List<Assignment> findByCourse_CourseId(Integer courseId);

}