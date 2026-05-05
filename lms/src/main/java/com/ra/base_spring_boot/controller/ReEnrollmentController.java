package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.req.CompleteReEnrollmentRequestDTO;
import com.ra.base_spring_boot.dto.resp.ReEnrollmentDTO;
import com.ra.base_spring_boot.model.constants.ReEnrollmentStatus;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.ReEnrollmentService;
import com.ra.base_spring_boot.services.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.Payment;
import com.ra.base_spring_boot.model.constants.RoleName;

@RestController
@RequestMapping("/reenrollments")
@RequiredArgsConstructor
@Slf4j
public class ReEnrollmentController {

    private final ReEnrollmentService reEnrollmentService;
    private final PaymentService paymentService;

    /** ===================== TẠO LẦN HỌC LẠI ===================== */
    @PostMapping("/create")
    public ResponseEntity<?> createReEnrollment(
            @RequestParam Integer studentId,
            @RequestParam Integer failedCourseGradeId) {

        ReEnrollmentDTO dto = reEnrollmentService.createReEnrollment(studentId, failedCourseGradeId);
        return ResponseEntity.ok(dto);
    }


    /** ===================== HOÀN TẤT HỌC LẠI ===================== */
    @PostMapping("/complete")
    public ResponseEntity<?> completeReEnrollment(
            @Valid @RequestBody CompleteReEnrollmentRequestDTO request,
            @AuthenticationPrincipal MyUserDetails userDetails) {

        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        log.info("Hoàn tất ReEnrollment {} với điểm: assignment={}, quiz={}, exam={}",
                request.getReEnrollmentId(), request.getAssignmentScore(), request.getQuizScore(), request.getExamScore());

        try {
            reEnrollmentService.completeReEnrollment(
                    request.getReEnrollmentId(),
                    request.getAssignmentScore(),
                    request.getQuizScore(),
                    request.getExamScore()
            );
            return ResponseEntity.ok(Map.of("message", "Hoàn tất học lại thành công"));
        } catch (Exception e) {
            log.error("Lỗi hoàn tất học lại", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** ===================== CẬP NHẬT TRẠNG THÁI (TUỲ CHỌN) ===================== */
    @PostMapping("/update-status")
    public ResponseEntity<?> updateStatus(
            @RequestParam Integer reEnrollmentId,
            @RequestParam ReEnrollmentStatus status, // <-- đổi từ String sang enum
            @AuthenticationPrincipal MyUserDetails userDetails) {

        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        log.info("Cập nhật status ReEnrollment {} → {}", reEnrollmentId, status);

        try {
            reEnrollmentService.updateStatus(reEnrollmentId, status);
            return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái thành công"));
        } catch (Exception e) {
            log.error("Lỗi cập nhật trạng thái", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllReEnrollmentsForAdmin(@AuthenticationPrincipal MyUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        User user = userDetails.getUser();
        if (user.getRole() == null || !RoleName.ROLE_ADMIN.equals(user.getRole().getRoleName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Chỉ admin mới được xem danh sách này"));
        }

        List<ReEnrollmentDTO> list = reEnrollmentService.getAllForAdmin();
        return ResponseEntity.ok(list);
    }

    /** ================= USER ONLY - Danh sách re_enrollments theo student_id ================= */
    @GetMapping("/{studentId}")
    public ResponseEntity<?> getReEnrollmentsByStudentId(
            @PathVariable Integer studentId,
            @AuthenticationPrincipal MyUserDetails userDetails) {

        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        User currentUser = userDetails.getUser();

        // Chỉ cho phép user xem re_enrollments của chính mình (trừ admin)
        if (!RoleName.ROLE_ADMIN.equals(currentUser.getRole().getRoleName())
                && !studentId.equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Không có quyền xem re_enrollments của user khác"));
        }

        // Lấy danh sách re_enrollments của student này từ bảng re_enrollments
        List<ReEnrollmentDTO> reEnrollments = reEnrollmentService.getAllByStudent(studentId);
        return ResponseEntity.ok(reEnrollments);
    }

    /**
     * ⭐ ENDPOINT MỚI: Lấy danh sách re-enrollment đã thanh toán thành công
     * Dùng để hiển thị danh sách sinh viên có thể cập nhật điểm exam
     */
    @GetMapping("/paid")
    public ResponseEntity<?> getPaidReEnrollments(@AuthenticationPrincipal MyUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        User currentUser = userDetails.getUser();

        // Chỉ admin mới được xem danh sách này
        if (!RoleName.ROLE_ADMIN.equals(currentUser.getRole().getRoleName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Chỉ admin mới có quyền truy cập"));
        }

        List<ReEnrollmentDTO> paidReEnrollments = reEnrollmentService.getPaidReEnrollments();
        return ResponseEntity.ok(Map.of(
            "message", "Danh sách sinh viên đã thanh toán học lại thành công",
            "data", paidReEnrollments
        ));
    }

    /**
     * ⭐ ENDPOINT MỚI: Lấy danh sách re-enrollment cần kích hoạt quyền thi lại
     */
    @GetMapping("/pending-activation")
    public ResponseEntity<?> getPendingActivationReEnrollments(@AuthenticationPrincipal MyUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        User currentUser = userDetails.getUser();
        // Chỉ admin mới được xem danh sách này
        if (!RoleName.ROLE_ADMIN.equals(currentUser.getRole().getRoleName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Chỉ admin mới có quyền truy cập"));
        }

        List<ReEnrollmentDTO> pendingReEnrollments = reEnrollmentService.getPendingActivationReEnrollments();
        return ResponseEntity.ok(Map.of(
            "message", "Danh sách sinh viên cần kích hoạt quyền thi lại",
            "data", pendingReEnrollments
        ));
    }

    /**
     * ⭐ ENDPOINT MỚI: Admin kích hoạt quyền làm lại bài kiểm tra
     */
    @PostMapping("/{reEnrollmentId}/activate-retake")
    public ResponseEntity<?> activateRetakeExam(
            @PathVariable Integer reEnrollmentId,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        User currentUser = userDetails.getUser();
        // Chỉ admin mới có quyền kích hoạt
        if (!RoleName.ROLE_ADMIN.equals(currentUser.getRole().getRoleName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Chỉ admin mới có quyền kích hoạt"));
        }

        try {
            reEnrollmentService.activateRetakeExam(reEnrollmentId, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Đã kích hoạt quyền làm lại bài kiểm tra thành công"));
        } catch (Exception e) {
            log.error("Lỗi kích hoạt quyền thi lại", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}
