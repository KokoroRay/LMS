import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Space,
  Tag,
  message,
  Spin,
  Empty,
  Button,
  Image,
  Tooltip,
  Input,
  Timeline,
  Divider,
} from "antd";
import {
  FolderOpenOutlined,
  BookOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
  SearchOutlined,
  TrophyOutlined,
  RocketOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { getAllCategories } from "../../services/CourseCategoryService";
import { getCoursesByCategoryId } from "../../services/subjectService";

import "../../styles/subject-roadmap.css";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const levelColorMap = {
  BEGINNER: "green",
  INTERMEDIATE: "blue",
  ADVANCED: "red",
  DEFAULT: "default"
};

const levelIconMap = {
  BEGINNER: <RocketOutlined />,
  INTERMEDIATE: <FireOutlined />,
  ADVANCED: <TrophyOutlined />,
};

const LmsDashboard = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  // Fetch all categories on component mount
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const categoriesData = await getAllCategories();
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
        setFilteredCategories(categoriesData);
      } else {
        setCategories([]);
        setFilteredCategories([]);
        message.error("Dữ liệu danh mục không hợp lệ.");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      message.error("Không thể tải danh mục khóa học.");
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Tìm kiếm category
  const handleSearch = (value) => {
    setSearchText(value);
    if (!value.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((cat) =>
        cat.name.toLowerCase().includes(value.toLowerCase()) ||
        cat.description?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  };

  // Handle clicking on a category card
  const handleSelectCategory = useCallback(async (category) => {
    if (selectedCategory?.categoryId === category.categoryId) {
      setSelectedCategory(null);
      setCourses([]);
      return;
    }

    setSelectedCategory(category);
    setLoadingCourses(true);
    setCourses([]); // Clear previous courses
    try {
      const coursesData = await getCoursesByCategoryId(category.categoryId);
      if (Array.isArray(coursesData)) {
        setCourses(coursesData);
      } else {
        setCourses([]);
        message.warning("Không có môn học nào trong danh mục này.");
      }
    } catch (error) {
      console.error(`Lỗi khi tải các môn học cho danh mục ${category.name}:`, error);
      message.error("Đã xảy ra lỗi khi tải các môn học.");
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, [selectedCategory]);

  const [showAllCategories, setShowAllCategories] = useState(false);

  const renderCategoryCard = (cat) => {
    const isActive = selectedCategory?.categoryId === cat.categoryId;
    const coursesCount = cat.courses?.length || 0;
    
    return (
      <Card
        hoverable
        onClick={() => handleSelectCategory(cat)}
        style={{
          height: '100%',
          minHeight: 240,
          borderRadius: 12,
          border: isActive ? '2px solid #ffc118ff' : '1px solid #f0f0f0',
          boxShadow: isActive ? '0 4px 12px rgba(24, 144, 255, 0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
          background: isActive ? '#e6f7ff' : '#fff',
        }}
        bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%", flex: 1 }}>
          <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
            <FolderOpenOutlined style={{ fontSize: 32, color: isActive ? '#1890ff' : '#faad14' }} />
            <Tag color={coursesCount > 0 ? "cyan" : "default"}>
              {coursesCount} môn học
            </Tag>
          </Space>
          
          <div style={{ flex: 1 }}>
            <Tooltip title={cat.name}>
              <Title level={4} ellipsis={{ rows: 1 }} style={{ margin: 0, marginBottom: 8 }}>
                {cat.name}
              </Title>
            </Tooltip>
            <Tooltip title={cat.description || "Khám phá các môn học trong danh mục này."}>
              <Paragraph 
                type="secondary" 
                ellipsis={{ rows: 2 }}
                style={{ fontSize: 13, minHeight: 40, marginBottom: 0 }}
              >
                {cat.description || "Khám phá các môn học trong danh mục này."}
              </Paragraph>
            </Tooltip>
          </div>
          
          <Button
            type={isActive ? "primary" : "default"}
            icon={<ArrowRightOutlined />}
            block
            style={{ marginTop: 'auto' }}
          >
            {isActive ? "Đang xem" : "Xem lộ trình"}
          </Button>
        </Space>
      </Card>
    );
  };

  const renderRoadmapTimeline = () => {
    if (!selectedCategory) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          background: 'linear-gradient(135deg, rgba(235, 87, 51, 0.6), rgba(255, 55, 0, 0.6))',
          borderRadius: '16px',
          color: 'white'
        }}>
          <BookOutlined style={{ fontSize: '64px', marginBottom: 20, opacity: 0.9 }} />
          <Title level={3} style={{ color: 'white', marginBottom: 12 }}>
            Chọn một danh mục để xem lộ trình
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
            Khám phá các môn học được sắp xếp theo trình độ từ cơ bản đến nâng cao
          </Paragraph>
        </div>
      );
    }

    if (loadingCourses) {
      return (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
          <p>Đang tải các môn học cho danh mục "{selectedCategory.name}"...</p>
        </div>
      );
    }

    if (courses.length === 0) {
      return (
        <Empty 
          description={`Chưa có môn học nào trong danh mục "${selectedCategory.name}"`}
          style={{ padding: '40px 0' }}
        />
      );
    }

    // Sắp xếp theo level
    const sortedCourses = [...courses].sort((a, b) => {
      const levelOrder = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };
      return (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0);
    });

    const timelineItems = sortedCourses.map((course, index) => ({
      color: levelColorMap[course.level] || 'gray',
      dot: levelIconMap[course.level] || <BookOutlined />,
      children: (
        <Card
          hoverable
          style={{
            marginBottom: 16,
            borderRadius: 12,
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Row gutter={0}>
            <Col xs={24} sm={8} md={6}>
              <Image
                alt={course.title}
                src={course.thumbnailUrl || "/images/Image 2.svg"}
                fallback="/images/Image 2.svg"
                height={160}
                width="100%"
                style={{ objectFit: 'cover', borderRadius: '12px 0 0 12px' }}
                preview={false}
              />
            </Col>
            <Col xs={24} sm={16} md={18}>
              <div style={{ padding: '20px' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space style={{ justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                    <Tooltip title={course.title}>
                      <Title level={5} ellipsis={{ rows: 1 }} style={{ margin: 0, flex: 1 }}>
                        {course.title}
                      </Title>
                    </Tooltip>
                    <Tag 
                      color={levelColorMap[course.level] || levelColorMap.DEFAULT}
                      icon={levelIconMap[course.level]}
                      style={{ flexShrink: 0, marginLeft: 8 }}
                    >
                      {course.level || 'Tất cả'}
                    </Tag>
                  </Space>
                  
                  <Tooltip title={course.shortDescription || "Môn học chưa có mô tả."}>
                    <Paragraph 
                      ellipsis={{ rows: 2 }}
                      type="secondary"
                      style={{ marginBottom: 12 }}
                    >
                      {course.shortDescription || "Môn học chưa có mô tả."}
                    </Paragraph>
                  </Tooltip>
                  
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    {/* <Text strong style={{ color: '#f37142', fontSize: 16 }}>
                      {course.price > 0 ? `${course.price.toLocaleString()} VNĐ` : "Miễn phí"}
                    </Text> */}
                    <Button type="primary" size="small" onClick={() => navigate('/elearning')}>
                      Xem chi tiết
                    </Button>
                  </Space>
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
      ),
    }));

    return (
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Timeline
          mode="left"
          items={timelineItems}
        />
      </div>
    );
  };

  return (
    <Layout style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(235, 87, 51, 0.6), rgba(255, 55, 0, 0.6))',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '32px',
          textAlign: 'center',
          color: 'white'
        }}>
          <Tag color="orange" style={{ marginBottom: 16, fontSize: 14 }}>
            Lộ trình học tập
          </Tag>
          <Title level={2} style={{ color: 'white', marginBottom: 12 }}>
            Khám phá các khóa học theo danh mục
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, maxWidth: 700, margin: '0 auto' }}>
            Chọn danh mục bạn quan tâm để xem lộ trình học tập từ cơ bản đến nâng cao
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined rotate={180} />}
            onClick={() => navigate('/dashboard')}
            style={{ marginTop: 24, background: 'white', color: '#f37142', borderColor: 'white' }}
          >
            Trở về Trang chủ
          </Button>
        </div>

        {/* SEARCH & CATEGORIES */}
        <Card 
          style={{ 
            borderRadius: 16, 
            marginBottom: 32,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ marginBottom: 16 }}>
                <FolderOpenOutlined /> Danh mục khóa học
              </Title>
              <Search
                placeholder="Tìm kiếm danh mục..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ maxWidth: 500 }}
              />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {loadingCategories ? (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
                <p>Đang tải danh mục...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <Empty description="Không tìm thấy danh mục phù hợp" />
            ) : (
              <>
                <Row gutter={[16, 16]}>
                  {(showAllCategories ? filteredCategories : filteredCategories.slice(0, 8)).map((cat) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={cat.categoryId}>
                      {renderCategoryCard(cat)}
                    </Col>
                  ))}
                </Row>
                
                {filteredCategories.length > 8 && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Button 
                      type="dashed" 
                      size="large"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      style={{ minWidth: 200 }}
                    >
                      {showAllCategories ? 'Thu gọn' : `Xem thêm ${filteredCategories.length - 8} danh mục`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Space>
        </Card>

        {/* ROADMAP SECTION */}
        <Card 
          style={{ 
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <Title level={4} style={{ marginBottom: 24 }}>
            <BookOutlined /> {selectedCategory ? `Lộ trình: ${selectedCategory.name}` : "Lộ trình học tập"}
          </Title>
          {renderRoadmapTimeline()}
        </Card>
      </Content>
    </Layout>
  );
};

export default LmsDashboard;