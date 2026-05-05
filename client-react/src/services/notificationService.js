// File: src/services/notificationService.js

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from './authService';

/**
 * Service để kết nối WebSocket và quản lý thông báo qua API
 */
class NotificationService {
  constructor() {
    this.client = null;
    this.userId = null;
    this.onNotificationCallback = null;
  }

  // ========== API METHODS ==========

  /**
   * Admin gửi thông báo đến nhiều user
   */
  async sendToUsers(request) {
    try {
      const response = await api.post('/notifications/admin/send', request);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error sending notifications:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách thông báo của user (có phân trang)
   */
  async getMyNotifications(page = 0, size = 10) {
    try {
      const response = await api.get('/notifications/my-notifications', {
        params: { page, size }
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Đánh dấu thông báo đã đọc
   */
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/mark-read`, {});
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data?.data || response.data || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Xóa một thông báo
   */
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Xóa nhiều thông báo cùng lúc
   */
  async deleteMultiple(notificationIds) {
    try {
      const response = await api.delete('/notifications/bulk', {
        data: notificationIds
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting multiple notifications:', error);
      throw error;
    }
  }

  /**
   * Xóa tất cả thông báo đã đọc
   */
  async deleteAllRead() {
    try {
      const response = await api.delete('/notifications/read');
      return response.data;
    } catch (error) {
      console.error('Error deleting all read notifications:', error);
      throw error;
    }
}

// ========== WEBSOCKET METHODS ==========

  /**
   * Kết nối đến WebSocket server
   * @param {number} userId - ID của user
   * @param {function} onNotification - Hàm được gọi khi nhận thông báo mới
   */
  connect(userId, onNotification) {
    this.userId = userId;
    this.onNotificationCallback = onNotification;

    if (!userId) {
      console.warn('Cannot connect WebSocket: userId is missing');
      return;
    }

    // Lấy WebSocket URL từ environment hoặc sử dụng default
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8080';
    const wsUrl = `${wsBaseUrl.replace(/\/$/, '')}/ws`;
    
    // Lấy token từ localStorage để authentication
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    
    console.log('🔌 Đang kết nối WebSocket tới:', wsUrl);
    
    // Tạo kết nối WebSocket đến server với token
    const socket = new SockJS(wsUrl);
    
    // Tạo STOMP client
    this.client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: token ? { token } : {},
      
      onConnect: () => {
        console.log('✅ Đã kết nối WebSocket');
        this.subscribe();
      },
      
      onStompError: (frame) => {
        console.error('❌ Lỗi WebSocket:', frame);
      },
      
      onDisconnect: () => {
        console.log('⚠️ Mất kết nối WebSocket');
      },
    });

    // Bắt đầu kết nối
    this.client.activate();
  }

  /**
   * Subscribe vào kênh nhận thông báo của user
   */
  subscribe() {
    if (this.client && this.userId) {
      const destination = `/queue/notifications/${this.userId}`;
      
      this.client.subscribe(destination, (message) => {
        const notification = JSON.parse(message.body);
        console.log('🔔 Nhận thông báo mới qua WebSocket:', notification);
        
        if (this.onNotificationCallback) {
          this.onNotificationCallback(notification);
        }
      });
      
      console.log(`📡 Đã subscribe vào: ${destination}`);
    }
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      console.log('🔌 Đã ngắt kết nối WebSocket');
    }
  }
}

// Export singleton instance
export default new NotificationService();