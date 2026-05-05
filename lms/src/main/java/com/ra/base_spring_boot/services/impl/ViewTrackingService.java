package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.services.IViewTrackingService;
import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class ViewTrackingService implements IViewTrackingService {

    // Cache: Key = "topicId:userIdentifier", Value = Thời gian hết hạn (timestamp tính bằng milliseconds)
    // Sử dụng ConcurrentHashMap để đảm bảo an toàn luồng (thread-safe)
    private final ConcurrentHashMap<String, Long> viewCache = new ConcurrentHashMap<>();

    // Thời gian cho một lượt xem duy nhất (Ví dụ: 30 phút)
    private static final long VIEW_DURATION_MINUTES = 30;

    private String generateKey(Long topicId, String userIdentifier) {
        // Topic ID và User Identifier phải kết hợp lại thành một Key duy nhất
        return topicId + ":" + userIdentifier;
    }

    @Override
    public boolean shouldIncrementView(Long topicId, String userIdentifier) {
        String key = generateKey(topicId, userIdentifier);
        long currentTime = System.currentTimeMillis();

        // 1. Kiểm tra nếu Key đã tồn tại và chưa hết hạn
        Long expirationTime = viewCache.get(key);

        if (expirationTime != null && expirationTime > currentTime) {
            // Trường hợp 1: Đã xem và chưa hết thời gian 30 phút -> KHÔNG TĂNG VIEW
            return false;
        } else {
            // Trường hợp 2: Chưa từng xem, HOẶC đã hết thời gian

            // Tính thời gian hết hạn mới (30 phút kể từ bây giờ)
            long newExpirationTime = currentTime + TimeUnit.MINUTES.toMillis(VIEW_DURATION_MINUTES);

            // Cập nhật/Thêm key vào cache (người dùng này bắt đầu một phiên xem mới)
            viewCache.put(key, newExpirationTime);

            // TĂNG VIEW
            return true;
        }
    }
}