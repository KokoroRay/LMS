import api from "./authService";

const unwrap = (r) => r?.data?.data ?? r?.data ?? r;
const JSON_HEADER = { "Content-Type": "application/json" };

const API_LESSONS = "/lessons";
const API_QUESTION_BANK = "/question-bank";

/* -------- NORMALIZE -------- */
export const normalizeLessonQuestion = (it, idx = 0) => {
  const normalizedItem = {
    lessonQuestionId: it?.lessonQuestionId ?? it?.id ?? null,
    questionId: it?.question?.questionId ?? it?.questionId ?? it?.id ?? null,
    orderIndex: it?.orderIndex ?? it?.position ?? idx,
    isRequired: typeof it?.isRequired === "boolean" ? it.isRequired : true,
    questionText:
      it?.question?.questionText ?? it?.questionText ?? `Quiz #${idx + 1}`,
    question: it?.question ?? null,
  };
  return normalizedItem;
};

/* -------- GET QUESTIONS BY LESSON -------- */
export const listQuestionsByLesson = async (lessonId) => {
  const res = await api.get(`${API_LESSONS}/${lessonId}/questions`);
  const raw = unwrap(res) || [];
  return Array.isArray(raw)
    ? raw.map((it, idx) => normalizeLessonQuestion(it, idx))
    : [];
};

/* -------- PARSE choices/correctAnswer -------- */
export const parseQuestionChoices = (raw) => {
  const safeParse = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const arr = JSON.parse(val);
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  return {
    choices: safeParse(raw?.choices),
    correct: safeParse(raw?.correctAnswer),
  };
};

/* -------- QUESTION BANK: GET ONE -------- */
export const getQuestionBankById = async (questionId) => {
  const res = await api.get(`${API_QUESTION_BANK}/${questionId}`);
  return unwrap(res);
};

/* -------- QUESTION BANK: CREATE -------- */
export const createNewQuestionInQuestionBank = async (payload) => {
  const toJsonString = (arr) =>
    JSON.stringify(
      (Array.isArray(arr) ? arr : [])
        .map((s) => String(s ?? "").trim())
        .filter(Boolean)
    );

  const body = {
    questionText: String(payload.questionText ?? "").trim(),
    questionType: payload.questionType || "MCQ",
    difficulty: payload.difficulty || "EASY",
    points: Number(payload.points ?? 1),
    choices: toJsonString(payload.choices),
    correctAnswer: toJsonString(payload.correctAnswer),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.createdBy ? { createdBy: Number(payload.createdBy) } : {}),
    ...(Array.isArray(payload.tagIds) ? { tagIds: payload.tagIds } : {}),
    ...(payload.explanation
      ? { explanation: String(payload.explanation) }
      : {}),
  };

  const res = await api.post(API_QUESTION_BANK, body, { headers: JSON_HEADER });
  return unwrap(res);
};

/* -------- QUESTION BANK: UPDATE -------- */
export const updateQuestionInQuestionBank = async (questionId, payload) => {
  const toJsonString = (arr) =>
    JSON.stringify(
      (Array.isArray(arr) ? arr : [])
        .map((s) => String(s ?? "").trim())
        .filter(Boolean)
    );
  const body = {
    questionText: String(payload.questionText ?? "").trim(),
    questionType: payload.questionType || "MCQ",
    difficulty: payload.difficulty || "EASY",
    points: Number(payload.points ?? 1),
    choices: toJsonString(payload.choices),
    correctAnswer: toJsonString(payload.correctAnswer),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.explanation
      ? { explanation: String(payload.explanation) }
      : {}),
  };
  const res = await api.put(`${API_QUESTION_BANK}/${questionId}`, body, {
    headers: JSON_HEADER,
  });
  return unwrap(res);
};

/* -------- LESSON QUESTIONS -------- */
export const addQuestionToLesson = async (lessonId, body) => {
  // body: { questionId, orderIndex, isRequired, addedBy }
  const res = await api.post(`${API_LESSONS}/${lessonId}/questions`, body, {
    headers: JSON_HEADER,
  });
  return unwrap(res);
};

export const addNewCustomQuestionsToLesson = async (lessonId, dto) => {
  // body: { lessonId, questionIds, addedBy }
  const res = await api.post(
    `${API_LESSONS}/${lessonId}/questions/batch`,
    {
      lessonId: Number(lessonId),
      questionIds: Array.isArray(dto?.questionIds) ? dto.questionIds : [],
      addedBy: Number(dto?.addedBy ?? 1),
    },
    { headers: JSON_HEADER }
  );
  return unwrap(res);
};

export const updateQuestionOrder = async (lessonQuestionId, newOrder) => {
  const params = new URLSearchParams({ newOrder });
  const res = await api.put(
    `${API_LESSONS}/questions/${lessonQuestionId}/order?${params.toString()}`
  );
  return unwrap(res);
};

export const updateLessonQuestionDetails = async (lessonQuestionId, isRequired) => {
  const params = new URLSearchParams({ isRequired });
  const res = await api.put(
    `${API_LESSONS}/questions/${lessonQuestionId}/details?${params.toString()}`
  );
  return unwrap(res);
};

export const removeQuestionFromLesson = async (lessonId, questionIdOrObj) => {
  // chấp nhận truyền object quiz hoặc id
  const qid =
    typeof questionIdOrObj === "object"
      ? questionIdOrObj?.question?.questionId ?? questionIdOrObj?.questionId
      : questionIdOrObj;
  if (!qid) throw new Error("Missing questionId to remove from lesson");
  const res = await api.delete(
    `${API_LESSONS}/${lessonId}/questions/${qid}?questionId=${qid}`
  );
  return unwrap(res);
};

export const countQuestionsInLesson = async (lessonId) => {
  const res = await api.get(
    `${API_LESSONS}/${lessonId}/questions/count?lessonId=${lessonId}`
  );
  const data = unwrap(res);
  return typeof data === "number" ? data : Number(data?.count ?? 0);
};

export const saveQuizAttempt = async (lessonId, attemptData) => {
  const res = await api.post(
    `/lessons/${lessonId}/questions/submit-and-save`,
    attemptData,
    {
      headers: JSON_HEADER,
    }
  );
  return unwrap(res);
};

export const getQuizAttemptHistory = async (lessonId, attemptNumber) => {
  try {
    const params = new URLSearchParams();
    if (attemptNumber) {
      params.append('attemptNumber', attemptNumber);
    }
    const res = await api.get(`/lessons/${lessonId}/attempts?${params.toString()}`);
    return unwrap(res);
  } catch (error) {
    if (error?.response?.status === 404) {
      return []; // Return empty array if no history found
    }
    console.error(`Error fetching quiz attempt history for lesson ${lessonId}:`, error);
    throw error;
  }
};
