import api from "./authService";

export const fetchAttendanceListAPI = async (timetableId) => {
  const res = await api.get(`/attendance/session/${timetableId}/list`);
  return Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
};

export const saveAttendanceAPI = async (dto) => {
  const res = await api.post(`/attendance/save-batch`, dto);
  return res?.data ?? true;
};

export const fetchMyAttendanceSummary = async () => {
  const res = await api.get(`/attendance/student/me/summary`);
  return res?.data ?? [];
};
