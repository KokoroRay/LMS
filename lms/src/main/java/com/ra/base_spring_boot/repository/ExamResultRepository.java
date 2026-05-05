package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Exam;
import com.ra.base_spring_boot.model.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Integer> {

    List<ExamResult> findByExam_ExamIdAndStudent_Id(Integer examId, Integer studentId);

    Optional<ExamResult> findTopByExam_ExamIdAndStudent_IdOrderBySubmittedAtDesc(Integer examId,
                                                                                 Integer studentId);

    @Query("""
        SELECT er FROM ExamResult er
        WHERE er.exam.examId = :examId
        AND er.student.id = :studentId
        ORDER BY er.submittedAt DESC
    """)
    List<ExamResult> findStudentResults(@Param("examId") Integer examId,
                                        @Param("studentId") Integer studentId);

    boolean existsByExam_ExamIdAndStudent_Id(Integer examId, Integer studentId);

    List<ExamResult> findByExam_ExamId(Integer examId);

    @Transactional
    void deleteAllByExam(Exam exam);

    List<ExamResult> findByStudent_Id(Integer studentId);

    Integer countByExam_ExamIdAndStudent_IdAndSubmittedAtIsNotNull(Integer examId, Integer studentId);

    void deleteAllByExamSlot_SlotIdIn(List<Integer> slotIds);

    @Query("""
        SELECT AVG(er.score)
        FROM ExamResult er
        WHERE er.student.id = :studentId
        AND er.exam.classEntity.classId = :classId
        AND er.exam.course.courseId = :courseId
    """)
    Optional<Double> findAverageGradeByStudentAndClassAndCourse(
            @Param("studentId") Integer studentId,
            @Param("classId") Integer classId,
            @Param("courseId") Integer courseId
    );

    @Query("SELECT er FROM ExamResult er " +
            "WHERE er.student.id = :studentId " +
            "AND er.exam.course.courseId = :courseId " +
            "AND er.submittedAt IS NOT NULL " +
            "ORDER BY er.exam.examId, er.submittedAt DESC")
    List<ExamResult> findAllGradedByStudentAndCourseOrderByExamAndDate(
            @Param("studentId") Integer studentId,
            @Param("courseId") Integer courseId
    );
}
