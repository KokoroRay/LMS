import api from "./authService";

const REPORT_URL = "/forum/reports";

// Lấy danh sách báo cáo (có phân trang, filter status)
export const getReportsAPI = (params) => api.get(REPORT_URL, { params });

// Lấy thống kê số lượng báo cáo (Pending, Resolved, etc.)
export const getReportStatsAPI = () => api.get(`${REPORT_URL}/statistics`);

// Cập nhật trạng thái báo cáo (VD: Từ PENDING -> UNDER_REVIEW hoặc DISMISSED)
export const updateReportStatusAPI = (reportId, data) =>
  api.put(`${REPORT_URL}/${reportId}`, data);

// Xóa vĩnh viễn dòng báo cáo này khỏi database (Lưu ý: Không xóa bài viết gốc)
export const deleteReportAPI = (reportId) =>
  api.delete(`${REPORT_URL}/${reportId}`);

export const resolveReportAPI = (reportId, deleteContent) =>
  api.put(`${REPORT_URL}/${reportId}/resolve`, { deleteContent });

export const createReportAPI = (data) => api.post(REPORT_URL, data);
