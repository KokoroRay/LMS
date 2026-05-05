package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.TimetableDTO;
import com.ra.base_spring_boot.dto.resp.TimetableResponseDTO;
import com.ra.base_spring_boot.dto.ClassDTO;
import com.ra.base_spring_boot.dto.TimetableStudentDTO;
import com.ra.base_spring_boot.dto.resp.CourseDTO;
import com.ra.base_spring_boot.exception.InvalidTimetableOperationException;
import com.ra.base_spring_boot.exception.ResourceNotFoundException;
import com.ra.base_spring_boot.exception.TimetableConflictException;
import com.ra.base_spring_boot.services.TimetableService;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/timetables")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;

    // --- CRUD Admin ---

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<TimetableResponseDTO>> findAllTimetables() {
        List<TimetableResponseDTO> timetables = timetableService.findAll();
        return ResponseEntity.ok(timetables);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER')")
    public ResponseEntity<TimetableResponseDTO> findTimetableById(@PathVariable Integer id) {
        TimetableResponseDTO timetable = timetableService.findById(id);
        return ResponseEntity.ok(timetable);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<TimetableResponseDTO> createTimetable(@RequestBody TimetableDTO timetableDTO) {
        TimetableResponseDTO savedTimetable = timetableService.create(timetableDTO);
        return new ResponseEntity<>(savedTimetable, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<TimetableResponseDTO> updateTimetable(@PathVariable Integer id, @RequestBody TimetableDTO timetableDTO) {
        TimetableResponseDTO updatedTimetable = timetableService.update(id, timetableDTO);
        return ResponseEntity.ok(updatedTimetable);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<Void> deleteTimetable(@PathVariable Integer id) {
        timetableService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler({TimetableConflictException.class, InvalidTimetableOperationException.class})
    public ResponseEntity<String> handleConflictAndInvalidOperationException(RuntimeException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    // --- Standard Class Timetable Query ---

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER')")
    public ResponseEntity<List<TimetableResponseDTO>> getTimetablesByClass(
            @PathVariable Integer classId,
            @AuthenticationPrincipal MyUserDetails userDetails) {

        List<TimetableResponseDTO> timetables;
        String role = userDetails.getUser().getRole().getRoleName().name();

        if (role.equals("ROLE_ADMIN")) {
            timetables = timetableService.findAllSlotsByClassId(classId);
        } else {
            timetables = timetableService.findByClassId(classId);
        }

        return ResponseEntity.ok(timetables);
    }

    @GetMapping("/admin/class/{classId}/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<TimetableResponseDTO>> getAdminAllSlotsByClass(@PathVariable Integer classId) {
        List<TimetableResponseDTO> timetables = timetableService.findAllSlotsByClassId(classId);
        return ResponseEntity.ok(timetables);
    }

    // --- Student Specific Endpoint ---

    @GetMapping("/student/me")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<List<TimetableStudentDTO>> getMyStudentSchedule(
            @AuthenticationPrincipal MyUserDetails userDetails) {
        Integer studentId = userDetails.getUser().getId();
        List<TimetableStudentDTO> schedule = timetableService.getStudentTimetableWithAttendance(studentId);
        return ResponseEntity.ok(schedule);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<List<TimetableStudentDTO>> getStudentSchedule(
            @PathVariable Integer studentId,
            @AuthenticationPrincipal MyUserDetails userDetails) {

        if (userDetails.getUser().getRole().getRoleName().equals("ROLE_USER") &&
                !userDetails.getUser().getId().equals(studentId)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        List<TimetableStudentDTO> schedule = timetableService.getStudentTimetableWithAttendance(studentId);
        return ResponseEntity.ok(schedule);
    }

    // --- Instructor Specific Endpoints ---

    @GetMapping("/instructor/my-classes")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<List<ClassDTO>> getInstructorClasses() {
        List<ClassDTO> classes = timetableService.findClassesByInstructorId();
        return ResponseEntity.ok(classes);
    }

    @GetMapping("/instructor/my-timetable")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<List<TimetableResponseDTO>> getMyEntireTimetable() {
        List<TimetableResponseDTO> timetables = timetableService.findMyEntireTimetable();
        return ResponseEntity.ok(timetables);
    }

    @GetMapping("/instructor/class/{classId}/courses")
    @PreAuthorize("hasAnyAuthority('ROLE_MODERATOR', 'ROLE_ADMIN')")
    public ResponseEntity<List<CourseDTO>> getInstructorCoursesByClass(
            @PathVariable Integer classId,
            @AuthenticationPrincipal MyUserDetails userDetails) {

        Integer instructorId = userDetails.getUser().getId();
        List<CourseDTO> courses =
                timetableService.findCoursesByClassIdAndInstructor(classId, instructorId);

        return ResponseEntity.ok(courses);
    }
}
