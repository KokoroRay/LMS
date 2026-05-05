package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.AssignmentRequestDTO;
import com.ra.base_spring_boot.dto.resp.AssignmentDTO;

import java.util.List;

public interface AssignmentService {

    List<AssignmentDTO> getAssignmentsBySession(Integer sessionId);

    AssignmentDTO createAssignment(AssignmentRequestDTO dto);

    AssignmentDTO updateAssignment(Integer assignmentId, AssignmentRequestDTO dto);

    void deleteAssignment(Integer assignmentId);

    AssignmentDTO getAssignmentById(Integer assignmentId);
}