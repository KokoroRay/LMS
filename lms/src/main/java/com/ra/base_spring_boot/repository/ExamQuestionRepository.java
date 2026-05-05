package com.ra.base_spring_boot.repository;
import com.ra.base_spring_boot.model.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Integer> {
    List<ExamQuestion> findByExam_ExamId(Integer examId);
    long countByExam_ExamId(Integer examId);
    void deleteByExam_ExamId(Integer examId);
}