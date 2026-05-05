package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ClassSessionDTO;
import com.ra.base_spring_boot.model.ClassSession;
import com.ra.base_spring_boot.services.ClassSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/class-sessions")
@RequiredArgsConstructor
public class ClassSessionController {

    private final ClassSessionService classSessionService;

    // 1. Lấy danh sách buổi học của một lớp
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ClassSessionDTO>> getSessionsByClass(@PathVariable Integer classId) {
        List<ClassSessionDTO> sessions = classSessionService.getSessionsByClass(classId).stream()
                .map(s -> ClassSessionDTO.builder()
                        .sessionId(s.getSessionId())
                        .classId(s.getClassEntity().getClassId())
                        .className(s.getClassEntity().getClassName())
                        .sessionDate(s.getSessionDate())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .topic(s.getTopic())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(sessions);
    }

    // 2. Lấy chi tiết một buổi học (bao gồm danh sách sinh viên điểm danh)
    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSessionDetails(@PathVariable Integer sessionId) {
        return ResponseEntity.ok(classSessionService.getSessionDetails(sessionId));
    }

    // 3. Sinh buổi học tự động từ timetable của lớp (nếu chưa có)
    @PostMapping("/generate/{classId}")
    public ResponseEntity<?> generateSessionsFromTimetable(@PathVariable Integer classId) {
        int createdCount = classSessionService.generateSessionsFromTimetable(classId);
        return ResponseEntity.ok(Map.of("message", "Generated " + createdCount + " class sessions from timetable"));
    }
}
