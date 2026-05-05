package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.DashboardSummaryDTO;
import com.ra.base_spring_boot.services.DashboardService;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/instructors")
@RequiredArgsConstructor
public class InstructorController {

    private final DashboardService dashboardService;

    @GetMapping("/me/dashboard-summary")
    public DashboardSummaryDTO getDashboard() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        Object principal = authentication.getPrincipal();
        Integer teacherId;

        if (principal instanceof MyUserDetails myUserDetails) {
            teacherId = myUserDetails.getId(); // Lấy ID thực từ entity
        } else if (principal instanceof org.springframework.security.core.userdetails.User user) {
            // Trường hợp dùng User mặc định của Spring Security
            teacherId = Integer.parseInt(user.getUsername());
        } else {
            throw new RuntimeException("Unexpected principal type: " + principal.getClass());
        }

        return dashboardService.getInstructorDashboard(teacherId);
    }
}
