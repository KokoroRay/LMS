// src/services/assignmentService.js
import api from "./authService";
const unwrap = (res) => (res && res.data && (res.data.data ?? res.data)) ?? res;

export const getAssignmentsBySession = async (sessionId) => {
  const res = await api.get(`/assignments/session/${sessionId}`);
  return unwrap(res);
};

export const getAssignment = async (id) => {
  const res = await api.get(`/assignments/${id}`);
  return unwrap(res);
};

export const createAssignment = async (payload) => {
  const res = await api.post(`/assignments`, payload);
  return unwrap(res);
};

export const updateAssignment = async (id, payload) => {
  const res = await api.put(`/assignments/${id}`, payload);
  return unwrap(res);
};

export const deleteAssignment = async (id) => {
  const res = await api.delete(`/assignments/${id}`);
  return unwrap(res);
};

// ✅ Lấy bài nộp của chính mình – handle 204 No Content
export const getMySubmission = async (assignmentId, attemptNumber) => {
  const params = new URLSearchParams();
  if (attemptNumber) {
    params.append('attemptNumber', attemptNumber);
  }

  const res = await api.get(
    `/submissions/assignment/${assignmentId}/my-submission?${params.toString()}`,
    {
      validateStatus: (status) => [200, 204].includes(status),
    }
  );

  if (res.status === 204) return null;

  return (res.data && (res.data.data ?? res.data)) ?? null;
};

// ✅ Submit GitHub link – KHÔNG gửi studentId
export const submitAssignment = async (assignmentId, githubUrl, attemptNumber) => {
  const payload = { assignmentId, githubUrl, attemptNumber };
  // TEMPORARY HACK: Force Authorization header
  const storedToken = localStorage.getItem("access_token");
  if (storedToken) {
    const token = storedToken.startsWith("Bearer ") ? storedToken.slice(7) : storedToken;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const res = await api.post(`/submissions`, payload);
  return unwrap(res);
};

export const getAllSubmittedAssignmentsByCourse = async (courseId) => {
  const res = await api.get(
    `/submissions/course/${courseId}/my-submitted-assignments`
  );
  return unwrap(res);
};

export const gradeSubmission = async (submissionId, payload) => {
  const url = `/submissions/${submissionId}/grade`;
  const res = await api.put(url, payload);
  return unwrap(res);
};

export const getSubmissionsByAssignment = async (assignmentId) => {
  const res = await api.get(`/submissions/assignment/${assignmentId}`);
  return unwrap(res);
};
