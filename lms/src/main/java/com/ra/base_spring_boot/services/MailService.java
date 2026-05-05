package com.ra.base_spring_boot.services;

public interface MailService {
    void sendSimpleMail(String to, String subject, String content);
    void sendHtmlMail(String to, String subject, String htmlContent);
    void sendMailWithAttachment(String to, String subject, String htmlContent, String filePath);
}
