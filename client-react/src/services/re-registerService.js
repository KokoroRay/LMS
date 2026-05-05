//Service đăng kí học lại.
import api from "./authService";

const fetchAllCoursesAPI = () => {
  return api.get(`/courses`);
};

// Tạo đăng ký học lại
export const createReEnrollmentAPI = (studentId, failedCourseGradeId) => {
  return api.post(
    `/reenrollments/create?studentId=${studentId}&failedCourseGradeId=${failedCourseGradeId}`
  );
};

// Tạo thanh toán học lại
export const createReEnrollmentPaymentAPI = (reEnrollmentIds, paymentMethod = "VNPAY") => {
  return api.post(`/payments/create-reenroll`, {
    reEnrollmentIds,
    paymentMethod,
  });
};

// Lấy danh sách các môn đã đăng ký học lại (để thanh toán)
export const getMyReEnrollmentsAPI = (studentId) => {
  return api.get(`/reenrollments/${studentId}`);
};

// ===== REENROLLMENT REVENUE - Lấy tất cả reenrollments =====
// Hàm này dùng để tính tổng revenue từ các reenrollments có status PAYMENT_SUCCESS
export const getAllReEnrollmentsAPI = () => {
  return api.get(`/reenrollments/all`);
};

export default fetchAllCoursesAPI;
