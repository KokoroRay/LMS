package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.GradingPolicyDTO;

public interface GradingPolicyService {
    GradingPolicyDTO getPolicyByCourseId(Integer courseId);
    GradingPolicyDTO setGradingPolicy(GradingPolicyDTO dto);
}
