package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.GradingPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GradingPolicyRepository extends JpaRepository<GradingPolicy, Integer> {
    Optional<GradingPolicy> findByCourse_CourseId(Integer courseId);
    void deleteAllByCourse_CourseId(Integer courseId);
}