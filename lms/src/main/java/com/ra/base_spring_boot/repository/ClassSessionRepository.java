package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.ClassSession;
import com.ra.base_spring_boot.model.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, Integer> {

    boolean existsByTimetableAndSessionDateAndStartTimeAndEndTime(
            Timetable timetable,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime
    );

    Optional<ClassSession> findFirstByTimetable_ClassEntity_ClassId(Integer classId);

    boolean existsByClassEntity_ClassIdAndSessionDate(Integer classId, LocalDate sessionDate);

    List<ClassSession> findByTimetable_ClassEntity_ClassIdOrderBySessionDateAscStartTimeAsc(Integer classId);

    List<ClassSession> findByTimetable_TimetableId(Integer timetableId);


    @Query("""
        SELECT CASE WHEN COUNT(cs) > 0 THEN true ELSE false END
        FROM ClassSession cs
        WHERE cs.timetable.classEntity.classId = :classId
          AND (
            (:startTime < cs.endTime AND :endTime > cs.startTime)
          )
    """)
    boolean existsClassConflict(
            @Param("classId") Integer classId,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );


    @Query("""
        SELECT CASE WHEN COUNT(cs) > 0 THEN true ELSE false END
        FROM ClassSession cs
        JOIN ClassCourseTeacherAssignment ccta
            ON ccta.classEntity.classId = cs.timetable.classEntity.classId
            AND ccta.course.courseId = cs.timetable.course.courseId
        WHERE ccta.teacher.id = :teacherId
          AND (
            (:startTime < cs.endTime AND :endTime > cs.startTime)
          )
    """)
    boolean existsTeacherConflict(
            @Param("teacherId") Integer teacherId,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

}
