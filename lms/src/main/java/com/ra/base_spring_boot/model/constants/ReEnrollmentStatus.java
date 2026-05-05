package com.ra.base_spring_boot.model.constants;

public enum ReEnrollmentStatus {
    PENDING,
    PAYMENT_PENDING,
    PAYMENT_SUCCESS,
    PAYMENT_FAILED,
    ENROLLED, // Luồng cũ - chuyển lớp mới
    RETAKE_ACTIVATED, // ⭐ Luồng mới - kích hoạt quyền thi lại ở lớp hiện tại
    CANCELLED,
    COMPLETED,
    REJECTED
}
