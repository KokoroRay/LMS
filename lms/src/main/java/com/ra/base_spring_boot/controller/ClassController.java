package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ClassDTO;
import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.req.ClassRequestDTO;
import com.ra.base_spring_boot.dto.req.ClassSubjectAssignmentDTO;
import com.ra.base_spring_boot.model.constants.ClassStatus;
import com.ra.base_spring_boot.services.IClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/classes")
@RequiredArgsConstructor
public class ClassController {

    private final IClassService classService;

    @GetMapping
    public ResponseEntity<ResponseWrapper<List<ClassDTO>>> getAllClasses() {
        List<ClassDTO> classes = classService.getAllClasses();
        return ResponseEntity.ok(ResponseWrapper.<List<ClassDTO>>builder()
                .status(HttpStatus.OK)
                .data(classes)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseWrapper<ClassDTO>> getClassById(@PathVariable Integer id) {
        ClassDTO classDTO = classService.getClassById(id);
        return ResponseEntity.ok(ResponseWrapper.<ClassDTO>builder()
                .status(HttpStatus.OK)
                .data(classDTO)
                .build());
    }

    @PostMapping
    public ResponseEntity<ResponseWrapper<ClassDTO>> createClass(@Valid @RequestBody ClassRequestDTO classRequestDTO) {
        ClassDTO createdClass = classService.createClass(classRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.<ClassDTO>builder()
                        .status(HttpStatus.OK)
                        .data(createdClass)
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseWrapper<ClassDTO>> updateClass(
            @PathVariable Integer id,
            @Valid @RequestBody ClassRequestDTO classRequestDTO) {
        ClassDTO updatedClass = classService.updateClass(id, classRequestDTO);
        return ResponseEntity.ok(ResponseWrapper.<ClassDTO>builder()
                .status(HttpStatus.OK)
                .data(updatedClass)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseWrapper<Void>> deleteClass(@PathVariable Integer id) {
        classService.deleteClass(id);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .message("Class deleted successfully")
                .build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResponseWrapper<ClassDTO>> updateClassStatus(@PathVariable Integer id, @RequestParam ClassStatus status) {
        ClassDTO updateClass = classService.updateStatus(id, status);
        return ResponseEntity.ok(ResponseWrapper.<ClassDTO>builder()
                .status(HttpStatus.OK)
                .data(updateClass)
                .build());
    }

    @PostMapping("/{classId}/enroll/bulk")
    public ResponseEntity<ResponseWrapper<Void>> bulkEnrollStudents(
            @PathVariable Integer classId,
            @RequestBody List<Integer> studentIds) {

        // Giả định ClassService có phương thức để xử lý việc ghi danh này
        classService.bulkEnrollStudents(classId, studentIds);

        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .message("Successfully enrolled " + studentIds.size() + " students into class " + classId)
                .build());
    }

    // Thêm endpoint mới cho teacher assignment
    @PostMapping("/{classId}/teachers")
    public ResponseEntity<ResponseWrapper<ClassSubjectAssignmentDTO>> addTeacherToClass(
            @PathVariable Integer classId,
            @Valid @RequestBody ClassSubjectAssignmentDTO assignmentDTO) {
        ClassSubjectAssignmentDTO result = classService.addTeacherToClass(classId, assignmentDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.<ClassSubjectAssignmentDTO>builder()
                        .status(HttpStatus.CREATED)
                        .data(result)
                        .message("Teacher added to class successfully")
                        .build());
    }

    @DeleteMapping("/{classId}/teachers/{courseId}")
    public ResponseEntity<ResponseWrapper<Void>> removeTeacherFromClass(
            @PathVariable Integer classId,
            @PathVariable Integer courseId) {
        classService.removeTeacherFromClass(classId, courseId);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .message("Teacher removed from class successfully")
                .build());
    }
}
