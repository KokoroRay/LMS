package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.req.PaymentRequestDTO;
import com.ra.base_spring_boot.dto.req.ReEnrollPaymentRequestDTO;
import com.ra.base_spring_boot.dto.resp.PaymentResponseDTO;
import com.ra.base_spring_boot.model.Payment;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.PaymentStatus;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.PaymentService;
import com.ra.base_spring_boot.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final PaymentService paymentService;
    private final UserRepository userRepository;

    /** ===================== PAYMENT BÌNH THƯỜNG ======================- */
    @PostMapping("/create")
    public ResponseEntity<?> createPayment(
            @Valid @RequestBody PaymentRequestDTO request,
            @AuthenticationPrincipal MyUserDetails userDetails) {

        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Chưa đăng nhập, vui lòng đăng nhập để thực hiện thanh toán"
            ));
        }

        Integer studentId = userDetails.getUser().getId();
        log.info("User {} tạo payment cho category {}", studentId, request.getCategoryId());

        PaymentResponseDTO paymentResponse = paymentService.createPayment(request, studentId);
        return ResponseEntity.ok(paymentResponse);
    }

    @RequestMapping(value = "/callback", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> paymentCallback(HttpServletRequest request) {
        String transactionRef = request.getParameter("vnp_TxnRef"); // Use transactionRef
        if (transactionRef == null || transactionRef.isBlank()) {
            return redirectToFrontend("/payment/failure?error=missing_transaction_ref");
        }

        String vnpResponse = request.getParameter("vnp_ResponseCode");
        PaymentStatus status = "00".equals(vnpResponse) ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

        try {
            paymentService.handlePaymentCallback(transactionRef, status, null); // Pass transactionRef
            
            // Redirect to frontend success/failure page
            String redirectPath = status == PaymentStatus.SUCCESS 
                ? "/payment/success?transactionRef=" + transactionRef
                : "/payment/failure?transactionRef=" + transactionRef;
                
            return redirectToFrontend(redirectPath);
        } catch (Exception e) {
            log.error("Lỗi xử lý callback VNPay", e);
            return redirectToFrontend("/payment/failure?transactionRef=" + transactionRef + "&error=" + 
                URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    /** ===================== PAYMENT HỌC LẠI THEO ReEnrollment ===================== */
    @PostMapping("/create-reenroll")
    public ResponseEntity<?> createReEnrollPayment(
            @Valid @RequestBody ReEnrollPaymentRequestDTO request,
            @AuthenticationPrincipal MyUserDetails userDetails) {

        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        Integer studentId = userDetails.getUser().getId();
        log.info("User {} tạo payment cho ReEnrollment {}", studentId, request.getReEnrollmentIds());

        PaymentResponseDTO paymentResponse =
                paymentService.createPaymentForRetake(studentId, request.getReEnrollmentIds(), request.getPaymentMethod());

        return ResponseEntity.ok(paymentResponse);
    }

    @RequestMapping(value = "/callback-reenroll", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> reEnrollPaymentCallback(HttpServletRequest request) {
        // Log tất cả parameters để debug
        log.info("=== VNPay Callback Received ===");
        log.info("Request parameters: {}", request.getParameterMap());
        
        String transactionRef = request.getParameter("vnp_TxnRef"); // Use transactionRef
        String vnpResponse = request.getParameter("vnp_ResponseCode");
        
        log.info("Transaction Ref: {}, Response Code: {}", transactionRef, vnpResponse);
        
        if (transactionRef == null || transactionRef.isBlank()) {
            log.warn("Missing transactionRef in callback");
            return redirectToFrontend("/payment/failure?error=missing_transaction_ref");
        }

        PaymentStatus status = "00".equals(vnpResponse) ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
        log.info("TransactionRef: {}, Status: {}", transactionRef, status);

        try {
            paymentService.handleRetakePaymentCallback(transactionRef, status); // Pass transactionRef
            
            // Redirect to frontend success/failure page
            String redirectPath = status == PaymentStatus.SUCCESS 
                ? "/payment/success?transactionRef=" + transactionRef
                : "/payment/failure?transactionRef=" + transactionRef;
            
            log.info("Redirecting to: {}{}", frontendUrl, redirectPath);
            return redirectToFrontend(redirectPath);
        } catch (Exception e) {
            log.error("Lỗi xử lý callback VNPay ReEnrollment", e);
            return redirectToFrontend("/payment/failure?transactionRef=" + transactionRef + "&error=" + 
                URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    /** ===================== PRIVATE HELPERS ===================== */
    private ResponseEntity<?> redirectToFrontend(String path) {
        try {
            String fullUrl = frontendUrl + path;
            log.info("Creating redirect to: {}", fullUrl);
            return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(fullUrl))
                .build();
        } catch (Exception e) {
            log.error("Lỗi tạo redirect URL: {}", path, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Lỗi redirect: " + e.getMessage());
        }
    }

    /** ================= ADMIN ONLY - Lấy toàn bộ danh sách payments ================= */
    @GetMapping("/all")
    public ResponseEntity<?> getAllPayments(@AuthenticationPrincipal MyUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        User user = userDetails.getUser();
        if (user.getRole() == null || !RoleName.ROLE_ADMIN.equals(user.getRole().getRoleName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Chỉ admin mới được xem danh sách này"));
        }

        // Lấy toàn bộ danh sách payments từ bảng payments
        List<Payment> payments = paymentService.getAllPaymentsForAdmin();
        return ResponseEntity.ok(payments);
    }

}
