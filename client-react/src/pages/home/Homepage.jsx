// src/pages/home/HomePage.jsx
import { useState, useEffect } from "react";
import CourseCardGrid from "../../components/course/course.card";
import CarouselHome from "../../layouts/CarouselHome";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../../styles/global.css";
import { getPublishedCourses } from "../../services/subjectService";
import { message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { listAllSurveys, getSurveyStatistics } from "../../services/courseServey";

// Helper tách số rating từ key của optionCounts
const extractRating = (rawOption) => {
  if (rawOption == null) return 0;

  // VD: "4.5 | Comment: tốt" -> "4.5"
  const numStr = String(rawOption).split("|")[0].trim();

  // Phòng khi dùng dấu phẩy thập phân "4,5"
  const normalized = numStr.replace(",", ".");

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
};

// Helper to calculate average rating from optionCounts
const calculateAverage = (optionCounts) => {
  if (!optionCounts || typeof optionCounts !== "object") return 0;

  let totalScore = 0;
  let totalVotes = 0;

  for (const [option, count] of Object.entries(optionCounts || {})) {
    const rating = extractRating(option);
    const c = Number(count) || 0;

    totalScore += rating * c;
    totalVotes += c;
  }

  return totalVotes > 0 ? totalScore / totalVotes : 0;
};



const HomePage = ({ searchTerm }) => {
  const [allData, setAllData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadMore, setLoadMore] = useState(6);
  const [isWaiting, setIsWaiting] = useState(false);
  const navigate = useNavigate();

  const mapCourseData = (data, surveyAverages) => {
    return data.map((course) => ({
      id: course.courseId,
      level: course.level || "Beginner",
      title: course.title || "Untitled Course",
      shortDescription: course.shortDescription || "Loading...",
      image: course.thumbnailUrl || "/images/Image 2.svg",
      avgScore: surveyAverages[course.courseId] || 0,
    }));
  };

  const loadCourse = async (query) => {
    setLoading(true);
    try {
      // 1. Fetch surveys and courses in parallel
      const [courseData, allSurveys] = await Promise.all([
        getPublishedCourses(query),
        listAllSurveys()
      ]);

      // 2. Fetch statistics for all surveys
      const reportPromises = allSurveys.map(async (survey) => {
        try {
          const stats = await getSurveyStatistics(survey.surveyId);
          const ratingStats = (stats || []).filter(s => s.questionType === 'RATING' && s.totalResponses > 0);
          let surveyAverage = 0;
          if (ratingStats.length > 0) {
              const avgRatings = ratingStats.map(stat => calculateAverage(stat.optionCounts));
              surveyAverage = avgRatings.reduce((sum, avg) => sum + avg, 0) / avgRatings.length;
          }
          return { courseId: survey.courseId, avgScore: surveyAverage };
        } catch (error) { 
          return { courseId: survey.courseId, avgScore: 0 };
        }
      });

      const settledReports = (await Promise.all(reportPromises)).filter(r => r && r.avgScore > 0);

      // 3. Calculate average score per courseId
      const courseAverages = settledReports.reduce((acc, report) => {
        if (!acc[report.courseId]) {
          acc[report.courseId] = { total: 0, count: 0 };
        }
        acc[report.courseId].total += report.avgScore;
        acc[report.courseId].count += 1;
        return acc;
      }, {});

      const finalAverages = Object.keys(courseAverages).reduce((acc, courseId) => {
        acc[courseId] = courseAverages[courseId].total / courseAverages[courseId].count;
        return acc;
      }, {});

      // 4. Map course data with final average scores
      const mappedCourses = mapCourseData(courseData, finalAverages);

      if (query) {
        setCourses(mappedCourses);
        setAllData([]);
      } else {
        setAllData(mappedCourses);
        setCourses(mappedCourses.slice(0, loadMore));
      }
    } catch (error) {
      message.error("Không thể tải danh sách khóa học hoặc dữ liệu đánh giá");
      setCourses([]);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm) {
        setLoadMore(6); 
      }
      loadCourse(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!searchTerm && allData.length > 0) {
      setCourses(allData.slice(0, loadMore));
    }
  }, [loadMore, allData, searchTerm]);


  const handleCardClick = (course_id) => {
    navigate(`/lesson/${course_id}`);
  };

  const handleShowMoreItems = () => {
    if (isWaiting) return;
    setIsWaiting(true);
    setTimeout(() => {
      setLoadMore((prev) => prev + 3);
      setIsWaiting(false);
    }, 500);
  };

  const hasMore = !searchTerm && allData.length > courses.length;

  return (
    <>
      {/* Carousel với animation */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <CarouselHome />
      </motion.div>
      
      {/* Title với animation đặc sắc */}
      <motion.h1
        style={{ fontSize: 35, textAlign: "center", margin: "24px 0" }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: 0.3,
          type: "spring",
          stiffness: 100,
        }}
      >
        Tất Cả Môn Học
      </motion.h1>

      <CourseCardGrid
        courses={courses}
        onCardClick={handleCardClick}
        loading={loading}
      />

      {hasMore && (
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <button
            type="button"
            onClick={handleShowMoreItems}
            disabled={isWaiting || loading}
            style={{
              padding: "10px 24px",
              fontSize: "16px",
              fontWeight: 600,
              backgroundColor: isWaiting ? "#ff8a58" : "#ff5d18ff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isWaiting ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isWaiting ? "Loading" : "Load More"}
            {isWaiting && (
              <LoadingOutlined style={{ fontSize: 18, color: "white" }} spin />
            )}
          </button>
        </div>
      )}

      {!hasMore && courses.length > 0 && !loading && (
        <p style={{ textAlign: "center", color: "#999", margin: "20px 0" }}>
          {searchTerm ? 'Đã hiển thị tất cả kết quả tìm kiếm' : 'Đã hiển thị tất cả khóa học'}
        </p>
      )}

      {!loading && courses.length === 0 && (
        <p style={{ textAlign: "center", color: "#999", margin: "20px 0" }}>
          Không tìm thấy khóa học nào phù hợp.
        </p>
      )}
    </>
  );
};

export default HomePage;

