package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.ClassCourseTeacherAssignment;
import com.ra.base_spring_boot.model.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClassCourseTeacherAssignmentRepository extends JpaRepository<ClassCourseTeacherAssignment, Long> {

    Optional<ClassCourseTeacherAssignment> findByClassEntityClassIdAndCourseCourseId(Integer classId, Integer courseId);

    List<ClassCourseTeacherAssignment> findByClassEntityClassIdAndTeacherId(Integer classId, Integer teacherId);

    void deleteAllByClassEntity(ClassEntity classEntity);

    List<ClassCourseTeacherAssignment> findByTeacherId(Integer teacherId);

    boolean existsByClassEntityClassIdAndCourseCourseIdAndTeacherId(Integer classId, Integer courseId, Integer teacherId);

    // Thêm method mới để lấy tất cả assignments của một class
    List<ClassCourseTeacherAssignment> findByClassEntityClassId(Integer classId);

    @Query("SELECT ccta.classEntity.classId FROM ClassCourseTeacherAssignment ccta WHERE ccta.course.courseId = :courseId")
    List<Integer> findClassIdsByCourseId(@Param("courseId") Integer courseId);

    void deleteAllByCourse_CourseId(Integer courseId);
}
