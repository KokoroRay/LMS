package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.model.Certificate;
import com.ra.base_spring_boot.model.constants.CertificateStatus; // Cần import
import com.ra.base_spring_boot.services.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class EmailNotificationServiceImpl implements EmailNotificationService {

    private final JavaMailSender mailSender;

    private static final String LOGO_URL_FOR_EMAIL = "https://res.cloudinary.com/dcfxql6y5/image/upload/v1763093682/rikkei_edu_logo_ivuqle.png";

    // ✅ PHƯƠNG THỨC 1: GỬI EMAIL THÔNG BÁO THU HỒI (REVOKED) - (Giữ nguyên)
    @Override
    public void sendRevocationEmail(Certificate cert, String revocationReason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String studentEmail = cert.getStudent().getEmail();
            String studentName = cert.getStudent().getFullName();
            String subject = "[THÔNG BÁO QUAN TRỌNG] Chứng Chỉ Đã Bị Thu Hồi (Revoked)";

            String emailContent = String.format("""
                <html>
                <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
                    <div style='background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
                        <p style='text-align: center;'>
                            <img src='%s' alt='Rikkei Education Logo' style='max-width: 200px; margin-bottom: 20px;'>
                        </p>
                        <h2 style='color: #dc2626;'>Thông báo Thu hồi Chứng chỉ</h2>
                        <p>Xin chào %s,</p>
                        <p>Chúng tôi xin thông báo chứng chỉ của bạn cho khóa học <strong>%s</strong> đã bị thu hồi (Revoked).</p>
                        
                        <p style='color: #dc2626; font-weight: bold;'>Mã chứng chỉ: %s</p>
                        <p><strong>Lý do thu hồi:</strong> %s</p>
                        
                        <p style='margin-top: 20px;'>
                        Chứng chỉ này không còn hiệu lực. Mọi liên kết xác minh liên quan đến mã chứng chỉ này đã bị vô hiệu hóa.
                        </p>
                        
                        <p style='margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; font-size: 0.8em; color: #aaa;'>
                            Rikkei Education Team
                        </p>
                    </div>
                </body>
                </html>
                """, LOGO_URL_FOR_EMAIL, studentName, cert.getCategory().getName(), cert.getCertificateCode(), revocationReason);

            helper.setTo(studentEmail);
            helper.setSubject(subject);
            helper.setText(emailContent, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("Lỗi khi gửi email thu hồi chứng chỉ: " + e.getMessage());
        }
    }

    // ✅ PHƯƠNG THỨC 2: GỬI EMAIL KHIẾU NẠI ĐÃ ĐƯỢC TIẾP NHẬN
    public void sendAppealReceivedEmail(Certificate cert) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String studentEmail = cert.getStudent().getEmail();
            String studentName = cert.getStudent().getFullName();
            String subject = "[TIẾP NHẬN] Khiếu Nại Chứng Chỉ Đã Được Ghi Nhận";

            String emailContent = String.format("""
                <html>
                <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
                    <div style='background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
                        <p style='text-align: center;'>
                            <img src='%s' alt='Rikkei Education Logo' style='max-width: 200px; margin-bottom: 20px;'>
                        </p>
                        <h2 style='color: #2563eb;'>Khiếu Nại Đã Được Tiếp Nhận</h2>
                        <p>Xin chào %s,</p>
                        <p>Chúng tôi đã nhận được khiếu nại của bạn về quyết định thu hồi chứng chỉ cho khóa học <strong>%s</strong>.</p>
                        
                        <p style='font-weight: bold;'>Mã chứng chỉ: %s</p>
                        <p>Hiện tại, yêu cầu của bạn đang ở trạng thái **Đang xem xét**. Chúng tôi sẽ phản hồi lại bạn trong thời gian sớm nhất sau khi hoàn tất việc kiểm tra minh chứng và dữ liệu.</p>
                        
                        <p style='margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; font-size: 0.8em; color: #aaa;'>
                            Rikkei Education Team
                        </p>
                    </div>
                </body>
                </html>
                """, LOGO_URL_FOR_EMAIL, studentName, cert.getCategory().getName(), cert.getCertificateCode());

            helper.setTo(studentEmail);
            helper.setSubject(subject);
            helper.setText(emailContent, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("Lỗi khi gửi email tiếp nhận khiếu nại: " + e.getMessage());
        }
    }

    // ✅ PHƯƠNG THỨC 3: GỬI EMAIL THÔNG BÁO KẾT QUẢ XEM XÉT (FINAL DECISION)
    // (Admin sẽ gọi hàm này sau khi quyết định chấp nhận hoặc từ chối khiếu nại)
    public void sendAppealResultEmail(Certificate cert, boolean isApproved, String adminFeedback) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String studentEmail = cert.getStudent().getEmail();
            String studentName = cert.getStudent().getFullName();
            String subject = "[QUYẾT ĐỊNH] Kết Quả Xem Xét Khiếu Nại Chứng Chỉ";

            String statusColor = isApproved ? "#10b981" : "#dc2626"; // Xanh lá nếu PASS, Đỏ nếu FAIL
            String statusText = isApproved ? "CHẤP NHẬN" : "TỪ CHỐI";

            String decisionMessage = isApproved
                    ? "<p style='color: #10b981; font-weight: bold;'>Chúc mừng! Chứng chỉ của bạn đã được khôi phục và có hiệu lực.</p>"
                    : "<p style='color: #dc2626; font-weight: bold;'>Rất tiếc. Quyết định thu hồi ban đầu được giữ nguyên.</p>";

            String emailContent = String.format("""
                <html>
                <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
                    <div style='background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
                        <p style='text-align: center;'>
                            <img src='%s' alt='Rikkei Education Logo' style='max-width: 200px; margin-bottom: 20px;'>
                        </p>
                        <h2 style='color: %s;'>KẾT QUẢ KHIẾU NẠI: %s</h2>
                        <p>Xin chào %s,</p>
                        <p>Chúng tôi đã hoàn tất việc xem xét khiếu nại cho chứng chỉ khóa học <strong>%s</strong> (Mã: %s).</p>
                        
                        %s
                        
                        <p style='margin-top: 15px;'><strong>Phản hồi của Ban quản trị:</strong> %s</p>
                        
                        <p style='margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; font-size: 0.8em; color: #aaa;'>
                            Rikkei Education Team
                        </p>
                    </div>
                </body>
                </html>
                """, LOGO_URL_FOR_EMAIL, statusColor, statusText, studentName, cert.getCategory().getName(), cert.getCertificateCode(), decisionMessage, adminFeedback);

            helper.setTo(studentEmail);
            helper.setSubject(subject);
            helper.setText(emailContent, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("Lỗi khi gửi email kết quả khiếu nại: " + e.getMessage());
        }
    }


    // ✅ PHƯƠNG THỨC 4: GỬI EMAIL CẤP CHỨNG CHỈ (Giữ nguyên)
    @Override
    public void sendCertificateEmail(Certificate cert) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String studentEmail = cert.getStudent().getEmail();
            String studentName = cert.getStudent().getFullName();
            String subject = "[CHÚC MỪNG] Chứng Chỉ Hoàn Thành Khóa Học Của Bạn Đã Sẵn Sàng!";

            String emailContent = String.format("""
                <html>
                <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
                    <div style='background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
                        <p style='text-align: center;'>
                            <img src='%s' alt='Rikkei Education Logo' style='max-width: 200px; margin-bottom: 20px;'>
                        </p>
                        <h2 style='color: #dd673c;'>Xin chúc mừng %s!</h2>
                        <p>Chúng tôi rất vinh dự thông báo bạn đã Hoàn thành xuất sắc khóa học <strong>%s</strong>.</p>
                        <p>Chứng chỉ chính thức của bạn (Mã: <strong>%s</strong>) đã được cấp và sẵn sàng để tải xuống.</p>

                        <p style='margin-top: 25px; text-align: center;'>
                            <a href='%s' style='display: inline-block; padding: 12px 25px; background-color: #dd673c; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;'>
                                TẢI CHỨNG CHỈ CỦA BẠN
                            </a>
                        </p>
          
                        <p style='margin-top: 20px; font-size: 0.9em; color: #888;'>
                        Vui lòng lưu chứng chỉ này cho hồ sơ cá nhân của bạn.
                        </p>
                        <p style='margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; font-size: 0.8em; color: #aaa;'>
                            Rikkei Education Team
                        </p>
                    </div>
                </body>
                </html>
                """, LOGO_URL_FOR_EMAIL, studentName, cert.getCategory().getName(), cert.getCertificateCode(), cert.getCertificateUrl());

            helper.setTo(studentEmail);
            helper.setSubject(subject);
            helper.setText(emailContent, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("Lỗi khi gửi email chứng chỉ: " + e.getMessage());
            throw new RuntimeException("Không thể gửi email chứng chỉ.", e);
        }
    }
}