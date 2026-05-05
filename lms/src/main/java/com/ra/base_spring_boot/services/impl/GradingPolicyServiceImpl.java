package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.GradingPolicyDTO;
import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.GradingPolicy;
import com.ra.base_spring_boot.repository.CourseRepository;
import com.ra.base_spring_boot.repository.GradingPolicyRepository;
import com.ra.base_spring_boot.services.GradingPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GradingPolicyServiceImpl implements GradingPolicyService {

    private final GradingPolicyRepository gradingPolicyRepository;
    private final CourseRepository courseRepository;

    @Override
    public GradingPolicyDTO getPolicyByCourseId(Integer courseId) {
        GradingPolicy policy = gradingPolicyRepository.findByCourse_CourseId(courseId)
                .orElseThrow(() -> new RuntimeException("Policy not found for course ID: " + courseId));
        return mapToDTO(policy);
    }

    @Override
    public GradingPolicyDTO setGradingPolicy(GradingPolicyDTO dto) {
        double total = dto.getAssignmentsWeight() + dto.getQuizzesWeight() + dto.getExamsWeight();
        if (Math.abs(total - 100.0) > 0.01) {
            throw new RuntimeException("Total weight must equal 100%");
        }

        GradingPolicy policy = gradingPolicyRepository.findByCourse_CourseId(dto.getCourseId())
                .orElseGet(() -> {
                    Course course = courseRepository.findById(dto.getCourseId())
                            .orElseThrow(() -> new RuntimeException("Course not found for ID: " + dto.getCourseId()));
                    return GradingPolicy.builder().course(course).build();
                });

        policy.setAssignmentsWeight(dto.getAssignmentsWeight());
        policy.setQuizzesWeight(dto.getQuizzesWeight());
        policy.setExamsWeight(dto.getExamsWeight());
        policy.setPassingScore(dto.getPassingScore());
        policy.setUpdatedAt(LocalDateTime.now());

        gradingPolicyRepository.save(policy);
        return mapToDTO(policy);
    }

    private GradingPolicyDTO mapToDTO(GradingPolicy policy) {
        return GradingPolicyDTO.builder()
                .policyId(policy.getPolicyId())
                .courseId(policy.getCourse() != null ? policy.getCourse().getCourseId() : null)
                .assignmentsWeight(policy.getAssignmentsWeight())
                .quizzesWeight(policy.getQuizzesWeight())
                .examsWeight(policy.getExamsWeight())
                .passingScore(policy.getPassingScore())
                .build();
    }
}