package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.GradeSubmissionRequestDTO;
import com.ra.base_spring_boot.dto.req.SubmissionRequestDTO;
import com.ra.base_spring_boot.dto.resp.SubmissionResponseDTO;

import java.util.List;

public interface SubmissionService {
    SubmissionResponseDTO createSubmission(SubmissionRequestDTO dto);
    List<SubmissionResponseDTO> getSubmissionsByAssignment(Integer assignmentId);
    List<SubmissionResponseDTO> getSubmissionsByStudent(Integer studentId);
    SubmissionResponseDTO gradeSubmission(Integer submissionId, GradeSubmissionRequestDTO dto);
    SubmissionResponseDTO getMySubmissionForAssignment(Integer assignmentId, Integer attemptNumber);
    SubmissionResponseDTO getLatestSubmissionForAssignment(Integer assignmentId);
    SubmissionResponseDTO getLatestSubmissionForAssignmentAndClass(Integer assignmentId, Integer studentId, Integer classId);
}
