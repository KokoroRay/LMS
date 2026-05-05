import api from "./authService"; // Giả định có file authService

export const saveQuestionToBank = (questionData) =>
  api.post("/exam-bank", questionData);

export const searchExamBankQuestions = (params) => {
  const sortParam = params.sort ? { sort: params.sort.join(",") } : {};
  return api.get("/exam-bank", {
    params: {
      keyword: params.keyword,
      type: params.type,
      page: params.page,
      size: params.size,
      ...sortParam,
    },
  });
};

export const getExamsByClass = (classId, page = 0, size = 100) => {
  const token = localStorage.getItem("access_token");
  // ... (giữ nguyên logic kiểm tra token)
  if (!token) {
    console.error("🚫 BLOCKED getExamsByClass - No token available");
    throw new Error("Authentication required - no token available");
  }
  return api.get(`/exams/class/${classId}`, { params: { page, size } });
};

export const createExam = (examData) => {
  console.log("API createExam call with data:", examData);
  return api.post("/exams", examData);
};

export const updateExam = (examId, examData) => {
  console.log("API updateExam call with id/data:", examId, examData);
  return api.put(`/exams/${examId}`, examData);
};

export const deleteExam = (examId) => api.delete(`/exams/${examId}`);

export const publishExam = (examId) => api.post(`/exams/${examId}/publish`);

export const unpublishExam = (examId) => api.post(`/exams/${examId}/unpublish`);

export const getExamSlots = (examId) => api.get(`/exams/${examId}/slots`);

export const getAvailableExams = () => api.get("/exams/available");

export const getAllExamsForStudent = () => api.get("/exams/student/all");

export const getExamDetails = (examId) => api.get(`/exams/${examId}/details`);

// ⭐ ĐÃ SỬA: Lấy ExamDTO trực tiếp từ ResponseWrapper
export const getExamDetailsForInstructor = async (examId) => {
  const response = await api.get(`/exams/instructor/${examId}/details`);

  if (response.data && response.data.data) {
    return response.data.data; // Trả về ExamDTO
  }

  return response.data || response;
};

export const submitExam = (submissionData) =>
  api.post("/exams/submit", submissionData);

export const getExamResults = (examId) => api.get(`/exams/${examId}/results`);

export const getAllMyExamResults = () => {
  return api.get("/exams/student/all-results");
};

export const canAttemptExam = (examId) =>
  api.get(`/exams/${examId}/can-attempt`);

export const getExamQuestionsForInstructor = (examId) =>
  api.get(`/exams/${examId}/questions`);

export const addQuestionToExam = (examId, questionData) =>
  api.post(`/exams/${examId}/questions`, questionData);

export const updateExamQuestion = (questionId, questionData) =>
  api.put(`/exams/questions/${questionId}`, questionData);

export const deleteExamQuestion = (questionId) =>
  api.delete(`/exams/questions/${questionId}`);

export const getExamSubmissionsForInstructor = (examId) =>
  api.get(`/exams/instructor/${examId}/submissions`);

export const getSubmissionDetailForInstructor = (resultId) =>
  api.get(`/exams/instructor/submissions/${resultId}`);

export const gradeSubmission = (resultId, gradeData) =>
  api.post(`/exams/instructor/submissions/${resultId}/grade`, gradeData);

export const grantExtraExamAttempt = (examId, studentId, extraAttempts) => {
  return api.post(`/exams/${examId}/override/grant`, { studentId, extraAttempts });
};

export const revokeExtraExamAttempt = (examId, studentId) => {
  return api.delete(`/exams/${examId}/override/revoke/${studentId}`);
};

export const getStudentAttemptOverrides = (examId) => {
  return api.get(`/exams/${examId}/override`);
};

export const getStudentsInExamClass = (examId) => {
  return api.get(`/exams/${examId}/students`);
};
