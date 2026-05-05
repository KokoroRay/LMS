package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.CreateReportRequestDTO;
import com.ra.base_spring_boot.dto.req.UpdateReportRequestDTO;
import com.ra.base_spring_boot.dto.resp.ForumReportResponseDTO;
import com.ra.base_spring_boot.model.ForumReport;
import com.ra.base_spring_boot.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface IForumReportService {
    ForumReportResponseDTO createReport(CreateReportRequestDTO reportRequestDTO, User reporter);
    ForumReportResponseDTO getReport(Long reportId);
    Page<ForumReportResponseDTO> getAllReports(Pageable pageable);
    Page<ForumReportResponseDTO> getReportsByStatus(ForumReport.ReportStatus status, Pageable pageable);
    Page<ForumReportResponseDTO> getFilteredReports(String status, String reportType, String reporterName, Pageable pageable);
    ForumReportResponseDTO updateReportStatus(Long reportId, UpdateReportRequestDTO reportRequestDTO, User resolver);
    void deleteReport(Long reportId, User user);
    Map<String, Long> getReportStatistics();
    void resolveReport(Long reportId, User adminUser, boolean deleteContent);
}
