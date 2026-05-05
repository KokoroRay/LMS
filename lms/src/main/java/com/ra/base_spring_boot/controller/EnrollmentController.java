package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.EnrollmentDTO;
import com.ra.base_spring_boot.services.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/classes/{classId}/students")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @GetMapping
    public List<EnrollmentDTO> getStudents(@PathVariable Integer classId) {
        return enrollmentService.getStudentsByClass(classId);
    }

    @PostMapping
    public EnrollmentDTO addStudent(@PathVariable Integer classId, @RequestParam Integer studentId) {
        return enrollmentService.addStudentToClass(classId, studentId);
    }

    @DeleteMapping("/{studentId}")
    public void removeStudent(@PathVariable Integer classId, @PathVariable Integer studentId) {
        enrollmentService.removeStudentFromClass(classId, studentId);
    }

    @PatchMapping("/{studentId}")
    public EnrollmentDTO updateStudent(@PathVariable Integer classId,
                                       @PathVariable Integer studentId,
                                       @RequestParam Double progress,
                                       @RequestParam String status) {
        return enrollmentService.updateStudentProgress(classId, studentId, progress, status);
    }

    @PostMapping("/bulk")
    public ResponseEntity<String> bulkAddStudents(@PathVariable Integer classId, @RequestBody List<Integer> studentIds) {
        enrollmentService.bulkAddStudentsToClass(classId, studentIds);
        return ResponseEntity.ok("Students enrolled successfully");
    }
}
