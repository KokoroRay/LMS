package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.StudentExamAttemptOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface StudentExamAttemptOverrideRepository extends JpaRepository<StudentExamAttemptOverride, Integer> {
    Optional<StudentExamAttemptOverride> findByStudent_IdAndExam_ExamId(Integer studentId, Integer examId);
    List<StudentExamAttemptOverride> findByExam_ExamId(Integer examId);
}
