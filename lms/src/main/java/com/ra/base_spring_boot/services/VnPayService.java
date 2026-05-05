package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.constants.PaymentStatus;
import jakarta.servlet.http.HttpServletRequest;

public interface VnPayService {
    String createPaymentUrl(String txnRef, int amount, HttpServletRequest request) throws Exception;
    PaymentStatus orderReturn(HttpServletRequest request) throws Exception;
    String refundTransaction(String txnRef, long amount, String reason) throws Exception;
}
