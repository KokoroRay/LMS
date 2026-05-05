// src/services/studentService.js
import api from "./authService";

/**
 * Lấy thông tin student hiện tại (bao gồm profile)
 */
export const getCurrentStudent = async () => {
  const res = await api.get("/auth/profile");
  const user = res?.data?.data;
  
  // Debug: Log để kiểm tra structure
  // Raw user data
  
  return user;
};


export const updateStudentProfile = async ({ data, avatar }) => {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data || {}));
  if (avatar) fd.append("avatar", avatar);
  
  try {
    const res = await api.put("/auth/profile", fd);
    console.log("API Response:", res);
    const updated = res?.data?.data;
    console.log("Extracted updated user data:", updated);
    return updated;
  } catch (error) {
    console.error("Error in updateStudentProfile:", error.response || error);
    throw error; // Re-throw the error so the calling function can catch it
  }
};

/**
 * Đổi mật khẩu
 */
export const changeStudentPassword = async (passwords) => {
  const fd = new FormData();
  fd.append("currentPassword", passwords.currentPassword);
  fd.append("newPassword", passwords.newPassword);
  fd.append("confirmPassword", passwords.confirmPassword);
  
  return api.put("/auth/change-password", fd);
};

/**
 * Helper: Lấy studentCode từ user object với nhiều fallback
 */
export const extractStudentCode = (user) => {
  if (!user) return null;
  
  // Direct field
  if (user.studentCode) return user.studentCode;
  
  // Nested in profile/userProfile
  if (user.profile?.studentCode) return user.profile.studentCode;
  if (user.userProfile?.studentCode) return user.userProfile.studentCode;
  
  // Other possible fields
  if (user.student_code) return user.student_code;
  if (user.profileDTO?.studentCode) return user.profileDTO.studentCode;
  
  return null;
};

/**
 * Helper: Lấy className từ user object
 */
export const extractClassName = (user) => {
  if (!user) return null;
  
  // Direct field
  if (user.className) return user.className;
  
  // Nested in profile
  if (user.profile?.className) return user.profile.className;
  if (user.userProfile?.className) return user.userProfile.className;
  
  // Other possible fields
  if (user.class_name) return user.class_name;
  
  return null;
};

export default {
  getCurrentStudent,
  updateStudentProfile,
  changeStudentPassword,
  extractStudentCode,
  extractClassName,
};