import api from "./authService";

export const createLeaveRequest = (data) => api.post("/leave-requests", data);

export const getMyLeaveRequests = (status = "all", page = 0, size = 10) => {
  const statusQuery = status && status !== "all" ? `&status=${status}` : "";
  return api.get(`/leave-requests/my?page=${page}&size=${size}${statusQuery}`);
};

export const getAllLeaveRequests = (status = "PENDING", page = 0, size = 10) =>
  api.get(`/admin/leave-requests?status=${status}&page=${page}&size=${size}`);

export const approveLeaveRequest = (requestId) =>
  api.patch(`/admin/leave-requests/${requestId}/approve`);

export const rejectLeaveRequest = (requestId) =>
  api.patch(`/admin/leave-requests/${requestId}/reject`);
