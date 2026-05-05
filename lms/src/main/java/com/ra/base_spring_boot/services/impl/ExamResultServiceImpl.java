package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.events.GradeUpdatedEvent;
import com.ra.base_spring_boot.model.ExamResult;
import com.ra.base_spring_boot.repository.ExamResultRepository;
import com.ra.base_spring_boot.services.ExamResultService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExamResultServiceImpl implements ExamResultService {

    private final ExamResultRepository examResultRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public ExamResult saveExamResult(ExamResult examResult) {
        examResultRepository.save(examResult);

        Integer studentId = examResult.getStudent().getId();
        Integer classId = examResult.getExam().getClassEntity().getClassId();
        Integer courseId = examResult.getExam().getCourse().getCourseId();

        eventPublisher.publishEvent(new GradeUpdatedEvent(this, studentId, classId, courseId));

        return examResult;
    }
}