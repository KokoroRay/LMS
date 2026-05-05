package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.ClassEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Integer> {

    @Query(value = "SELECT DISTINCT c.* FROM classes c " +
            "JOIN class_course_teacher_assignment ccta ON c.class_id = ccta.class_id " +
            "WHERE ccta.teacher_id = :instructorId",
            nativeQuery = true)
    List<ClassEntity> findClassesByInstructorInvolvement(@Param("instructorId") Integer instructorId);

    @Override
    @EntityGraph(attributePaths = {"category"})
    List<ClassEntity> findAllById(Iterable<Integer> ids);

    @Query("SELECT CASE WHEN COUNT(ccta) > 0 THEN true ELSE false END " +
            "FROM ClassCourseTeacherAssignment ccta " +
            "WHERE ccta.classEntity.className = :className AND ccta.course.courseId = :courseId")
    boolean existsByClassNameAndCourseId(@Param("className") String className,
                                         @Param("courseId") Integer courseId);

    @Query("SELECT CASE WHEN COUNT(ccta) > 0 THEN true ELSE false END " +
            "FROM ClassCourseTeacherAssignment ccta " +
            "WHERE ccta.classEntity.className = :className AND ccta.course.courseId = :courseId " +
            "AND ccta.classEntity.classId <> :classId")
    boolean existsByClassNameAndCourseIdAndClassIdNot(@Param("className") String className,
                                                      @Param("courseId") Integer courseId,
                                                      @Param("classId") Integer classId);

    @Query("SELECT DISTINCT ccta.classEntity FROM ClassCourseTeacherAssignment ccta " +
            "WHERE ccta.course.courseId = :courseId")
    List<ClassEntity> findClassesByCourseId(@Param("courseId") Integer courseId);
    
    // Thêm method để tìm class theo className
    @Query("SELECT c FROM ClassEntity c WHERE c.className = :className")
    java.util.Optional<ClassEntity> findByClassName(@Param("className") String className);
}
