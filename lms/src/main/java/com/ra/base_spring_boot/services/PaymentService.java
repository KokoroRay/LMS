package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.PaymentRequestDTO;
import com.ra.base_spring_boot.dto.resp.PaymentResponseDTO;
import com.ra.base_spring_boot.model.Payment;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.PaymentMethod;
import com.ra.base_spring_boot.model.constants.PaymentStatus;

import java.util.List;

public interface PaymentService {

    PaymentResponseDTO createPayment(PaymentRequestDTO request, Integer studentId);

    // sửa: học lại giờ nhận reEnrollmentId
    // Thay đổi sang list để support nhiều môn học
    PaymentResponseDTO createPaymentForRetake(Integer studentId, List<Integer> reEnrollmentIds, PaymentMethod method);

    /**
     * Xử lý callback VNPay
     * @param transactionRef unique transaction reference
     * @param status trạng thái thanh toán
     * @param classId ID lớp học (nếu null sẽ enroll lớp đầu tiên)
     */
    void handlePaymentCallback(String transactionRef, PaymentStatus status, Integer classId);


    /**
     * Lấy thông tin Payment theo ID (dùng cho phân quyền)
     */
    Payment getPaymentById(Integer paymentId);


    // Tách riêng cho admin
    List<Payment> getAllPaymentsForAdmin();

    // Tách riêng cho student
    List<Payment> getPaymentsForStudent(User student);
    // sửa: học lại callback không cần classId
    void handleRetakePaymentCallback(String transactionRef, PaymentStatus status);
}
