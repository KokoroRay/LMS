package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.services.IEmailService;
import jakarta.mail.MessagingException; // ✅ Import MimeMessage
import jakarta.mail.internet.MimeMessage; // ✅ Import MimeMessage
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
// import org.springframework.mail.SimpleMailMessage; // Không cần dùng cái này nữa
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper; // ✅ Import MimeMessageHelper
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements IEmailService {

    private final JavaMailSender mailSender;

    // ✅ Lấy URL logo (giống email chứng chỉ)
    private static final String LOGO_URL_FOR_EMAIL = "https://res.cloudinary.com/dcfxql6y5/image/upload/v1763093682/rikkei_edu_logo_ivuqle.png";

    @Override
    public void sendResetPasswordEmail(String toEmail, String resetLink) {
        try {
            // ✅ Sử dụng MimeMessage để gửi HTML
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8"); // true = multipart/HTML

            helper.setTo(toEmail);

            // ✅ Sử dụng email có Avatar (giống email chứng chỉ)
            helper.setFrom("thuctaprikkei2025@gmail.com");

            helper.setSubject("Yêu cầu đặt lại mật khẩu");

            // ✅ Tạo nội dung HTML
            String htmlContent = String.format("""
                <html>
                <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
                    <div style='background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
                        <p style='text-align: center;'>
                            <img src='%s' alt='Rikkei Education Logo' style='max-width: 200px; margin-bottom: 20px;'>
                        </p>
                        <h2 style='color: #dd673c;'>Yêu cầu Đặt lại Mật khẩu</h2>
                        <p>Xin chào,</p>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                        <p>Vui lòng nhấn vào nút dưới đây để tạo mật khẩu mới:</p>
                        
                        <p style='margin-top: 25px; text-align: center;'>
                            <a href='%s' style='display: inline-block; padding: 12px 25px; background-color: #dd673c; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;'>
                                ĐẶT LẠI MẬT KHẨU
                            </a>
                        </p>
                        
                        <p style='margin-top: 20px; font-size: 0.9em; color: #888;'>
                        Liên kết này sẽ hết hạn sau 24 giờ. Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.
                        </p>
                        <p style='margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; font-size: 0.8em; color: #aaa;'>
                            Rikkei Education Team
                        </p>
                    </div>
                </body>
                </html>
                """, LOGO_URL_FOR_EMAIL, resetLink);

            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(message);

        } catch (MailException | MessagingException e) {
            System.err.println("Failed to send HTML email to " + toEmail + ": " + e.getMessage());
        }
    }
}