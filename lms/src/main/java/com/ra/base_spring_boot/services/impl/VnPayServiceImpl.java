package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.model.constants.PaymentStatus;

import com.ra.base_spring_boot.services.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class VnPayServiceImpl implements VnPayService {

    @Value("${vnpay.tmnCode}")
    private String vnp_TmnCode;

    @Value("${vnpay.hashSecret}")
    private String secretKey;

    @Value("${vnpay.paymentUrl}")
    private String vnp_PayUrl;

    @Value("${vnpay.returnUrl}")
    private String vnp_ReturnUrl;

    @Value("${vnpay.ipnUrl}")
    private String vnp_IpnUrl;

    @Override
    public String createPaymentUrl(String txnRef, int amount, HttpServletRequest request) throws Exception {
        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String createDate = formatter.format(cld.getTime());
        cld.add(Calendar.MINUTE, 15);
        String expireDate = formatter.format(cld.getTime());

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnp_TmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amount * 100));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef); // <--- Use txnRef here
        vnpParams.put("vnp_OrderInfo", "Thanh toan khoa hoc #" + txnRef); // <--- Use txnRef here
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnpParams.put("vnp_IpAddr", request.getRemoteAddr());
        vnpParams.put("vnp_CreateDate", createDate);
        vnpParams.put("vnp_ExpireDate", expireDate);

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> it = fieldNames.iterator();
        while (it.hasNext()) {
            String fieldName = it.next();
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName)
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));

                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));

                if (it.hasNext()) {
                    hashData.append('&');
                    query.append('&');
                }
            }
        }

        String vnp_SecureHash = hmacSHA512(secretKey, hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);
        return vnp_PayUrl + "?" + query;
    }

    @Override
    public PaymentStatus orderReturn(HttpServletRequest request) throws Exception {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
            String fieldName = params.nextElement();
            String fieldValue = request.getParameter(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                fields.put(fieldName, fieldValue);
            }
        }

        String vnp_SecureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder signData = new StringBuilder();
        for (int i = 0; i < fieldNames.size(); i++) {
            String fieldName = fieldNames.get(i);
            String fieldValue = fields.get(fieldName);
            signData.append(fieldName).append("=")
                    .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
            if (i < fieldNames.size() - 1) {
                signData.append("&");
            }
        }

        String signed = hmacSHA512(secretKey, signData.toString());

        if (signed.equals(vnp_SecureHash)) {
            String responseCode = fields.get("vnp_ResponseCode");
            return "00".equals(responseCode) ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
        } else {
            return PaymentStatus.FAILED;
        }
    }

    @Override
    public String refundTransaction(String txnRef, long amount, String reason) throws Exception {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "refund");
        params.put("vnp_TmnCode", vnp_TmnCode);
        params.put("vnp_TransactionType", "02"); // Hoàn tiền toàn phần
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_Amount", String.valueOf(amount * 100));
        params.put("vnp_OrderInfo", "Hoàn tiền giao dịch #" + txnRef + " - " + reason);
        params.put("vnp_CreateBy", "System");
        params.put("vnp_CreateDate", new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()));

        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        for (String name : fieldNames) {
            String value = params.get(name);
            if (hashData.length() > 0) hashData.append("&");
            hashData.append(name).append("=")
                    .append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
        }

        String vnp_SecureHash = hmacSHA512(secretKey, hashData.toString());
        params.put("vnp_SecureHash", vnp_SecureHash);

        return "00";
    }

    private String hmacSHA512(String key, String data) throws Exception {
        Mac hmac = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        hmac.init(secretKeySpec);
        byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hash = new StringBuilder();
        for (byte b : bytes) {
            hash.append(String.format("%02x", b));
        }
        return hash.toString();
    }
}
