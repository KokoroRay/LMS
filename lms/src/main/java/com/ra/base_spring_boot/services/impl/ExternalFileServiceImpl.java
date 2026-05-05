package com.ra.base_spring_boot.services.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfContentByte;
import com.itextpdf.text.pdf.PdfWriter;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.services.ExternalFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExternalFileServiceImpl implements ExternalFileService {

    private final Cloudinary cloudinary;

    private static final String VIETNAMESE_FONT = "fonts/times.ttf";
    private static final String BOLD_VIETNAMESE_FONT = "fonts/timesbd.ttf";
    private static final String TEMPLATE_PATH = "images/certificate_template.png";

    @Override
    public String uploadFile(MultipartFile file, String folderName) {
        if (file.isEmpty()) {
            throw new RuntimeException("File upload không được trống.");
        }
        try {
            Map uploadOptions = ObjectUtils.asMap(
                    "resource_type", "auto",
                    "folder", folderName,
                    "access_mode", "public"
            );

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadOptions);

            return uploadResult.get("secure_url").toString();

        } catch (IOException e) {
            e.printStackTrace();
            throw new RuntimeException("Upload file lên Cloudinary thất bại: " + e.getMessage(), e);
        }
    }

    @Override
    public String generateAndUploadCertificate(Certificate cert, User student, ClassEntity classEntity, CourseCategory category) {
        File tempPdfFile = null;
        try {

            String studentName = student.getFullName();
            String courseName = category.getName();
            String issueDate = cert.getIssueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            String certificateCode = cert.getCertificateCode();

            Document document = new Document(PageSize.A4.rotate(), 0, 0, 0, 0);
            tempPdfFile = File.createTempFile("cert_", ".pdf");
            PdfWriter writer = PdfWriter.getInstance(document, new FileOutputStream(tempPdfFile));
            document.open();

            PdfContentByte cb = writer.getDirectContent();

            Image templateImage = Image.getInstance(new ClassPathResource(TEMPLATE_PATH).getURL());
            templateImage.scaleToFit(document.getPageSize().getWidth(), document.getPageSize().getHeight());
            templateImage.setAbsolutePosition(0, 0);
            document.add(templateImage);

            BaseFont bfNormal = BaseFont.createFont(
                    new ClassPathResource(VIETNAMESE_FONT).getURL().toString(),
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED
            );

            BaseFont bfBold;
            try {
                bfBold = BaseFont.createFont(
                        new ClassPathResource(BOLD_VIETNAMESE_FONT).getURL().toString(),
                        BaseFont.IDENTITY_H,
                        BaseFont.EMBEDDED
                );
            } catch (IOException e) {
                bfBold = bfNormal;
            }

            float pageWidth = document.getPageSize().getWidth();
            float centerX = pageWidth / 2f;

            int ribbonWidth = 520;
            int ribbonHeight = 60;
            int ribbonY = 455;

            int leftX = (int)(centerX - ribbonWidth / 2);
            int rightX = (int)(centerX + ribbonWidth / 2);

            BaseColor ribbonColor = new BaseColor(35, 79, 142); // #234F8E

            cb.setColorFill(ribbonColor);
            cb.setColorStroke(ribbonColor);

            cb.moveTo(leftX, ribbonY);
            cb.lineTo(rightX, ribbonY);
            cb.lineTo(rightX + 30, ribbonY + ribbonHeight / 2);
            cb.lineTo(rightX, ribbonY + ribbonHeight);
            cb.lineTo(leftX, ribbonY + ribbonHeight);
            cb.lineTo(leftX - 30, ribbonY + ribbonHeight / 2);
            cb.closePathFillStroke();

            cb.beginText();
            cb.setFontAndSize(bfBold, 32);
            cb.setColorFill(BaseColor.WHITE);
            cb.showTextAligned(Element.ALIGN_CENTER, "CHỨNG CHỈ", centerX, ribbonY + 18, 0);
            cb.endText();

            cb.beginText();
            cb.setFontAndSize(bfBold, 24);
            cb.setColorFill(BaseColor.BLACK);
            cb.showTextAligned(Element.ALIGN_CENTER, "HOÀN THÀNH KHÓA HỌC", centerX, 400, 0);
            cb.endText();

            cb.beginText();
            cb.setFontAndSize(bfNormal, 16);
            cb.setColorFill(new BaseColor(70, 70, 70));
            cb.showTextAligned(Element.ALIGN_CENTER, "Xin chúc mừng học viên", centerX, 360, 0);
            cb.endText();

            cb.beginText();
            cb.setFontAndSize(bfBold, 42);
            cb.setColorFill(BaseColor.BLACK);
            cb.showTextAligned(Element.ALIGN_CENTER, studentName.toUpperCase(), centerX, 315, 0);
            cb.endText();

            cb.setLineWidth(1.5f);
            cb.setColorStroke(new BaseColor(74, 111, 165)); // #4A6FA5
            cb.moveTo(centerX - 250, 292);
            cb.lineTo(centerX + 250, 292);
            cb.stroke();

            cb.beginText();
            cb.setFontAndSize(bfNormal, 17);
            cb.setColorFill(new BaseColor(60, 60, 60));
            cb.showTextAligned(Element.ALIGN_CENTER,
                    "Đã hoàn thành xuất sắc chương trình đào tạo",
                    centerX, 270, 0);
            cb.endText();

            cb.beginText();
            cb.setFontAndSize(bfBold, 30);
            cb.setColorFill(new BaseColor(35, 79, 142)); // xanh đậm
            cb.showTextAligned(Element.ALIGN_CENTER, courseName.toUpperCase(), centerX, 230, 0);
            cb.endText();

            cb.beginText();
            cb.setFontAndSize(bfNormal, 12);
            cb.setColorFill(new BaseColor(60, 60, 60));
            cb.showTextAligned(Element.ALIGN_LEFT,
                    "Mã chứng chỉ: " + certificateCode,
                    100, 80, 0);
            cb.endText();


            cb.beginText();
            cb.setFontAndSize(bfNormal, 12);
            cb.setColorFill(new BaseColor(60, 60, 60));
            cb.showTextAligned(Element.ALIGN_RIGHT,
                    "Ngày cấp: " + issueDate,
                    pageWidth - 100, 80, 0);
            cb.endText();


            document.close();


            Map uploadResult = cloudinary.uploader().upload(
                    tempPdfFile,
                    ObjectUtils.asMap(
                            "folder", "certificates",
                            "resource_type", "raw",
                            "access_mode", "public"
                    )
            );

            return (String) uploadResult.get("secure_url");

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (tempPdfFile != null) tempPdfFile.delete();
        }
    }
}