import { useLocation } from "react-router-dom";
import Headers from "./layouts/Header";
import Footers from "./layouts/Footer";
import AppRoutes from "./routes/index.jsx";
import { Footer, Header } from "antd/es/layout/layout";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "./redux/api/slices/authSlice";

export default function App() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && !isAuthenticated) {
      dispatch(fetchMe())
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, [dispatch, isAuthenticated]);

  const pathsWithoutLayout = [
    "/qlmh",
    "/profile/teacher",
    "/checkpoint",
    "/certificates",
    "/progress",
    "/attendance",
    "/submit",
    "/tim",
    "/leave",
    "/login",
    "/debug",
    "/admin",
    "/admin/post",
    "/admin/users",
    "/admin/permissions",
    "/admin/roles",
    "/admin/student",
    "/admin/instructors",
    "/admin/admin-courses",
    "/admin/admin-categories",
    "/admin/evaluation",
    "/admin/activities/admin-timetable",
    "admin-evaluation",
    "/lms",
    "/instructor",
    "/instructor/dashboard",
    "/instructor/exams",
    "/instructor/submissions",
    "/instructor/grades",
    "/instructor/assignments",
    "/instructor/courses-list",
    "/instructor/courses-manage",
    "/instructor/my-classes",
    "/instructor/my-session",
    "/instructor/my-lessons",
    "/instructor/my-timetable",
    "/instructor/enrollments",
    "/instructor/grade"
  ];

  const showLayout = !pathsWithoutLayout.some((path) =>
    location.pathname.startsWith(path)
  );

  if (authLoading) {
    return <div>Loading authentication...</div>; // Or a proper spinner
  }

  return (
    <>
      {showLayout && (
        <Header>
          <Headers onSearch={setSearchTerm} />
        </Header>
      )}

      <AppRoutes searchTerm={searchTerm} />

      {showLayout && (
        <Footer style={{ padding: 0, background: "transparent" }}>
          <Footers />
        </Footer>
      )}
    </>
  );
}