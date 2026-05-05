// src/services/surveyService.js
import api from "./authService";

const unwrap = (res) => (res?.data?.data ?? res?.data ?? res);

// ====================== SURVEY ======================

export const createSurvey = async (payload) => {
  const res = await api.post("/surveys", payload);
  return unwrap(res);
};

export const updateSurvey = async (surveyId, payload) => {
  const res = await api.put(`/surveys/${surveyId}`, payload);
  return unwrap(res);
};

export const deleteSurvey = async (surveyId) => {
  const res = await api.delete(`/surveys/${surveyId}`);
  return unwrap(res);
};

export const getSurvey = async (surveyId) => {
  const res = await api.get(`/surveys/${surveyId}`);
  return unwrap(res);
};

export const getSurveyByCourse = async (courseId) => {
  const res = await api.get(`/surveys/course/${courseId}`);
  return unwrap(res);
};

export const listSurveys = async (isActive = true) => {
  const res = await api.get(`/surveys?isActive=${isActive}`);
  return unwrap(res);
};

export const activateSurvey = async (surveyId) => {
  const res = await api.put(`/surveys/${surveyId}/activate`);
  return unwrap(res);
};

export const deactivateSurvey = async (surveyId) => {
  const res = await api.put(`/surveys/${surveyId}/deactivate`);
  return unwrap(res);
};

// ====================== QUESTIONS ======================

export const addSurveyQuestion = async (surveyId, payload) => {
  const res = await api.post(`/surveys/${surveyId}/questions`, payload);
  return unwrap(res);
};

export const updateSurveyQuestion = async (questionId, payload) => {
  const res = await api.put(`/surveys/questions/${questionId}`, payload);
  return unwrap(res);
};

export const deleteSurveyQuestion = async (questionId) => {
  const res = await api.delete(`/surveys/questions/${questionId}`);
  return unwrap(res);
};

export const getQuestionsBySurvey = async (surveyId) => {
  const res = await api.get(`/surveys/${surveyId}/questions`);
  return unwrap(res);
};

// ====================== RESPONSES ======================

export const submitSurveyResponse = async (payload) => {
  const res = await api.post(`/surveys/responses`, payload);
  return unwrap(res);
};

export const updateSurveyResponse = async (responseId, payload) => {
  const res = await api.put(`/surveys/responses/${responseId}`, payload);
  return unwrap(res);
};

export const getResponsesBySurvey = async (surveyId) => {
  const res = await api.get(`/surveys/${surveyId}/responses`);
  return unwrap(res);
};

export const getResponsesByStudent = async (studentId) => {
  const res = await api.get(`/surveys/responses/student/${studentId}`);
  return unwrap(res);
};

export const getSurveyResponsesByCourse = async (courseId) => {
    const res = await api.get(`/surveys/responses/course/${courseId}`);
    return unwrap(res);
}

export const checkIfUserHasEvaluated = async (courseId) => {
    const res = await api.get(`/surveys/course/${courseId}/has-evaluated`);
    return unwrap(res);
}

// ====================== STATISTICS ======================

export const getSurveyStatistics = async (surveyId) => {
  const res = await api.get(`/surveys/${surveyId}/statistics`);
  return unwrap(res);
};

export const getSurveyStatisticsByClass = async (surveyId, classId) => {
  const res = await api.get(`/surveys/${surveyId}/statistics/class/${classId}`);
  return unwrap(res);
};

export const listAllSurveys = async () => {
  try {
    const activeSurveys = await listSurveys(true);
    const inactiveSurveys = await listSurveys(false);
    const all = [
      ...(Array.isArray(activeSurveys) ? activeSurveys : []),
      ...(Array.isArray(inactiveSurveys) ? inactiveSurveys : [])
    ];
    return all;
  } catch (error) {
    console.error("Failed to list all surveys:", error);
    return [];
  }
};
