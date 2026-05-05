package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.PaymentRequestDTO;
import com.ra.base_spring_boot.dto.resp.CourseCategoryDTO;
import com.ra.base_spring_boot.dto.resp.PaymentResponseDTO;
import com.ra.base_spring_boot.dto.resp.UserDTO;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.*;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.CourseCategoryService;
import com.ra.base_spring_boot.services.MailService;
import com.ra.base_spring_boot.services.PaymentService;
import com.ra.base_spring_boot.services.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final CourseCategoryRepository categoryRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseCategoryService courseCategoryService;
    private final CourseGradeRepository courseGradeRepository;

    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final InvoiceRepository invoiceRepository;
    private final ReEnrollmentRepository reEnrollmentRepository;
    private final VnPayService vnPayService;
    private final MailService mailService;
    private final HttpServletRequest httpServletRequest;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;

    /* ===== PAYMENT BÌNH THƯỜNG ===== */

    @Transactional
    @Override
    public PaymentResponseDTO createPayment(PaymentRequestDTO request, Integer studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new HttpNotFound("User không tồn tại"));

        // Lấy category đã tính tổng giá từ service
        CourseCategoryDTO categoryDTO = courseCategoryService.getCategoryById(request.getCategoryId())
                .orElseThrow(() -> new HttpNotFound("Category không tồn tại"));

        BigDecimal amount = categoryDTO.getPrice(); // đây là tổng giá của tất cả course trong category

        String transactionRef = UUID.randomUUID().toString(); // sinh transaction ref

        Payment payment = Payment.builder()
                .student(student)
                .category(categoryRepository.getReferenceById(request.getCategoryId())) // entity để lưu DB
                .amount(amount)
                .status(PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod().name())
                .transactionRef(transactionRef)
                .build();
        paymentRepository.saveAndFlush(payment);

        String paymentUrl = null;
        if (request.getPaymentMethod() == PaymentMethod.VNPAY) {
            try {
                paymentUrl = vnPayService.createPaymentUrl(
                        transactionRef,
                        amount.intValue(),
                        httpServletRequest
                );
            } catch (Exception e) {
                System.err.println("Không thể tạo URL VNPay: " + e.getMessage());
            }
        }

        return PaymentResponseDTO.builder()
                .paymentId(payment.getPaymentId())
                .categoryId(categoryDTO.getCategoryId())
                .amount(amount)
                .classId(request.getClassId())
                .paymentMethod(request.getPaymentMethod())
                .status(payment.getStatus())
                .paymentUrl(paymentUrl)
                .student(UserDTO.builder()
                        .id(student.getId())
                        .firstName(student.getFirstName())
                        .lastName(student.getLastName())
                        .email(student.getEmail())
                        .phone(student.getPhone())
                        .build())
                .build();
    }

    @Transactional
    @Override
    public void handlePaymentCallback(String transactionRef, PaymentStatus status, Integer classId) {
        Payment payment = paymentRepository.findByTransactionRef(transactionRef)
                .orElseThrow(() -> new HttpNotFound("Payment không tồn tại với transactionRef: " + transactionRef));

        if (payment.getStatus() == PaymentStatus.SUCCESS) return; // Already processed

        payment.setStatus(status);
        paymentRepository.save(payment);

        if (status != PaymentStatus.SUCCESS) {
            // Nếu thanh toán FAIL cho payment thường thì dừng tại đây
            return;
        }

        // Nếu có classId thì enroll student vào class
        if (classId != null) {
            ClassEntity targetClass = classRepository.findById(classId).orElse(null);
            if (targetClass != null) {
                Enrollment enrollment = Enrollment.builder()
                        .student(payment.getStudent())
                        .classEntity(targetClass)
                        .progress(0.0)
                        .status(EnrollmentStatus.ACTIVE)
                        .build();
                enrollmentRepository.save(enrollment);
            }
        }

        Invoice invoice = Invoice.builder()
                .payment(payment)
                .invoiceCode("INV-" + System.currentTimeMillis())
                .build();
        invoiceRepository.save(invoice);

        String messageTemplate = "Bạn đã thanh toán thành công khóa học: %s."
                .formatted(payment.getCategory().getName());

        sendInvoiceMail(invoice, payment, messageTemplate);
    }

    /* ===== PAYMENT HỌC LẠI ===== */
    @Transactional
    @Override
    public PaymentResponseDTO createPaymentForRetake(Integer studentId, List<Integer> reEnrollmentIds, PaymentMethod method) {

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new HttpNotFound("Student không tồn tại"));

        if (reEnrollmentIds == null || reEnrollmentIds.isEmpty()) {
            throw new HttpBadRequest("Không có môn học lại nào được chọn");
        }

        // Lấy danh sách các lần học lại
        List<ReEnrollment> list = reEnrollmentRepository.findAllById(reEnrollmentIds);
        if (list.isEmpty()) {
            throw new HttpNotFound("Không tìm thấy dữ liệu học lại");
        }

        // Tính tổng tiền
        BigDecimal totalAmount = list.stream()
                .map(re -> re.getAmount() != null ? re.getAmount() : re.getFailedCourseGrade().getCourse().getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Lấy category của môn đầu tiên (giả sử cùng 1 category)
        CourseCategory category = list.get(0).getFailedCourseGrade().getCourse().getCategory();

        // Tạo 1 payment duy nhất
        String transactionRef = UUID.randomUUID().toString();
        Payment payment = Payment.builder()
                .student(student)
                .category(category)
                .amount(totalAmount)
                .paymentMethod(method.name())
                .status(PaymentStatus.PENDING)
                .transactionRef(transactionRef)
                .build();
        paymentRepository.saveAndFlush(payment);

        // Gán payment này cho tất cả ReEnrollment
        list.forEach(re -> {
            re.setPayment(payment);
            re.setStatus(ReEnrollmentStatus.PAYMENT_PENDING);
        });
        reEnrollmentRepository.saveAll(list);

        // Tạo URL thanh toán
        String paymentUrl = null;
        if (method == PaymentMethod.VNPAY) {
            try {
                paymentUrl = vnPayService.createPaymentUrl(
                        transactionRef,
                        totalAmount.intValue(),
                        httpServletRequest
                );
            } catch (Exception e) {
                System.err.println("Không thể tạo URL VNPay: " + e.getMessage());
            }
        }

        return PaymentResponseDTO.builder()
                .paymentId(payment.getPaymentId())
                .categoryId(category.getCategoryId())
                .amount(totalAmount)
                .status(payment.getStatus())
                .paymentUrl(paymentUrl)
                .student(UserDTO.builder()
                        .id(student.getId())
                        .firstName(student.getFirstName())
                        .lastName(student.getLastName())
                        .email(student.getEmail())
                        .phone(student.getPhone())
                        .build())
                .build();
    }

    @Transactional
    @Override
    public void handleRetakePaymentCallback(String transactionRef, PaymentStatus status) {

        Payment payment = paymentRepository.findByTransactionRef(transactionRef)
                .orElseThrow(() -> new HttpNotFound("Payment không tồn tại"));

        payment.setStatus(status);
        paymentRepository.save(payment);

        List<ReEnrollment> list = reEnrollmentRepository.findAllByPayment(payment);

        // ❌ Thanh toán FAIL → đánh dấu thất bại rồi thoát
        if (status != PaymentStatus.SUCCESS) {
            list.forEach(re -> re.setStatus(ReEnrollmentStatus.PAYMENT_FAILED));
            reEnrollmentRepository.saveAll(list);
            return;
        }

        // ✅ Thanh toán SUCCESS
        List<String> enrolledCoursesMessages = new ArrayList<>();
        List<String> waitingCoursesMessages = new ArrayList<>();

        for (ReEnrollment re : list) {
            CourseGrade oldGrade = re.getFailedCourseGrade();
            if (oldGrade == null) continue;

            Course course = oldGrade.getCourse();
            User student = oldGrade.getStudent();

            // KIỂM TRA XEM ADMIN ĐÃ GÁN LỚP HỌC LẠI CHƯA
            if (re.getNewClass() != null) {
                // TRƯỜNG HỢP 1: ĐÃ CÓ LỚP -> TIẾN HÀNH TẠO DỮ LIỆU HỌC LẠI
                ClassEntity retakeClass = re.getNewClass();

                // 1.1. Xác định attempt_number mới
                Integer newAttempt = oldGrade.getAttemptNumber() != null ? oldGrade.getAttemptNumber() + 1 : 2;

                // 1.2. Đóng tất cả LessonProgress cũ của course này
                List<LessonProgress> oldProgresses = lessonProgressRepository
                        .findById_UserIdAndLesson_Session_Course_CourseIdOrderByLesson_LessonIdAscId_AttemptNumberDesc(
                                student.getId(), course.getCourseId());
                oldProgresses.forEach(p -> p.setIsCompleted(true));
                lessonProgressRepository.saveAll(oldProgresses);

                // 1.3. Tạo CourseGrade mới cho lần học lại
                CourseGrade newGrade = CourseGrade.builder()
                        .student(student)
                        .classEntity(retakeClass)
                        .course(course)
                        .assignmentScore(0.0)
                        .quizScore(0.0)
                        .examScore(0.0)
                        .finalScore(0.0)
                        .status(GradeStatus.IN_PROGRESS)
                        .attemptNumber(newAttempt)
                        .gradedAt(null)
                        .policy(oldGrade.getPolicy())
                        .build();
                courseGradeRepository.save(newGrade);

                // 1.4. Tạo LessonProgress mới cho attempt học lại
                List<Lesson> lessonsInCourse = lessonRepository.findBySession_Course_CourseId(course.getCourseId());
                List<LessonProgress> newLessonProgresses = lessonsInCourse.stream()
                        .map(lesson -> LessonProgress.builder()
                                .id(LessonProgressId.builder()
                                        .userId(student.getId())
                                        .lessonId(lesson.getLessonId())
                                        .attemptNumber(newAttempt)
                                        .build())
                                .user(student)
                                .lesson(lesson)
                                .watchedSeconds(0)
                                .isCompleted(false)
                                .build())
                        .collect(Collectors.toList());
                lessonProgressRepository.saveAll(newLessonProgresses);

                // 1.5. Auto ENROLL sinh viên vào lớp RETAKE
                enrollmentRepository.findByClassEntityAndStudent(retakeClass, student)
                        .orElseGet(() -> {
                            Enrollment enrollment = Enrollment.builder()
                                    .student(student)
                                    .classEntity(retakeClass)
                                    .progress(0.0)
                                    .status(EnrollmentStatus.ACTIVE)
                                    .build();
                            return enrollmentRepository.save(enrollment);
                        });
                
                // 1.6. Cập nhật trạng thái ReEnrollment
                re.setStatus(ReEnrollmentStatus.ENROLLED);
                re.setEnrolledAt(LocalDateTime.now());
                re.setFailedCourseGrade(newGrade); // Gán CourseGrade mới vào ReEnrollment
                reEnrollmentRepository.save(re);

                enrolledCoursesMessages.add(String.format(
                        "- %s: Bạn đã được thêm vào lớp '%s'.",
                        course.getTitle(), retakeClass.getClassName()
                ));

            } else {
                // TRƯỜNG HỢP 2: CHƯA CÓ LỚP -> CHUYỂN TRẠNG THÁI CHỜ
                re.setStatus(ReEnrollmentStatus.PAYMENT_SUCCESS); // Đã trả tiền, chờ xếp lớp
                reEnrollmentRepository.save(re);

                waitingCoursesMessages.add(String.format(
                        "- %s: Thanh toán thành công. Vui lòng chờ quản trị viên xếp lớp.",
                        course.getTitle()
                ));
            }
        }

        // 8️⃣ Gửi mail thông báo tổng hợp
        StringBuilder mailContent = new StringBuilder();
        mailContent.append("Xin chào ").append(payment.getStudent().getFirstName()).append(",<br/><br/>");
        mailContent.append("Trạng thái thanh toán học lại của bạn đã được cập nhật:<br/><br/>");

        if (!enrolledCoursesMessages.isEmpty()) {
            mailContent.append("<b>Các môn đã được xếp lớp:</b><br/>");
            enrolledCoursesMessages.forEach(msg -> mailContent.append(msg).append("<br/>"));
            mailContent.append("<br/>");
        }

        if (!waitingCoursesMessages.isEmpty()) {
            mailContent.append("<b>Các môn đang chờ xếp lớp:</b><br/>");
            waitingCoursesMessages.forEach(msg -> mailContent.append(msg).append("<br/>"));
            mailContent.append("<br/>");
        }

        mailContent.append("Hãy truy cập hệ thống để kiểm tra thông tin chi tiết.<br/>");

        try {
            mailService.sendHtmlMail(
                    payment.getStudent().getEmail(),
                    "Cập nhật trạng thái đăng ký học lại",
                    mailContent.toString()
            );
        } catch (Exception e) {
            System.err.println("Lỗi gửi mail học lại: " + e.getMessage());
        }
    }

    /* ===== PRIVATE HELPERS ===== */

    private void sendInvoiceMail(Invoice invoice, Payment payment, String messageTemplate) {
        String amountStr = String.format("%.0f", payment.getAmount());
        String emailContent = """
            Xin chào %s,

            %s

            Tên khóa học: %s
Số tiền: %s VNĐ
            Mã hóa đơn: %s
            """.formatted(
                payment.getStudent().getFirstName(),
                messageTemplate,
                payment.getCategory().getName(),
                amountStr,
                invoice.getInvoiceCode()
        );

        try {
            if (invoice.getPdfUrl() != null) {
                mailService.sendMailWithAttachment(
                        payment.getStudent().getEmail(),
                        "Hóa đơn khóa học " + payment.getCategory().getName(),
                        emailContent,
                        invoice.getPdfUrl()
                );
            } else {
                mailService.sendHtmlMail(
                        payment.getStudent().getEmail(),
                        "Hóa đơn khóa học " + payment.getCategory().getName(),
                        emailContent
                );
            }
        } catch (Exception e) {
            System.err.println("Lỗi gửi mail: " + e.getMessage());
        }
    }

    @Override
    public Payment getPaymentById(Integer paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new HttpNotFound("Payment không tồn tại"));
    }

    @Override
    public List<Payment> getAllPaymentsForAdmin() {
        return paymentRepository.findAll();
    }

    @Override
    public List<Payment> getPaymentsForStudent(User student) {
        if (student == null || student.getId() == null) {
            throw new HttpNotFound("Student không tồn tại");
        }
        return paymentRepository.findByStudentId(student.getId());
    }
}
