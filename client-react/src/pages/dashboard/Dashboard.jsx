import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Row, Col, Typography, Card, Grid, Layout } from "antd";
import {
  CodeOutlined,
  DesktopOutlined,
  CheckSquareOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import QuizSessionsModal from "../../components/modal/QuizSessionsModal";
import DashboardScoreModal from "../../components/modal/DashboardScoreModal";


const { Title, Paragraph } = Typography;
const { Content } = Layout;

const features = [
  {
    key: "lms",
    icon: <CodeOutlined />,
    title: "LMS",
    desc: "Nền tảng quản lý học tập trực tuyến giúp tổ chức, theo dõi, và đánh giá các khóa học và tài liệu học tập",
  },
  {
    key: "elearning",
    icon: <DesktopOutlined />,
    title: "E-Learning",
    desc: "Phương pháp học tập trực tuyến qua thiết bị điện tử, linh hoạt và tiện lợi cho người học",
  },
  {
    key: "quiz",
    icon: <CheckSquareOutlined />,
    title: "Bài kiểm tra",
    desc: "Các bài kiểm tra thiết kế để đánh giá trình độ và hiệu quả học của người học trong một lĩnh vực cụ thể",
  },
  {
    key: "training",
    icon: <GlobalOutlined />,
    title: "Quản lý môn học",
    desc: "Công cụ tạo và quản lý các bài kiểm tra, giúp giáo viên đánh giá kiến thức của học sinh nhanh chóng",
  },
];

export default function Dashboard() {
  const [openQuizModal, setOpenQuizModal] = useState(false);
  const [scoreModal, setScoreModal] = useState({ open: false, score: 0 });

  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const screens = Grid.useBreakpoint();

  const hasHandledModal = useRef(false);

  useEffect(() => {
    const state = location.state;
    if (state?.showScoreModal && !hasHandledModal.current) {
      hasHandledModal.current = true;
      setScoreModal({ open: true, score: state.score ?? 100 });
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleCardClick = (key) => {
    if (key === "quiz") setOpenQuizModal(true);
    else if (key === "elearning") navigate("/elearning");
    else if (key === "training") navigate("/qlmh");
    else if (key === "lms") navigate("/lms");
  };

  const styles = {
    dashWrap: {
      maxWidth: "1400px",
      margin: screens.md ? "76px auto 80px" : "48px auto 64px",
      padding: screens.xs ? "0 16px" : "0 24px",
    },
    hero: {
      position: "relative",
      minHeight: "200px",
      padding: screens.md ? "48px 56px" : "32px 24px",
      marginBottom: "32px",
      overflow: screens.sm ? "visible" : "hidden",
      display: "flex",
      alignItems: "center",
      flexDirection: screens.sm ? "row" : "column",
      borderRadius: "28px",
      background: "#fafafaff",
      textAlign: screens.sm ? "left" : "center",
    },
    heroLeft: {
      position: "relative",
      zIndex: 1,
      maxWidth: screens.sm ? "52%" : "100%",
      marginBottom: screens.sm ? 0 : "24px",
    },
    heroTitle: {
      margin: "0 0 10px",
      fontSize: screens.md ? "48px" : "32px",
      lineHeight: "1.1",
      fontWeight: 700,
    },
    heroSub: {
      margin: 0,
      color: "#666",
      fontSize: screens.md ? "18px" : "16px",
    },
    heroRight: {
      position: screens.sm ? "absolute" : "relative",
      right: screens.sm ? 0 : "auto",
      bottom: screens.sm ? "-45px" : "auto",
      zIndex: 1,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    },
    heroImg: {
      width: screens.md ? "270px" : "220px",
      height: "auto",
      transform: screens.sm ? "translateY(-44px)" : "none",
      display: "block",
      pointerEvents: "none",
      marginTop: screens.sm ? 0 : "-20px",
    },
    sectionTitle: {
      textAlign: "center",
      margin: screens.md ? "40px 0 24px" : "32px 0 24px",
      fontSize: screens.md ? "36px" : "28px",
      fontWeight: 700,
    },
    featureCard: {
      background: "#FAFAFA",
      borderRadius: "20px",
      boxShadow: "0 4px 16px rgba(17, 17, 17, 0.04)",
      padding: screens.md ? "20px" : "16px",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      cursor: "pointer",
      transition: "transform .15s ease, box-shadow .15s ease",
    },
    featureCardHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 24px rgba(17,17,17,.06)",
    },
    featureIcon: {
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      background: "#FFF7F4",
      color: "#F37142",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "22px",
      marginBottom: "14px",
    },
    featureText: { display: "flex", flexDirection: "column", gap: "6px" },
    featureTitle: {
      fontSize: screens.md ? "32px" : "24px",
      fontWeight: 700,
    },
    featureDesc: {
      color: "#666",
      fontSize: screens.md ? "18px" : "16px",
      lineHeight: "1.55",
    },
  };

  return (
    <Layout>
      
      <Content>
        <div style={styles.dashWrap}>
          {/* Hero section với animation đặc sắc */}
          <motion.section
            style={styles.hero}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              style={styles.heroLeft}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Title level={1} style={styles.heroTitle}>
                  Xin chào, {user?.lastName || "Người dùng"}
                </Title>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Paragraph style={styles.heroSub}>
                  Cùng khám phá kho tàng kiến thức bất tận cùng bộ tài liệu độc
                  quyền với Rikkei Education nhé!
                </Paragraph>
              </motion.div>
            </motion.div>
            <motion.div
              style={styles.heroRight}
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                ease: "easeOut",
                type: "spring",
                stiffness: 100,
              }}
            >
              <img
                src="/images/hero-student.png"
                alt="Student"
                style={styles.heroImg}
              />
            </motion.div>
          </motion.section>

          {/* Title với animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Title level={2} style={styles.sectionTitle}>
              Hệ thống học tập
            </Title>
          </motion.div>

          <Row gutter={[24, 24]}>
            {features.map((f, index) => (
              <Col key={f.key} xs={24} sm={12} lg={12}>
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: 1 + index * 0.15,
                    ease: "easeOut",
                    type: "spring",
                    stiffness: 100,
                  }}
                  whileHover={{
                    scale: 1.03,
                    y: -8,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Card
                    bordered={false}
                    style={styles.featureCard}
                    onClick={() => handleCardClick(f.key)}
                    onMouseEnter={(e) =>
                      Object.assign(
                        e.currentTarget.style,
                        styles.featureCardHover
                      )
                    }
                    onMouseLeave={(e) =>
                      Object.assign(e.currentTarget.style, {
                        transform: "",
                        boxShadow: "0 4px 16px rgba(17, 17, 17, 0.04)",
                      })
                    }
                  >
                    <motion.div
                      style={styles.featureIcon}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 1.1 + index * 0.15,
                        type: "spring",
                        stiffness: 150,
                      }}
                      whileHover={{ rotate: 360, scale: 1.1 }}
                    >
                      {f.icon}
                    </motion.div>
                    <div style={styles.featureText}>
                      <motion.div
                        style={styles.featureTitle}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 1.2 + index * 0.15,
                        }}
                      >
                        {f.title}
                      </motion.div>
                      <motion.div
                        style={styles.featureDesc}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.5,
                          delay: 1.3 + index * 0.15,
                        }}
                      >
                        {f.desc}
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>

          <QuizSessionsModal
            open={openQuizModal}
            onClose={() => setOpenQuizModal(false)}
          />

          <DashboardScoreModal
            open={scoreModal.open}
            score={scoreModal.score}
            onClose={() => setScoreModal((s) => ({ ...s, open: false }))}
          />
        </div>
      </Content>
    </Layout>
  );
}
