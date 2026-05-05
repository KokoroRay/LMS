package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.CertificateDTO;
import com.ra.base_spring_boot.model.Certificate;
import com.ra.base_spring_boot.services.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/certificates")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
public class AdminCertificateController {

    private final CertificateService certificateService;

    @GetMapping
    public ResponseEntity<List<CertificateDTO>> getAllCertificates() {
        List<Certificate> certificates = certificateService.findAllCertificates();

        List<CertificateDTO> dtos = certificates.stream()
                .map(CertificateDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/revoke/{certificateId}")
    public ResponseEntity<CertificateDTO> revokeCertificate(
            @PathVariable Integer certificateId,
            @RequestBody Map<String, String> payload
    ) {
        String reason = payload.getOrDefault("reason", "Không có lý do cụ thể.");
        Certificate revokedCert = certificateService.revokeCertificate(certificateId, reason);
        return ResponseEntity.ok(new CertificateDTO(revokedCert));
    }

    @PostMapping("/process-appeal/{certificateId}")
    public ResponseEntity<CertificateDTO> processAppeal(
            @PathVariable Integer certificateId,
            @RequestBody Map<String, String> payload
    ) {
        String decision = payload.get("decision");
        String adminFeedback = payload.getOrDefault("adminFeedback", "Không có phản hồi.");

        if (decision == null || (!decision.equals("APPROVE") && !decision.equals("REJECT"))) {
            return ResponseEntity.badRequest().build();
        }

        Certificate processedCert = certificateService.processCertificateAppeal(
                certificateId,
                decision,
                adminFeedback
        );

        return ResponseEntity.ok(new CertificateDTO(processedCert));
    }
}
