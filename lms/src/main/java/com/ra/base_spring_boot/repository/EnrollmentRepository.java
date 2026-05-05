package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.Enrollment;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Integer> {
    List<Enrollment> findByClassEntity(ClassEntity classEntity);

    @Transactional
    void deleteAllByClassEntity(ClassEntity classEntity);

    Optional<Enrollment> findByClassEntityAndStudent(ClassEntity classEntity, User student);

    Long countByClassEntityClassIdAndStatus(Integer classId, EnrollmentStatus status);

    @Query("""
        SELECT e.classEntity.classId
        FROM Enrollment e
        JOIN e.classEntity c
        JOIN c.classCourseTeacherAssignments ccta
        WHERE e.student.id = :studentId
          AND ccta.course.courseId = :courseId
          AND e.status = 'ACTIVE'
    """)
    List<Integer> findClassIdByStudentIdAndCourseId(
            @Param("studentId") Integer studentId,
            @Param("courseId") Integer courseId
    );


    @Query("""
        SELECT e FROM Enrollment e 
        JOIN e.classEntity c 
        JOIN c.classCourseTeacherAssignments a 
        WHERE e.student.id = :studentId 
        AND a.course.courseId = :courseId
    """)
    List<Enrollment> findByStudentIdAndCourseId_Custom(
            @Param("studentId") Integer studentId,
            @Param("courseId") Integer courseId);

    /*
    // Phương thức này (dòng 44) không còn hợp lệ vì ClassEntity không còn 'courses'
    List<Enrollment> findByStudent_IdAndClassEntity_Courses_CourseId(
            @Param("studentId") Integer studentId,
            @Param("courseId") Integer courseId);
    */


    // Phương thức này được ClassServiceImpl sử dụng để kiểm tra trùng lặp
    boolean existsByStudentIdAndClassEntityClassId(
            Integer studentId,
            Integer classId);

    // (Bạn có thể dùng phương thức này nếu muốn kiểm tra cả status)
    boolean existsByStudentIdAndClassEntityClassIdAndStatus(
            Integer studentId,
            Integer classId,
            EnrollmentStatus status);

    /* // @Query (dòng 63) đã được thay thế bằng derived query method ở trên
    @Query(value = "SELECT CASE WHEN COUNT(e) > 0 THEN TRUE ELSE FALSE END " +
            "FROM Enrollment e WHERE e.student.id = :studentId AND e.classEntity.classId = :classId AND e.status = 'ACTIVE'")
    boolean existsByStudent_IdAndClassEntity_ClassId(
            @Param("studentId") Integer studentId,
            @Param("classId") Integer classId);
    */


    @Query("SELECT e.classEntity.classId FROM Enrollment e WHERE e.student.id = :studentId AND e.status = 'ACTIVE'")
    List<Integer> findActiveClassIdsByStudentId(@Param("studentId") Integer studentId);

    int countByClassEntity_ClassId(Integer classId);

    @Query("SELECT e FROM Enrollment e WHERE e.student.id = :studentId AND e.status = 'ACTIVE' ORDER BY e.enrolledAt DESC")
    List<Enrollment> findActiveEnrollmentsByStudentId(@Param("studentId") Integer studentId);

    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN TRUE ELSE FALSE END " +
            "FROM Enrollment e " +
            "JOIN e.classEntity c " +
            "JOIN c.classCourseTeacherAssignments ccta " +
            "WHERE e.student.id = :studentId " +
            "AND ccta.course.courseId = :courseId " +
            "AND e.status = 'ACTIVE'")
    boolean existsByStudentIdAndCourseId(@Param("studentId") Integer studentId, @Param("courseId") Integer courseId);
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN TRUE ELSE FALSE END " +
            "FROM Enrollment e WHERE e.student = :student AND e.status = :status AND e.classEntity.classId <> :classId")
    boolean existsByStudentAndStatusAndClassEntity_ClassIdNot(
            @Param("student") User student,
            @Param("status") EnrollmentStatus status,
            @Param("classId") Integer classId);

    @Query("SELECT e FROM Enrollment e WHERE e.student = :student AND e.status = :status AND e.classEntity.classId <> :classId")
    List<Enrollment> findByStudentAndStatusAndClassEntity_ClassIdNot(
            @Param("student") User student,
            @Param("status") EnrollmentStatus status,
            @Param("classId") Integer classId);
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN TRUE ELSE FALSE END FROM Enrollment e WHERE e.student = :student AND e.status = :status")
    boolean existsByStudentAndStatus(@Param("student") User student, @Param("status") EnrollmentStatus status);
    List<Enrollment> findByStudent_Id(Integer studentId);

    @Query("""
        SELECT e FROM Enrollment e
        JOIN e.classEntity ce
        JOIN ce.classCourseTeacherAssignments ccta
        WHERE e.student.id = :studentId
          AND ccta.course.courseId = :courseId
          AND e.status = :status
          AND e.classEntity.classId <> :excludeClassId
    """)
    List<Enrollment> findByStudentIdAndCourseIdAndStatusAndExcludeClassId(
            @Param("studentId") Integer studentId,
            @Param("courseId") Integer courseId,
            @Param("status") EnrollmentStatus status,
            @Param("excludeClassId") Integer excludeClassId
    );
}