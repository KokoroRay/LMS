package com.ra.base_spring_boot.services;

public interface IViewTrackingService {
    /**
     * Kiểm tra xem lượt xem có nên được tăng cho Topic này bởi người dùng/IP này hay không.
     * Logic: Tránh tăng View Count nếu người dùng đã xem trong vòng 30 phút qua.
     * * @param topicId ID của Topic.
     * @param userIdentifier ID duy nhất của người dùng (User ID nếu đăng nhập, hoặc IP/Session ID).
     * @return true nếu đây là lượt xem duy nhất và cần tăng ViewCount.
     */
    boolean shouldIncrementView(Long topicId, String userIdentifier);
}