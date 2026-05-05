import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";


import { fetchMe } from "../redux/api/slices/authSlice";
import LoginPage from "../pages/auth/LoginPage";
import ChangePasswordModal from "../components/modal/ChangePasswordModal";
import Dashboard from "../pages/dashboard/Dashboard";
import Profile from "../pages/profile/Profile";
import TeacherProfile from "../pages/profile/TeacherProfile";
import EleaningPage from "../pages/home/Homepage";
import BlogPage from "../pages/blog/BlogPage";
import BlogDetail from "../pages/blog/BlogDetail";
import Lesson from "../pages/lesson/Lesson";
import LmsDashboard from "../pages/lms/lmsDashboard";

import InstructorLayout from "../layouts/instructor/InstructorLayout";
import TakeQuizPage from "../pages/instructor/assignment/exam/TakeQuizPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";

import ForumTopicPage from "../pages/forum/ForumTopicPage";
import ForumTopicDetail from "../components/forum/ForumTopicDetail";
import NewTopicPage from "../components/forum/NewTopicPage";



import MyLeaveRequestsPage from "../pages/qlmh/MyLeaveRequestsPage";
import LessonProgressPage from "../pages/qlmh/LessonProgressPage";
import CertificatePage from "../pages/qlmh/MyCertificatePage";
import QlmhLayout from "../layouts/QlmhLayout";
import StudentOverview from "../pages/qlmh/StudentOverview";
import CheckPointPage from "../pages/qlmh/CheckPointPage";
import AttendancePage from "../pages/qlmh/AttendancePage";
import ReEnrollmentPage from "../pages/qlmh/ReEnrollmentPage";

import AdminCertificatePage from "../pages/admin/activities/AdminCertificatePage";
import AdminTimeTableManage from "../pages/admin/activities/AdminTimeTableManage";
import AdminReportPage from "../pages/admin/report/AdminReportPage";
import ForumPostsPage from "../pages/admin/blogpost/ForumPostsPage";

import PaymentCallbackPage from "../pages/qlmh/PaymentCallbackPage";
import PaymentSuccessPage from "../pages/qlmh/PaymentSuccessPage";
import PaymentFailurePage from "../pages/qlmh/PaymentFailurePage";
import AdminDashBoard from "../pages/admin/AdminDashBoard";
import AdminLayout from "../layouts/admin/AdminLayout";
import StudentPage from "../pages/admin/users&role/StudentManage";
import InstructorListPage from "../pages/admin/users&role/InstructorManage";

import ClassesPage from "../pages/admin/academy/ClassesManage";
import CourseManege from "../pages/admin/academy/SubjectManageAdmin";
import CategoriesManage from "../pages/admin/academy/CategoriesManage";
import AdminEnrollManage from "../pages/admin/activities/EnrollmentClassManage";
import CourseEvaluationManagement from "../pages/admin/evaluation/CourseEvaluationManagement";

import SubjectManagementInstructors from "../pages/instructor/teaching/SubjectManageInstructors";
import DetailSubjectManageInstructor from "../pages/instructor/teaching/DetailSubjectManageInstructor";
import AssignmentLession from "../pages/instructor/assignment/AssignmentLession";
import LeaveManagementPage from "../pages/instructor/teaching/LeaveManagementPage";
import InstructorTimetablePage from "../pages/instructor/teaching/InstructorTimetablePage";
import AssignmentGradePage from "../pages/instructor/assignment/AssignmentGradePage";
import InstructorExamsPage from "../pages/instructor/assignment/exam/InstructorExamsPage";
import LessonsManage from "../pages/instructor/teaching/LessonsPages";
import InstructorDashboard from "../pages/instructor/InstructorDashboard";
import InstructorSubmissionsPage from "../pages/instructor/assignment/exam/InstructorSubmissionsPage";
import InstructorPostsPage from "../pages/instructor/blogpost/InstructorPostsPage";
import InstructorGradesPage from "../pages/instructor/assignment/exam/InstructorGradesPage";
import InstructorExamForm from "../pages/instructor/assignment/exam/InstructorExamForm";
import AdminPaymentsPage from "../pages/admin/AdminPaymentsPage";
import PaymentHistoryPage from "../pages/qlmh/PaymentHistoryPage";

function Spinner() {
  return null;
}
function useAuthBootstrap() {
  const dispatch = useDispatch();
  const { user, token, loading, isAuthenticated, needChangePassword } =
    useSelector((s) => s.auth);

  useEffect(() => {
    if (token && !user && !loading) {
      dispatch(fetchMe());
    }
  }, [token, user, loading, dispatch]);

  return { user, token, loading, isAuthenticated, needChangePassword };
}
function RequireAuth({ children, roles }) {
  const { user, token, loading, isAuthenticated } = useAuthBootstrap();

  if (loading || (!user && token)) {
    return <Spinner />;
  }

  if (!user || !token || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles?.length) {
    const rawRole = user.role?.roleName || user.roleName;
    const userRole = rawRole?.replace("ROLE_", "").toUpperCase();
    const requiredRoles = roles.map((r) => r.toUpperCase());

    if (!userRole || !requiredRoles.includes(userRole)) {
      let fallbackPath = "/dashboard";
      if (userRole === "ADMIN") {
        fallbackPath = "/admin";
      } else if (userRole === "MODERATOR") {
        fallbackPath = "/instructor";
      }
      return <Navigate to={fallbackPath} replace />;
    }
  }
  return children;
}

function RedirectIfAuthed({ children }) {
  const { user, isAuthenticated, needChangePassword } = useAuthBootstrap();

  if (user && isAuthenticated && !needChangePassword) {
    const rawRole = user.role?.roleName || user.roleName;
    const roleName = rawRole?.replace("ROLE_", "").toUpperCase();

    let targetPath = "/dashboard";
    if (roleName === "ADMIN") {
      targetPath = "/admin";
    } else if (roleName === "MODERATOR") {
      targetPath = "/instructor";
    }
    return <Navigate to={targetPath} replace />;
  }

  return children;
}

export default function AppRoutes({ searchTerm }) {
  const { needChangePassword, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  return (
    <>
      <ChangePasswordModal
        visible={needChangePassword && isAuthenticated}
        forceChange={true}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/elearning"
          element={
            <RequireAuth roles={["Student", "USER"]}>
              <EleaningPage searchTerm={searchTerm} />
            </RequireAuth>
          }
        />
        <Route
          path="/blog"
          element={
            <RequireAuth roles={["Student", "USER"]}>
              <BlogPage />
            </RequireAuth>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <RequireAuth roles={["Student", "USER"]}>
              <BlogDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/forum/*"
          element={
            <RequireAuth>
              <Routes>
                <Route path="topics/new" element={<NewTopicPage />} />

                <Route path="topics/:topicId" element={<ForumTopicDetail />} />

                <Route index element={<ForumTopicPage />} />

                <Route path="*" element={<div>Forum Page Not Found</div>} />
              </Routes>
            </RequireAuth>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/lms"
          element={
            <RequireAuth roles={["Student", "USER"]}>
              <LmsDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth roles={["USER"]}>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/teacher"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <TeacherProfile />
              </InstructorLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/lesson/:courseId/:lessonId/:type"
          element={
            <RequireAuth>
              <Lesson />
            </RequireAuth>
          }
        />

        <Route
          path="/lesson/:courseId"
          element={
            <RequireAuth>
              <Lesson />
            </RequireAuth>
          }
        />

        <Route
          path="/quiz/:sessionId"
          element={
            <RequireAuth>
              <TakeQuizPage />
            </RequireAuth>
          }
        />

        <Route
          path="/leave"
          element={
            <RequireAuth roles={["USER", "MODERATOR"]}>
              <MyLeaveRequestsPage />
            </RequireAuth>
          }
        />

        {/* --- ADMIN ROUTES --- */}
        <Route
          path="/admin"
          element={
            <RequireAuth roles={["ADMIN"]}>
              <AdminLayout>
                <AdminDashBoard />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/post"
          element={
            <RequireAuth roles={["ADMIN"]}>
              <AdminLayout>
                <ForumPostsPage />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/student"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <StudentPage />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/instructors"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <InstructorListPage />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <ClassesPage />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/admin-courses"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <CourseManege />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/admin-categories"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <CategoriesManage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/admin-timetable"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <AdminTimeTableManage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/admin-enrollments"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <AdminEnrollManage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/admin-certificates"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <AdminCertificatePage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="admin/admin-evaluation"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <CourseEvaluationManagement />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/admin-reports"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <AdminReportPage />
              </AdminLayout>
            </RequireAuth>
          }
        />
        
        {/* ===== ADMIN PAYMENTS ROUTE ===== */}
        <Route
          path="/admin/payments"
          element={
            <RequireAuth roles={["Admin"]}>
              <AdminLayout>
                <AdminPaymentsPage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        {/* --- INSTRUCTOR ROUTES --- */}
        <Route
          path="/instructor"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <InstructorDashboard />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/assignments"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <AssignmentLession />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/courses-list"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <SubjectManagementInstructors />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/my-articles"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <InstructorPostsPage />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/my-lessons"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <LessonsManage />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/my-timetable"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <InstructorTimetablePage />
              </InstructorLayout>
            </RequireAuth>
          }
        />
       
        <Route
          path="/instructor/don-xin-nghi"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <LeaveManagementPage />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/exams"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <InstructorExamsPage />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/exams/new"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <InstructorExamForm />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/exams/edit/:examId"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <InstructorExamForm />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/submissions"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <InstructorSubmissionsPage />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/submissions/:resultId"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <InstructorGradesPage />
              </InstructorLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/instructor/course/:courseId/structure"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <DetailSubjectManageInstructor />
              </InstructorLayout>
            </RequireAuth>
          }
        />

        {/* --- CÁC ROUTES CỦA SINH VIÊN --- */}

        <Route
          path="/instructor/courses-manage"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <DetailSubjectManageInstructor />
              </InstructorLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/grade"
          element={
            <RequireAuth roles={["MODERATOR"]}>
              <InstructorLayout>
                <AssignmentGradePage />
              </InstructorLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/qlmh"
          element={
            <RequireAuth roles={["USER"]}>
              <QlmhLayout activeKey="overview" title="Tổng quan" />
            </RequireAuth>
          }
        >
          <Route index element={<StudentOverview />} />
        </Route>

        <Route
          path="/qlmh/checkpoint"
          element={
            <RequireAuth roles={["USER"]}>
              <QlmhLayout activeKey="scores" title="Xem điểm" />
            </RequireAuth>
          }
        >
          <Route index element={<CheckPointPage />} />
        </Route>

        <Route
          path="/qlmh/certificates"
          element={
            <RequireAuth roles={["USER"]}>
              <QlmhLayout activeKey="certificates" title="Chứng chỉ" />
            </RequireAuth>
          }
        >
          <Route index element={<CertificatePage />} />
        </Route>

        <Route
          path="/qlmh/progress"
          element={
            <RequireAuth roles={["USER"]}>
              <QlmhLayout activeKey="progress" title="Tiến trình" />
            </RequireAuth>
          }
        >
          <Route index element={<LessonProgressPage />} />
        </Route>

        <Route
          path="/qlmh/attendance"
          element={
            <RequireAuth roles={["USER"]}>
              <QlmhLayout activeKey="attendance" title="Điểm danh" />
            </RequireAuth>
          }
        >
          <Route index element={<AttendancePage />} />
        </Route>

        <Route
          path="/qlmh/leave"
          element={
            <RequireAuth roles={["USER"]}>
              <QlmhLayout activeKey="leave" title="Đơn xin nghỉ" />
            </RequireAuth>
          }
        >
          <Route index element={<MyLeaveRequestsPage />} />
        </Route>

        <Route
          path="/qlmh/submit"
          element={
            <RequireAuth roles={["USER"]}>
              <QlmhLayout activeKey="submit" title="Đăng kí học lại" />
            </RequireAuth>
          }
        >
          <Route index element={<ReEnrollmentPage />} />
        </Route>

        {/* ===== PAYMENT HISTORY ROUTE - Lịch sử thanh toán ===== */}
        <Route
          path="/qlmh/payment-history"
          element={
            <RequireAuth roles={["USER"]}>
              <QlmhLayout activeKey="payment-history" title="Lịch sử thanh toán" />
            </RequireAuth>
          }
        >
          <Route index element={<PaymentHistoryPage />} />
        </Route>

        <Route
          path="/payment/callback"
          element={
            <RequireAuth roles={["USER"]}>
              <PaymentCallbackPage />
            </RequireAuth>
          }
        />

        <Route
          path="/payment/success"
          element={
            <RequireAuth roles={["USER"]}>
              <PaymentSuccessPage />
            </RequireAuth>
          }
        />

        <Route
          path="/payment/failure"
          element={
            <RequireAuth roles={["USER"]}>
              <PaymentFailurePage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
