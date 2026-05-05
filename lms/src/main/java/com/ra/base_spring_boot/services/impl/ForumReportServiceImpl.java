package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.CreateReportRequestDTO;
import com.ra.base_spring_boot.dto.req.UpdateReportRequestDTO;
import com.ra.base_spring_boot.dto.resp.ForumReportResponseDTO;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.exception.HttpConflict;
import com.ra.base_spring_boot.exception.HttpForbiden;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.mapper.ForumReportMapper;
import com.ra.base_spring_boot.model.ForumPost;
import com.ra.base_spring_boot.model.ForumReport;
import com.ra.base_spring_boot.model.ForumTopic;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.repository.ForumPostRepository;
import com.ra.base_spring_boot.repository.ForumReportRepository;
import com.ra.base_spring_boot.repository.ForumTopicRepository;
import com.ra.base_spring_boot.services.IForumReportService;
import com.ra.base_spring_boot.services.IForumService;
import org.springframework.data.domain.PageImpl;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForumReportServiceImpl implements IForumReportService {

    private final ForumReportRepository forumReportRepository;
    private final ForumTopicRepository forumTopicRepository;
    private final ForumPostRepository forumPostRepository;
    private final ForumReportMapper forumReportMapper;
    private final IForumService forumService;

    @Override
    @Transactional
    public ForumReportResponseDTO createReport(CreateReportRequestDTO reportRequestDTO, User reporter) {
        boolean hasPostId = reportRequestDTO.getPostId() != null && reportRequestDTO.getPostId() > 0;
        boolean hasTopicId = reportRequestDTO.getTopicId() != null && reportRequestDTO.getTopicId() > 0;

        if (!hasPostId && !hasTopicId) {
            throw new HttpBadRequest("Either postId or topicId must be provided");
        }

        if (hasPostId) {
            if (forumReportRepository.existsByPost_PostIdAndReporter_id(reportRequestDTO.getPostId(), reporter.getId())) {
                throw new HttpConflict("You have already reported this post");
            }
        } else {
            if (forumReportRepository.existsByTopic_TopicIdAndReporter_id(reportRequestDTO.getTopicId(), reporter.getId())) {
                throw new HttpConflict("You have already reported this topic");
            }
        }
        ForumReport report = forumReportMapper.toEntity(reportRequestDTO);
        report.setReporter(reporter);
        if (hasPostId) {
            ForumPost post = forumPostRepository.findById(reportRequestDTO.getPostId())
                    .orElseThrow(() -> new HttpNotFound("Post not found with id: " + reportRequestDTO.getPostId()));
            report.setPost(post);
        } else {
            ForumTopic topic = forumTopicRepository.findById(reportRequestDTO.getTopicId())
                    .orElseThrow(() -> new HttpNotFound("Topic not found with id: " + reportRequestDTO.getTopicId()));
            report.setTopic(topic);
        }

        ForumReport savedReport = forumReportRepository.save(report);
        log.info("Created report: {} by user: {}", savedReport.getReportId(), reporter.getId());

        return forumReportMapper.toResponse(savedReport);

    }

    @Override
    @Transactional(readOnly = true)
    public ForumReportResponseDTO  getReport(Long reportId) {
        ForumReport report = forumReportRepository.findById(reportId)
                .orElseThrow(() -> new HttpNotFound("Report not found with id: " + reportId));
        log.info("Retrieved report: {}", report.getReportId());
        return forumReportMapper.toResponse(report);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ForumReportResponseDTO> getAllReports(Pageable pageable) {
        Page<Long> idPage = forumReportRepository.findReportIds(pageable);
        List<Long> ids = idPage.getContent();

        if (ids.isEmpty()) {
            return Page.empty(pageable);
        }

        List<ForumReport> reports = forumReportRepository.findAllWithDetailsByIds(ids);

        List<ForumReportResponseDTO> dtoList = reports.stream()
                .map(forumReportMapper::toResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, idPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ForumReportResponseDTO> getReportsByStatus(ForumReport.ReportStatus status, Pageable pageable) {
        Page<ForumReport> reports = forumReportRepository.findByStatus(status, pageable);
        return reports.map(forumReportMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ForumReportResponseDTO> getFilteredReports(String status, String reportType, String reporterName, Pageable pageable) {
        ForumReport.ReportStatus reportStatus = null;
        ForumReport.ReportType type = null;

        if (status != null && !status.equalsIgnoreCase("ALL")) {
            reportStatus = ForumReport.ReportStatus.valueOf(status.toUpperCase());
        }

        if (reportType != null && !reportType.equalsIgnoreCase("ALL")) {
            type = ForumReport.ReportType.valueOf(reportType.toUpperCase());
        }

        Page<ForumReport> reports = forumReportRepository.findByFilters(reportStatus, type, reporterName, pageable);
        return reports.map(forumReportMapper::toResponse);
    }

    @Override
    @Transactional
    public ForumReportResponseDTO updateReportStatus(Long reportId, UpdateReportRequestDTO reportRequestDTO, User resolver) {
        ForumReport report = forumReportRepository.findById(reportId)
                .orElseThrow(() -> new HttpNotFound("Report not found with id: " + reportId));
        if(!hasModerationPermission(resolver)) {
            throw new HttpForbiden("Not authorized to update reports");
        }

        ForumReport.ReportStatus oldStatus = report.getStatus();
        report.setStatus(reportRequestDTO.getStatus());
        report.setResolutionNote(reportRequestDTO.getResolutionNote());

        if(report.getStatus() == ForumReport.ReportStatus.RESOLVED || report.getStatus() == ForumReport.ReportStatus.DISMISSED) {
            report.setResolvedBy(resolver);
            report.setResolvedAt(LocalDateTime.now());
        }

        ForumReport updatedReport = forumReportRepository.save(report);
        log.info("Updated report: {} from {} to {} by moderator: {}", reportId, oldStatus, report.getStatus(), resolver.getId());
        return forumReportMapper.toResponse(updatedReport);
    }

    @Override
    @Transactional
    public void deleteReport(Long reportId, User user) {
        ForumReport report = forumReportRepository.findById(reportId)
                .orElseThrow(() -> new HttpNotFound("Report not found with id: " + reportId));
        if(!report.getReporter().getId().equals(user.getId()) && !hasModerationPermission(user)) {
            throw new HttpForbiden("Not authorized to delete reports");
        }
        forumReportRepository.delete(report);
        log.info("Deleted report: {} by user: {}", reportId, user.getId());
    }

    @Override
    @Transactional
    public Map<String, Long> getReportStatistics() {
        Map<String, Long> status = new HashMap<>();
        for (ForumReport.ReportStatus reportStatus : ForumReport.ReportStatus.values()) {
            status.put(reportStatus.name(), forumReportRepository.countByStatus(reportStatus));
        }
        return status;
    }

    @Override
    @Transactional
    public void resolveReport(Long reportId, User adminUser, boolean deleteContent) {
        forumService.resolveReport(reportId, adminUser, deleteContent);
    }

    private boolean hasModerationPermission(User user) {
        return user.getRole().getRoleName() == RoleName.ROLE_ADMIN ||
                user.getRole().getRoleName() == RoleName.ROLE_MODERATOR;
    }
}