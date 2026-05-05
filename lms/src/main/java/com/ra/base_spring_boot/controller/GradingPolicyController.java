package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.GradingPolicyDTO;
import com.ra.base_spring_boot.services.GradingPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/grading")
@RequiredArgsConstructor
public class GradingPolicyController {

    private final GradingPolicyService gradingPolicyService;

    @GetMapping("/{courseId}")
    public GradingPolicyDTO getPolicy(@PathVariable Integer courseId) {
        return gradingPolicyService.getPolicyByCourseId(courseId);
    }

    @PostMapping
    public GradingPolicyDTO setPolicy(@RequestBody GradingPolicyDTO dto) {
        return gradingPolicyService.setGradingPolicy(dto);
    }
}
