package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.CourseGrade;
import com.ra.base_spring_boot.model.constants.GradeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CourseGradeRepository extends JpaRepository<CourseGrade, Integer> {

    // --- LẤY THEO STUDENT ---
    List<CourseGrade> findByStudent_Id(Integer studentId);


    // --- LẤY THEO CLASS ---
    List<CourseGrade> findByClassEntity_ClassId(Integer classId);


    // --- LẤY THEO STUDENT + CLASS ---
    List<CourseGrade> findByStudent_IdAndClassEntity_ClassId(Integer studentId, Integer classId);


    // --- LẤY THEO STUDENT + CLASS + COURSE ---
    Optional<CourseGrade> findByStudent_IdAndClassEntity_ClassIdAndCourse_CourseId(
            Integer studentId,
            Integer classId,
            Integer courseId
    );


    // --- CHECK TỒN TẠI ---
    boolean existsByStudent_IdAndClassEntity_ClassIdAndCourse_CourseId(
            Integer studentId,
            Integer classId,
            Integer courseId
    );


    // --- LẤY COURSE IDs THEO CLASS ---
    @Query("""
        SELECT DISTINCT cg.course.courseId
        FROM CourseGrade cg
        WHERE cg.classEntity.classId = :classId
    """)
    List<Integer> findCourseIdsByClassId(Integer classId);


    // --- LẤY TẤT CẢ COURSE GRADE FAIL TRONG DANH SÁCH CLASS ---
    List<CourseGrade> findByClassEntity_ClassIdInAndStatus(
            List<Integer> classIds,
            GradeStatus status
    );


    // --- LẤY THEO STUDENT + COURSE (KHÔNG CẦN classId) ---
    Optional<CourseGrade> findByStudent_IdAndCourse_CourseId(
            Integer studentId,
            Integer courseId
    );
    void deleteAllByCourse_CourseId(Integer courseId);
    void deleteByStudent_IdAndCourse_CourseIdAndStatus(
            Integer studentId,
            Integer courseId,
            GradeStatus status
    );


}
