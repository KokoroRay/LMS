package com.ra.base_spring_boot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.req.StudentRequestDTO;
import com.ra.base_spring_boot.dto.resp.StudentResponseDTO;
import com.ra.base_spring_boot.services.IStudentService;
import com.ra.base_spring_boot.services.CloudinaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/students")
public class StudentController {

    private final IStudentService studentService;
    private final CloudinaryService cloudinaryService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ---------------------- List students ----------------------
    // ...
    @GetMapping
    public ResponseEntity<ResponseWrapper<Page<StudentResponseDTO>>> listStudent(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "false") Boolean excludeStudentsInOtherActiveClasses) {

        Sort.Direction direction = Sort.Direction.fromOptionalString(sortDir)
                .orElse(Sort.Direction.ASC);

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<StudentResponseDTO> students = studentService.findAll(pageable, keyword, excludeStudentsInOtherActiveClasses);

        return ResponseEntity.ok(ResponseWrapper.<Page<StudentResponseDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get all students successfully")
                .data(students)
                .build());
    }

    // ---------------------- Create student (with image) ----------------------
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ResponseWrapper<StudentResponseDTO>> createStudent(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "avatar", required = false) MultipartFile file
    ) {
        try {
            StudentRequestDTO studentRequestDTO = objectMapper.readValue(dataJson, StudentRequestDTO.class);

            // Upload avatar to Cloudinary if present
            if (file != null && !file.isEmpty()) {
                String imageUrl = cloudinaryService.uploadImage(file);
                studentRequestDTO.setAvatarUrl(imageUrl);
            }

            StudentResponseDTO studentResponseDTO = studentService.create(studentRequestDTO);

            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseWrapper.<StudentResponseDTO>builder()
                    .status(HttpStatus.CREATED)
                    .code(HttpStatus.CREATED.value())
                    .message("Create student successfully")
                    .data(studentResponseDTO)
                    .build()
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.<StudentResponseDTO>builder()
                    .status(HttpStatus.BAD_REQUEST)
                    .code(HttpStatus.BAD_REQUEST.value())
                    .message("Create student failed: " + e.getMessage())
                    .build());
        }
    }

    // ---------------------- Import students from Excel ----------------------
    @PostMapping("/import")
    public ResponseEntity<ResponseWrapper<Void>> importStudents(@RequestParam("file") MultipartFile file) {
        try {
            studentService.importFromExcel(file);
            return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                    .status(HttpStatus.OK)
                    .code(HttpStatus.OK.value())
                    .message("Student import successfully").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.<Void>builder()
                    .status(HttpStatus.BAD_REQUEST)
                    .code(HttpStatus.BAD_REQUEST.value())
                    .message("Student import failed: " + e.getMessage() + ". Please check file format and try again.")
                    .build());
        }
    }

    // ---------------------- Check studentCode exists ----------------------
    @GetMapping("/student-code/exists")
    public ResponseEntity<ResponseWrapper<Boolean>> checkStudentCodeExists(@RequestParam String studentCode) {
        boolean exists = studentService.existsByStudentCode(studentCode);
        return ResponseEntity.ok(ResponseWrapper.<Boolean>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Check student code exists successfully")
                .data(exists)
                .build());
    }

    // ---------------------- Check email exists ----------------------
    @GetMapping("/email/exists")
    public ResponseEntity<ResponseWrapper<Boolean>> checkEmailExists(@RequestParam String email) {
        boolean exists = studentService.existsByEmail(email);
        return ResponseEntity.ok(ResponseWrapper.<Boolean>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Check email exists successfully")
                .data(exists)
                .build());
    }

    // ---------------------- Get student by ID ----------------------
    @GetMapping("/{id}")
    public ResponseEntity<ResponseWrapper<StudentResponseDTO>> getStudentById(@PathVariable Long id) {
        StudentResponseDTO studentResponseDTO = studentService.findById(id.intValue());
        return ResponseEntity.ok(ResponseWrapper.<StudentResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get student successfully")
                .data(studentResponseDTO)
                .build());
    }

    // ---------------------- Update student (with image) ----------------------
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<ResponseWrapper<StudentResponseDTO>> updateStudent(
            @PathVariable Long id,
            @RequestPart("data") String dataJson,
            @RequestPart(value = "avatar", required = false) MultipartFile file
    ) {
        try {
            StudentRequestDTO studentRequestDTO = objectMapper.readValue(dataJson, StudentRequestDTO.class);

            // Upload avatar to Cloudinary if new file provided
            if (file != null && !file.isEmpty()) {
                String imageUrl = cloudinaryService.uploadImage(file);
                studentRequestDTO.setAvatarUrl(imageUrl);
            }

            StudentResponseDTO updatedStudent = studentService.update(id.intValue(), studentRequestDTO);

            return ResponseEntity.ok(ResponseWrapper.<StudentResponseDTO>builder()
                    .status(HttpStatus.OK)
                    .code(HttpStatus.OK.value())
                    .message("Update student successfully")
                    .data(updatedStudent)
                    .build()
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.<StudentResponseDTO>builder()
                    .status(HttpStatus.BAD_REQUEST)
                    .code(HttpStatus.BAD_REQUEST.value())
                    .message("Update student failed: " + e.getMessage())
                    .build());
        }
    }

    // ---------------------- Delete student ----------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseWrapper<Void>> deleteStudent(@PathVariable("id") Long id) {
        studentService.delete(id.intValue()); // hard delete
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Delete student successfully")
                .build());
    }


}
