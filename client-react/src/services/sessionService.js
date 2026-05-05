import api from "./authService";

const unwrap = (res) => (res?.data?.data ?? res?.data ?? res);

export const listSessions = async () => {
  const token = localStorage.getItem('access_token');
  console.log('🔥 listSessions called - Token:', token ? 'EXISTS' : 'MISSING');
  console.trace('🔥 Call stack trace:');
  
  if (!token) {
    console.error('🚫 BLOCKED listSessions - No token available');
    throw new Error('Authentication required - no token available');
  }
  
  const res = await api.get("/sessions");
  return unwrap(res); // => [{ sessionId, name, courseId, ...? }]
};

export const getSessionById = async (id) => {
  const res = await api.get(`/sessions/${id}`);
  return unwrap(res);
};

export const listSessionsByCourse = async (courseId) => {
  const res = await api.get(`/sessions/course/${courseId}`);
  return unwrap(res);
};

// BE expects SessionRequestDTO { title, courseId, position }
export const createSession = async ({ courseId, title, position = 0 }) => {
  const payload = { courseId, title, position };
  const res = await api.post("/sessions", payload);
  return unwrap(res);
};

export const updateSession = async (id, { courseId, title, position = 0 }) => {
  const payload = { courseId, title, position };
  const res = await api.put(`/sessions/${id}`, payload);
  return unwrap(res);
};

export const deleteSession = async (id) => {
  const res = await api.delete(`/sessions/${id}`);
  return unwrap(res);
};
