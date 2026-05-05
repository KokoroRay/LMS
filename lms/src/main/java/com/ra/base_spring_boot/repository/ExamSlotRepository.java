package com.ra.base_spring_boot.repository;
import com.ra.base_spring_boot.model.Exam;
import com.ra.base_spring_boot.model.ExamSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface ExamSlotRepository extends JpaRepository<ExamSlot, Integer> {
    List<ExamSlot> findByExam_ExamId(Integer examId);
    @Transactional
    void deleteAllByExam(Exam exam);
    @Query("SELECT es FROM ExamSlot es WHERE es.exam.examId = :examId AND es.slotTime >= :startTime AND es.slotTime <= :endTime")
    List<ExamSlot> findSlotsByExamAndDateRange(@Param("examId") Integer examId,
                                               @Param("startTime") LocalDateTime startTime,
                                               @Param("endTime") LocalDateTime endTime);
    Optional<ExamSlot> findBySlotIdAndExam_ExamId(Integer slotId, Integer examId);
    @Query("SELECT COUNT(es) > 0 FROM ExamSlot es WHERE es.exam.examId = :examId AND es.slotId = :slotId AND es.currentParticipants < es.maxParticipants")
    boolean hasAvailableSlot(@Param("examId") Integer examId, @Param("slotId") Integer slotId);
}