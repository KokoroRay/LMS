package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.services.MailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

    private final JavaMailSender mailSender;

    // Gửi mail text cơ bản
    @Override
    public void sendSimpleMail(String to, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Lỗi gửi SimpleMail: " + e.getMessage());
        }
    }

    // Gửi mail HTML
    @Override
    public void sendHtmlMail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Lỗi gửi email HTML: " + e.getMessage());
        }
    }

    // Gửi mail có file đính kèm (PDF, ảnh,...)
    @Override
    public void sendMailWithAttachment(String to, String subject, String htmlContent, String filePath) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            if (filePath != null) {
                File fileObj = new File(filePath);
                if (fileObj.exists() && fileObj.isFile()) {
                    FileSystemResource file = new FileSystemResource(fileObj);
                    helper.addAttachment(file.getFilename(), file);
                } else {
                    System.err.println("File đính kèm không tồn tại: " + filePath);
                }
            }

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Lỗi gửi mail kèm tệp: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Lỗi gửi mail: " + e.getMessage());
        }
    }
}
