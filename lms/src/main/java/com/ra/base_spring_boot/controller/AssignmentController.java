package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.req.AssignmentRequestDTO;
import com.ra.base_spring_boot.dto.resp.AssignmentDTO;
import com.ra.base_spring_boot.services.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<AssignmentDTO>> getAssignmentsBySession(@PathVariable Integer sessionId){
        return ResponseEntity.ok(assignmentService.getAssignmentsBySession(sessionId));
    }

    @GetMapping("/{assignmentId}")
    public ResponseEntity<AssignmentDTO> getAssignment(@PathVariable Integer assignmentId){
        return ResponseEntity.ok(assignmentService.getAssignmentById(assignmentId));
    }

    @PostMapping
    public ResponseEntity<AssignmentDTO> createAssignment(@RequestBody AssignmentRequestDTO dto){
        return ResponseEntity.ok(assignmentService.createAssignment(dto));
    }

    @PutMapping("/{assignmentId}")
    public ResponseEntity<AssignmentDTO> updateAssignment(@PathVariable Integer assignmentId,
                                                          @RequestBody AssignmentRequestDTO dto){
        return ResponseEntity.ok(assignmentService.updateAssignment(assignmentId, dto));
    }

    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Integer assignmentId){
        assignmentService.deleteAssignment(assignmentId);
        return ResponseEntity.noContent().build();
    }
}
