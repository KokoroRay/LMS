import api from './authService';
import authUtils from '../utils/authUtils';

// 🎯 Lesson Completion Service - Quản lý tiến độ hoàn thành bài học của user
export const lessonCompletionService = {
  // Lấy danh sách lesson đã hoàn thành của user trong course
  async getCompletedLessons(userId, courseId) {
    try {
      // Sử dụng localStorage làm database tạm thời cho từng user
      const key = `completed_lessons_${userId}_${courseId}`;
      const stored = localStorage.getItem(key);
      const completed = stored ? JSON.parse(stored) : [];
      
      return completed;
    } catch (error) {
      console.warn('⚠️ Error getting completed lessons:', error.message);
      return [];
    }
  },

  // Đánh dấu lesson đã hoàn thành
  async markLessonCompleted(userId, courseId, lessonId, workItemType = 'video') {
    const workItemKey = `${courseId}_${lessonId}_${workItemType}`;
    
    try {
      // Sử dụng localStorage làm database cho từng user
      const key = `completed_lessons_${userId}_${courseId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      
      if (!existing.includes(workItemKey)) {
        existing.push(workItemKey);
        localStorage.setItem(key, JSON.stringify(existing));
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Error marking lesson completed:', error.message);
      return false;
    }
  },

  // Kiểm tra xem lesson có đã hoàn thành chưa
  async isLessonCompleted(userId, courseId, lessonId, workItemType = 'video') {
    const workItemKey = `${courseId}_${lessonId}_${workItemType}`;
    
    try {
      const completed = await this.getCompletedLessons(userId, courseId);
      return completed.includes(workItemKey);
    } catch (error) {
      console.warn('⚠️ Error checking lesson completion:', error.message);
      return false;
    }
  },

  // Lấy userId hiện tại từ auth
  getCurrentUserId() {
    return authUtils.getCurrentUserId();
  },

  // Kiểm tra xem user có thể truy cập lesson này không (theo thứ tự)
  async canAccessLesson(userId, courseId, targetLessonId, allLessons) {
    if (!userId || !courseId || !targetLessonId) {
      return true;
    }
    
    if (!allLessons || allLessons.length === 0) {
      return true;
    }
    
    try {
      const completedLessons = await this.getCompletedLessons(userId, courseId);
      
      // Sắp xếp lessons theo thứ tự
      const sortedLessons = [...allLessons].sort((a, b) => a.lessonId - b.lessonId);
      const targetIndex = sortedLessons.findIndex(l => l.lessonId === targetLessonId);
      
      if (targetIndex === -1) {
        return true;
      }
      
      if (targetIndex === 0) {
        return true;
      }
      
      // Kiểm tra tất cả lessons trước đó đã hoàn thành chưa
      for (let i = 0; i < targetIndex; i++) {
        const prevLesson = sortedLessons[i];
        const workItemKey = `${courseId}_${prevLesson.lessonId}_video`;
        
        if (!completedLessons.includes(workItemKey)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Error checking lesson access:', error.message);
      return true; // Cho phép truy cập nếu có lỗi
    }
  }
};

export default lessonCompletionService;