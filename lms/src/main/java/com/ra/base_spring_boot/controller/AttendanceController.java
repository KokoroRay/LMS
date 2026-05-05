package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.AttendanceRecordDTO;
import com.ra.base_spring_boot.dto.AttendanceSummaryDTO;
import com.ra.base_spring_boot.dto.AttendanceUpdateDTO;
import com.ra.base_spring_boot.dto.AttendanceBatchSaveDTO;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.services.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final UserRepository userRepository;

    @GetMapping("/session/{timetableId}/list")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MODERATOR')")
    public ResponseEntity<List<AttendanceUpdateDTO>> getAttendanceList(
            @PathVariable Integer timetableId) {
        return ResponseEntity.ok(attendanceService.getAttendanceListByTimetable(timetableId));
    }

    @GetMapping("/class/{classId}/records")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MODERATOR')")
    public List<AttendanceRecordDTO> getAttendanceByClass(
            @PathVariable Integer classId) {
        return attendanceService.getAttendanceByClass(classId);
    }

    @GetMapping("/class/{classId}/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MODERATOR')")
    public List<AttendanceSummaryDTO> getAttendanceSummary(
            @PathVariable Integer classId) {
        return attendanceService.getAttendanceSummaryByClass(classId);
    }

    @PostMapping("/save-batch")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MODERATOR')")
    public ResponseEntity<Void> saveBatchAttendance(
            @RequestBody AttendanceBatchSaveDTO saveDTO) {

        attendanceService.saveBatchAttendance(saveDTO);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/student/{studentId}/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MODERATOR')")
    public ResponseEntity<List<AttendanceSummaryDTO>> getStudentAttendanceSummary(
            @PathVariable Integer studentId) {
        return ResponseEntity.ok(attendanceService.getStudentAttendanceSummary(studentId));
    }



    @GetMapping("/student/me/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_USER')")
    public ResponseEntity<List<AttendanceSummaryDTO>> getMySummary() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        List<AttendanceSummaryDTO> summary =
                attendanceService.getStudentAttendanceSummary(student.getId());

        return ResponseEntity.ok(summary);
    }

}
