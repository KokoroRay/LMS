// ===== PAYMENT SERVICE - Lịch sử thanh toán =====
import api from "./authService";

// ===== GET ALL PAYMENTS - Lấy tất cả payments (Admin) =====
export const getAllPaymentsAPI = () => {
  return api.get("/payments/all");
};

// ===== GET REENROLLMENTS BY STUDENT ID - Lấy danh sách reenrollments của student =====
export const getMyPaymentsAPI = (studentId) => {
  return api.get(`/reenrollments/${studentId}`); // ===== ĐỔI TỪ /payments/ SANG /reenrollments/ =====
};

// ===== GET PAYMENT BY ID - Lấy chi tiết payment theo ID =====
export const getPaymentByIdAPI = (paymentId) => {
  return api.get(`/payments/${paymentId}`);
};

export default {
  getAllPaymentsAPI,
  getMyPaymentsAPI,
  getPaymentByIdAPI,
};
