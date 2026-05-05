package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.Certificate;

public interface EmailNotificationService {

    void sendCertificateEmail(Certificate cert);

    void sendRevocationEmail(Certificate cert, String revocationReason);

    void sendAppealReceivedEmail(Certificate cert);

    void sendAppealResultEmail(Certificate cert, boolean isApproved, String adminFeedback);
}