package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Integer> {

    @Query("SELECT DISTINCT t FROM Timetable t " +
            "LEFT JOIN FETCH t.classEntity c " +
            "LEFT JOIN FETCH t.course co " +
            "LEFT JOIN c.classCourseTeacherAssignments ccta " +
            "ON ccta.classEntity.classId = c.classId AND ccta.course.courseId = co.courseId " +
            "LEFT JOIN FETCH ccta.teacher " +
            "WHERE c.classId = :classId")
    List<Timetable> findTimetableDetailsByClassId(@Param("classId") Integer classId);

    @Query("SELECT DISTINCT t FROM Timetable t " +
            "LEFT JOIN FETCH t.classEntity c " +
            "LEFT JOIN FETCH t.course co " +
            "LEFT JOIN c.classCourseTeacherAssignments ccta " +
            "ON ccta.classEntity.classId = c.classId AND ccta.course.courseId = co.courseId " +
            "LEFT JOIN FETCH ccta.teacher " +
            "WHERE c.classId IN :classIds")
    List<Timetable> findTimetableDetailsByClassIdIn(@Param("classIds") List<Integer> classIds);

    @Query("SELECT DISTINCT t FROM Timetable t " +
            "LEFT JOIN FETCH t.classEntity c " +
            "LEFT JOIN FETCH t.course co " +
            "LEFT JOIN c.classCourseTeacherAssignments ccta " +
            "ON ccta.classEntity.classId = c.classId AND ccta.course.courseId = co.courseId " +
            "LEFT JOIN FETCH ccta.teacher " +
            "WHERE c.classId = :classId AND co.courseId IN :courseIds")
    List<Timetable> findTimetableDetailsByClassIdAndCourseIds(
            @Param("classId") Integer classId,
            @Param("courseIds") Set<Integer> courseIds
    );

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END " +
            "FROM Timetable t " +
            "WHERE t.classEntity.classId = :classId " +
            "AND t.timetableId <> :excludeId " +
            "AND t.date = :date " +
            "AND t.endTime > :startTime AND t.startTime < :endTime")
    boolean existsConflictExcludingId(@Param("classId") Integer classId,
                                      @Param("date") LocalDate date,
                                      @Param("startTime") LocalTime startTime,
                                      @Param("endTime") LocalTime endTime,
                                      @Param("excludeId") Integer excludeId);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END " +
            "FROM Timetable t " +
            "WHERE t.classEntity.classId = :classId " +
            "AND t.date = :date " +
            "AND t.endTime > :startTime AND t.startTime < :endTime")
    boolean existsConflictForClass(@Param("classId") Integer classId,
                                   @Param("date") LocalDate date,
                                   @Param("startTime") LocalTime startTime,
                                   @Param("endTime") LocalTime endTime);


    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END " +
            "FROM Timetable t " +
            "JOIN ClassCourseTeacherAssignment a ON t.classEntity.classId = a.classEntity.classId AND t.course.courseId = a.course.courseId " +
            "WHERE a.teacher.id = :teacherId " +
            "AND t.date = :date " +
            "AND t.endTime > :startTime AND t.startTime < :endTime " +
            "AND t.timetableId <> :excludeId")
    boolean existsConflictForTeacherExcludingId(@Param("teacherId") Integer teacherId,
                                                @Param("date") LocalDate date,
                                                @Param("startTime") LocalTime startTime,
                                                @Param("endTime") LocalTime endTime,
                                                @Param("excludeId") Integer excludeId);

    @Transactional
    void deleteAllByClassEntity(ClassEntity classEntity);
}