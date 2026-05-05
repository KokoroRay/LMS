import api from '../config';

// Tạo re-enrollment mới
export const createReEnrollment = (studentId, failedCourseGradeId) => {
  return api.post('/reenrollments/create', null, {
    params: {
      studentId,
      failedCourseGradeId
    }
  });
};

// Hoàn tất re-enrollment (cập nhật tất cả điểm)
export const completeReEnrollment = (reEnrollmentData) => {
  return api.post('/reenrollments/complete', reEnrollmentData);
};

// Cập nhật trạng thái re-enrollment
export const updateReEnrollmentStatus = (reEnrollmentId, status) => {
  return api.post('/reenrollments/update-status', null, {
    params: {
      reEnrollmentId,
      status
    }
  });
};

// Lấy danh sách re-enrollment của sinh viên
export const getReEnrollmentsByStudent = (studentId) => {
  return api.get(`/reenrollments/${studentId}`);
};

// Admin: Lấy tất cả re-enrollment
export const getAllReEnrollmentsForAdmin = () => {
  return api.get('/reenrollments/admin/all');
};

/**
 * ⭐ THÊM MỚI: Lấy danh sách re-enrollment đã thanh toán thành công
 * Dành cho admin để xem danh sách sinh viên có thể cập nhật điểm exam
 */
export const getPaidReEnrollments = () => {
  return api.get('/reenrollments/paid');
};

/**
 * ⭐ LUỒNG MỚI: Lấy danh sách re-enrollment cần kích hoạt quyền thi lại
 */
export const getPendingActivationReEnrollments = () => {
  return api.get('/reenrollments/pending-activation');
};

/**
 * ⭐ LUỒNG MỚI: Admin kích hoạt quyền làm lại bài kiểm tra
 */
export const activateRetakeExam = (reEnrollmentId) => {
  return api.post(`/reenrollments/${reEnrollmentId}/activate-retake`);
};

export default {
  createReEnrollment,
  completeReEnrollment,
  updateReEnrollmentStatus,
  getReEnrollmentsByStudent,
  getAllReEnrollmentsForAdmin,
  getPaidReEnrollments,
  getPendingActivationReEnrollments,
  activateRetakeExam
};