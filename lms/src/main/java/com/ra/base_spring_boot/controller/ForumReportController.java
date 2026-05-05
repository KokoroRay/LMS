package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.req.CreateReportRequestDTO;
import com.ra.base_spring_boot.dto.req.UpdateReportRequestDTO;
import com.ra.base_spring_boot.dto.resp.ForumReportResponseDTO;
import com.ra.base_spring_boot.model.ForumReport;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.IForumReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@RestController
@RequestMapping("/forum/reports")
@RequiredArgsConstructor
public class ForumReportController {

    private final IForumReportService forumReportService;

    @PostMapping
    public ResponseEntity<ResponseWrapper<ForumReportResponseDTO>> createReport(
            @Valid @RequestBody CreateReportRequestDTO request,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(ResponseWrapper.<ForumReportResponseDTO>builder()
                        .status(HttpStatus.UNAUTHORIZED)
                        .code(HttpStatus.UNAUTHORIZED.value())
                        .message("Authentication required")
                        .build());
            }
            
            User user = userDetails.getUser();

            ForumReportResponseDTO response = forumReportService.createReport(request, user);
            return ResponseEntity.ok(ResponseWrapper.<ForumReportResponseDTO>builder()
                    .status(HttpStatus.OK)
                    .code(HttpStatus.OK.value())
                    .message("Create report successfully")
                    .data(response)
                    .build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(ResponseWrapper.<ForumReportResponseDTO>builder()
                    .status(HttpStatus.BAD_REQUEST)
                    .code(HttpStatus.BAD_REQUEST.value())
                    .message("Error creating report: " + e.getMessage())
                    .build());
        }
    }
    @GetMapping("/{reportId}")
    public ResponseEntity<ResponseWrapper<ForumReportResponseDTO>> getReport(@PathVariable Long reportId) {
        ForumReportResponseDTO response = forumReportService.getReport(reportId);
        return ResponseEntity.ok(ResponseWrapper.<ForumReportResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get report successfully")
                .data(response)
                .build());
    }

    @GetMapping
    public ResponseEntity<ResponseWrapper<Page<ForumReportResponseDTO>>> getAllReports(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "reportType", required = false) String reportType,
            @RequestParam(name = "reporterName", required = false) String reporterName,
            @PageableDefault(size = 20) Pageable pageable) {

        try {
            Page<ForumReportResponseDTO> response = forumReportService.getFilteredReports(
                    status, reportType, reporterName, pageable);

            return ResponseEntity.ok(ResponseWrapper.<Page<ForumReportResponseDTO>>builder()
                    .status(HttpStatus.OK)
                    .code(HttpStatus.OK.value())
                    .message("Get reports successfully")
                    .data(response)
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ResponseWrapper.<Page<ForumReportResponseDTO>>builder()
                            .status(HttpStatus.BAD_REQUEST)
                            .code(HttpStatus.BAD_REQUEST.value())
                            .message("Invalid filter value: " + e.getMessage())
                            .build()
            );
        }
    }

    @PutMapping("/{reportId}")
    public ResponseEntity<ResponseWrapper<ForumReportResponseDTO>> updateReport(
            @PathVariable Long reportId,
            @Valid @RequestBody UpdateReportRequestDTO request,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        ForumReportResponseDTO response = forumReportService.updateReportStatus(reportId, request, user);
        return ResponseEntity.ok(ResponseWrapper.<ForumReportResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Update report successfully")
                .data(response)
                .build());
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<ResponseWrapper<Void>> deleteReport(
            @PathVariable Long reportId,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        forumReportService.deleteReport(reportId, user);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Delete report successfully")
                .build());
    }

    @PutMapping("/{reportId}/resolve")
    public ResponseEntity<ResponseWrapper<Void>> resolveReport(
            @PathVariable Long reportId,
            @RequestBody Map<String, Boolean> requestBody,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        boolean deleteContent = requestBody.getOrDefault("deleteContent", false);
        forumReportService.resolveReport(reportId, userDetails.getUser(), deleteContent);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Report resolved successfully")
                .build());
    }

    @GetMapping("/statistics")
    public ResponseEntity<ResponseWrapper<Map<String, Long>>> getReportStatistics() {
        Map<String, Long> statistics = forumReportService.getReportStatistics();
        return ResponseEntity.ok(ResponseWrapper.<Map<String, Long>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get report statistics successfully")
                .data(statistics)
                .build());
    }
}
