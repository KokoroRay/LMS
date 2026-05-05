package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.req.GradeSubmissionRequestDTO;
import com.ra.base_spring_boot.dto.req.SubmissionRequestDTO;
import com.ra.base_spring_boot.dto.resp.SubmissionResponseDTO;
import com.ra.base_spring_boot.services.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<SubmissionResponseDTO> createSubmission(
            @RequestBody SubmissionRequestDTO requestDTO) {
        return ResponseEntity.ok(submissionService.createSubmission(requestDTO));
    }

    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<List<SubmissionResponseDTO>> getByAssignment(
            @PathVariable Integer assignmentId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByAssignment(assignmentId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<SubmissionResponseDTO>> getByStudent(
            @PathVariable Integer studentId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByStudent(studentId));
    }

    @GetMapping("/assignment/{assignmentId}/my-submission")
    public ResponseEntity<SubmissionResponseDTO> getMySubmission(
            @PathVariable Integer assignmentId,
            @RequestParam(required = false) Integer attemptNumber) {

        SubmissionResponseDTO dto = submissionService.getMySubmissionForAssignment(assignmentId, attemptNumber);
        if (dto == null) {
            return ResponseEntity.noContent().build(); // 204 khi chưa nộp
        }
        return ResponseEntity.ok(dto);
    }


    @PutMapping("/{submissionId}/grade")
    public SubmissionResponseDTO gradeSubmission(
            @PathVariable Integer submissionId,
            @RequestBody GradeSubmissionRequestDTO dto) {

        if (submissionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Submission ID is required");
        }

        return submissionService.gradeSubmission(submissionId, dto);
    }
}
