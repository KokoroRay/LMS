import api from '../config';

// Lấy điểm của sinh viên
export const getStudentGrades = (studentId) => {
  return api.get(`/grades/student/${studentId}`);
};

// Lấy điểm của lớp
export const getClassGrades = (classId) => {
  return api.get(`/grades/class/${classId}`);
};

/**
 * ⭐ THÊM MỚI: Cập nhật điểm exam cho sinh viên học lại
 * @param {number} studentId - ID sinh viên
 * @param {number} classId - ID lớp
 * @param {number} courseId - ID khóa học
 * @param {number} examScore - Điểm exam mới (0-10)
 */
export const updateExamScoreForReEnrollment = (studentId, classId, courseId, examScore) => {
  return api.put('/grades/reenrollment/update-exam-score', null, {
    params: {
      studentId,
      classId,
      courseId,
      examScore
    }
  });
};

export default {
  getStudentGrades,
  getClassGrades,
  updateExamScoreForReEnrollment
};