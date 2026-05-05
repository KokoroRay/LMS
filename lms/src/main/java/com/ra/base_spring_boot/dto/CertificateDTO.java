package com.ra.base_spring_boot.dto;

import com.ra.base_spring_boot.model.Certificate;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificateDTO {

    private Integer certificateId;
    private String studentName;
    private String className;
    private String categoryName;
    private String certificateCode;
    private String certificateUrl;
    private String status;
    private String issueDate;

    private String revocationReason;
    private String appealReason;
    private String appealProofUrl;


    public CertificateDTO(Certificate cert) {
        this.certificateId = cert.getCertificateId();
        this.certificateCode = cert.getCertificateCode();
        this.certificateUrl = cert.getCertificateUrl();
        this.status = cert.getStatus() != null ? cert.getStatus().name() : null;
        this.issueDate = cert.getIssueDate() != null ? cert.getIssueDate().toString() : null;

        this.studentName = cert.getStudent() != null ? cert.getStudent().getFullName() : null;
        this.className = cert.getClassEntity() != null ? cert.getClassEntity().getClassName() : null;
        this.categoryName = cert.getCategory() != null ? cert.getCategory().getName() : null;

        this.revocationReason = cert.getRevocationReason();
        this.appealReason = cert.getAppealReason();
        this.appealProofUrl = cert.getAppealProofUrl();
    }
}