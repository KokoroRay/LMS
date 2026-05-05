// File: src/components/notification/NotificationComponent.jsx

import { useEffect, useState, useCallback } from 'react';
import notificationService from '../../services/notificationService';
import { message } from 'antd';

/**
 * Hook để quản lý thông báo real-time và từ database
 * 
 * @param {number} userId - ID của user
 * @returns {object} { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, deleteAllRead, refreshNotifications, page, setPage, totalPages }
 */
export const useNotifications = (userId) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // Fetch thông báo từ API
    const fetchNotifications = useCallback(async (pageNum = 0) => {
        if (!userId) return;

        setLoading(true);
        try {
            const response = await notificationService.getMyNotifications(pageNum, pageSize);
            
            // Handle response format
            const pageData = response?.content ? response : 
                           response?.data?.content ? response.data : 
                           { content: Array.isArray(response) ? response : [], totalPages: 0, totalElements: 0 };
            
            setNotifications(pageData.content || []);
            setTotalPages(pageData.totalPages || 0);
            setTotalElements(pageData.totalElements || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            message.error('Không thể tải thông báo');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Fetch số lượng chưa đọc
    const fetchUnreadCount = useCallback(async () => {
        if (!userId) return;

        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, [userId]);

    // Hàm xử lý khi nhận thông báo mới qua WebSocket
    const handleNewNotification = useCallback((notification) => {
        console.log('🔔 Nhận thông báo mới:', notification);

        // Thêm thông báo vào đầu danh sách
        setNotifications((prev) => {
            // Kiểm tra xem thông báo đã tồn tại chưa (tránh duplicate)
            const exists = prev.some(n => n.notificationId === notification.notificationId);
            if (exists) return prev;
            return [notification, ...prev];
        });

        // Tăng số thông báo chưa đọc
        setUnreadCount((prev) => prev + 1);

        // Hiển thị toast notification (optional)
        // message.info(notification.title, {
        //   description: notification.message,
        //   duration: 5,
        // });
    }, []);

    // Khởi tạo: kết nối WebSocket và fetch dữ liệu
    useEffect(() => {
        if (!userId) return;

        console.log('🔔 Khởi tạo Notification Service cho user:', userId);

        // Kết nối WebSocket
        notificationService.connect(userId, handleNewNotification);

        // Fetch thông báo từ database
        fetchNotifications(0);
        fetchUnreadCount();

        // Cleanup: ngắt kết nối khi component unmount
        return () => {
            notificationService.disconnect();
        };
    }, [userId, fetchNotifications, fetchUnreadCount, handleNewNotification]);

    // Fetch lại khi page thay đổi
    useEffect(() => {
        if (userId) {
            fetchNotifications(page);
        }
    }, [page, userId, fetchNotifications]);

    // Đánh dấu một thông báo đã đọc
    const markAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            
            // Cập nhật state local
            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.notificationId === notificationId
                        ? { ...notif, isRead: true }
                        : notif
                )
            );
            
            // Giảm số lượng chưa đọc
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
            message.error('Không thể đánh dấu đã đọc');
        }
    };

    // Đánh dấu tất cả đã đọc
    const markAllAsRead = async () => {
        try {
            // Lấy tất cả thông báo chưa đọc
            const unreadNotifications = notifications.filter(n => !n.isRead);
            
            // Gọi API cho từng thông báo
            await Promise.all(
                unreadNotifications.map(n => notificationService.markAsRead(n.notificationId))
            );
            
            // Cập nhật state
            setNotifications((prev) =>
                prev.map((notif) => ({ ...notif, isRead: true }))
            );
            
            setUnreadCount(0);
            message.success('Đã đánh dấu tất cả đã đọc');
        } catch (error) {
            console.error('Error marking all as read:', error);
            message.error('Không thể đánh dấu tất cả đã đọc');
        }
    };

    // Xóa một thông báo
    const deleteNotification = async (notificationId) => {
        try {
            await notificationService.deleteNotification(notificationId);
            setNotifications((prev) =>
                prev.filter((n) => n.notificationId !== notificationId)
            );
            
            // Cập nhật unread count nếu thông báo chưa đọc
            const deleted = notifications.find(n => n.notificationId === notificationId);
            if (deleted && !deleted.isRead) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            
            message.success('Đã xóa thông báo');
        } catch (error) {
            console.error('Error deleting notification:', error);
            message.error('Không thể xóa thông báo');
        }
    };

    // Xóa nhiều thông báo
    const deleteMultiple = async (notificationIds) => {
        try {
            await notificationService.deleteMultiple(notificationIds);
            setNotifications((prev) =>
                prev.filter((n) => !notificationIds.includes(n.notificationId))
            );
            
            // Cập nhật unread count
            const deleted = notifications.filter(n => 
                notificationIds.includes(n.notificationId) && !n.isRead
            );
            setUnreadCount((prev) => Math.max(0, prev - deleted.length));
            
            message.success(`Đã xóa ${notificationIds.length} thông báo`);
        } catch (error) {
            console.error('Error deleting multiple notifications:', error);
            message.error('Không thể xóa thông báo');
        }
    };

    // Xóa tất cả thông báo đã đọc
    const deleteAllRead = async () => {
        try {
            await notificationService.deleteAllRead();
            setNotifications((prev) => prev.filter((n) => !n.isRead));
            message.success('Đã xóa tất cả thông báo đã đọc');
        } catch (error) {
            console.error('Error deleting all read notifications:', error);
            message.error('Không thể xóa thông báo đã đọc');
        }
    };

    // Refresh danh sách thông báo
    const refreshNotifications = useCallback(() => {
        fetchNotifications(page);
        fetchUnreadCount();
    }, [page, fetchNotifications, fetchUnreadCount]);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteMultiple,
        deleteAllRead,
        refreshNotifications,
        page,
        setPage,
        totalPages,
        totalElements,
        pageSize,
    };
};

// Component cũ (giữ lại để tương thích)
const NotificationComponent = ({ userId }) => {
    const { notifications, unreadCount, loading } = useNotifications(userId);

    if (loading) {
        return <div>Đang tải...</div>;
    }

    return (
        <div className="notification-container">
            <div className="notification-bell">
                🔔
                {unreadCount > 0 && (
                    <span className="badge">{unreadCount}</span>
                )}
            </div>

            <div className="notifications-list">
                {notifications.map((notification) => (
                    <div
                        key={notification.notificationId}
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    >
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.createdAt).toLocaleString()}</small>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationComponent;