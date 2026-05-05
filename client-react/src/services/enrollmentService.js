import api from "./authService";

const ENROLLMENT_PATH = "/classes"; 
const STUDENT_PATH = "/admin/students"; // This path seems unused in this file, but I'll keep it as is.

export const getStudentsByClass = (classId) => 
    api.get(`${ENROLLMENT_PATH}/${classId}/students`)
       .then(res => res.data); 

export const addStudentToClass = (classId, studentId) => 
    api.post(`${ENROLLMENT_PATH}/${classId}/students`, null, { 
        params: { studentId } 
    }).then(res => res.data);

export const removeStudentFromClass = (classId, studentId) => 
    api.delete(`${ENROLLMENT_PATH}/${classId}/students/${studentId}`)
       .then(res => res.data);

export const updateStudentProgress = (classId, studentId, data) => 
    api.patch(`${ENROLLMENT_PATH}/${classId}/students/${studentId}`, null, {
        params: { 
            progress: data.progress, 
            status: data.status 
        }
    }).then(res => res.data);

export const bulkAddStudentsToClassAPI = (classId, studentIds) => 
    api.post(`${ENROLLMENT_PATH}/${classId}/students/bulk`, studentIds)
       .then(res => res.data);

// New function to check enrollment status for a course
export const checkEnrollmentStatus = (courseId) => {
    return api.get(`/courses/${courseId}/is-enrolled`);
};