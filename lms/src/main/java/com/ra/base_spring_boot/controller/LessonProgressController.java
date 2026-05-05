package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.req.LessonProgressRequestDTO;
import com.ra.base_spring_boot.dto.resp.EnrollmentProgressDTO;
import com.ra.base_spring_boot.dto.resp.LessonProgressDTO;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.LessonProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
public class LessonProgressController {

    private final LessonProgressService progressService;

    private Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof MyUserDetails principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        return principal.getId();
    }

    // Cập nhật hoặc tạo mới tiến độ bài học
    @PostMapping
    public ResponseEntity<LessonProgressDTO> createOrUpdateProgress(@RequestBody LessonProgressRequestDTO dto) {
        Integer studentId = getCurrentUserId();
        return ResponseEntity.ok(progressService.createOrUpdateProgress(studentId, dto));
    }

    // Lấy toàn bộ tiến độ của user hiện tại
    @GetMapping
    public ResponseEntity<List<LessonProgressDTO>> getCurrentUserProgress() {
        Integer studentId = getCurrentUserId();
        return ResponseEntity.ok(progressService.getProgressByStudent(studentId));
    }

    // Lấy toàn bộ tiến độ các khóa học đã đăng ký của user hiện tại
    @GetMapping("/enrollment")
    public ResponseEntity<List<EnrollmentProgressDTO>> getCurrentUserEnrollmentProgress() {
        Integer studentId = getCurrentUserId();
        return ResponseEntity.ok(progressService.getEnrollmentProgress(studentId));
    }

    // Lấy tiến độ của một lesson cụ thể cho user hiện tại
    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<LessonProgressDTO> getLessonProgressForCurrentUser(
            @PathVariable Integer lessonId,
            @RequestParam(required = false, defaultValue = "1") Integer attemptNumber) {
        Integer studentId = getCurrentUserId();
        LessonProgressDTO progress = progressService.getLessonProgress(studentId, lessonId, attemptNumber);
        if (progress == null) {
            return ResponseEntity.noContent().build(); // 204 No Content if no progress yet
        }
        return ResponseEntity.ok(progress);
    }
}

