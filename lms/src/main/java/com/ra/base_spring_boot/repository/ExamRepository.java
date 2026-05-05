package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.Exam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Integer> {

    List<Exam> findAllByClassEntity(ClassEntity classEntity);

    Page<Exam> findByClassEntity_ClassId(Integer classId, Pageable pageable);

    List<Exam> findByClassEntity_ClassIdAndIsPublishedTrue(Integer classId);

    @Query("""
            SELECT DISTINCT e FROM Exam e
            JOIN e.examSlots es
            WHERE e.classEntity.classId = :classId
            AND e.isPublished = true
            AND es.slotTime <= :now
            AND FUNCTION('TIMESTAMPADD', MINUTE, e.durationMinutes, es.slotTime) >= :now
            """)
    List<Exam> findActiveExamsByClass(@Param("classId") Integer classId,
                                      @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(er) FROM ExamResult er WHERE er.exam.examId = :examId AND er.student.id = :studentId")
    Integer countAttemptsByStudent(@Param("examId") Integer examId,
                                   @Param("studentId") Integer studentId);

    Optional<Exam> findByExamIdAndIsPublishedTrue(Integer examId);

    boolean existsByExamIdAndIsPublishedTrue(Integer examId);

    // --- ĐÃ SỬA: Thay thế hàm lỗi startTime bằng hàm query qua ExamSlots ---
    @Query("SELECT DISTINCT e FROM Exam e JOIN e.examSlots s WHERE s.slotTime BETWEEN :start AND :end AND e.isPublished = true")
    List<Exam> findUpcomingExams(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
        SELECT e FROM Exam e
        LEFT JOIN FETCH e.examSlots
        LEFT JOIN FETCH e.examQuestions
        WHERE e.examId = :id
    """)
    Optional<Exam> findFullExam(@Param("id") Integer id);
}