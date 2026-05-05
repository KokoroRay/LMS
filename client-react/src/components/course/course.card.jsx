import { Card, Badge, Button, Typography, Row, Col, Spin, Space } from 'antd';
import { ArrowRightOutlined, StarFilled } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Text, Title } = Typography;

const CourseCard = ({ id, level, title, image, onClick, shortDescription, avgScore }) => {
    return (
        <Card
            hoverable
            style={{
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                border: '1px solid #d9d9d9',
                minHeight: 450,
                display: 'flex',
                flexDirection: 'column',
            }}
            bodyStyle={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
            }}
        >
            {/* Course Image */}
            <div
                className="course-card-cover"
                style={{
                    background: '#ffffffff',
                    height: 240,
                    borderRadius: 12,
                    marginBottom: 16,
                    overflow: 'hidden',
                }}
            >
                <img
                    src={image}
                    alt={title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            </div>

            <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                <Col>
                    {/* Level Badge */}
                    <Badge
                        count={<span style={{ padding: '2px 10px' }}>{level}</span>}
                        color="#1677ff"
                        styles={{
                            indicator: {
                                position: 'static',
                                transform: 'none',
                                backgroundColor: '#e6f4ff',
                                color: '#1677ff',
                                border: '1px solid #91caff',
                                borderRadius: 12,
                            }
                        }}
                    />
                </Col>
                <Col>
                    {avgScore > 0 && (
                        <Space align="center" size={4}>
                            <StarFilled style={{ color: '#ffc107', fontSize: 16 }} />
                            <Text strong style={{ color: '#faad14', fontSize: 15 }}>
                                {avgScore.toFixed(1)}
                            </Text>
                        </Space>
                    )}
                </Col>
            </Row>


            {/* Course Info */}
            {/* <div style={{ marginTop: 16 }}>
                <Space size={24} wrap split={<Divider type="vertical" style={{ height: 18, margin: 0 }} />}>
                    <Space size={8}>
                        <ClockCircleOutlined style={{ color: '#ff4d4f' }} />
                        <Text type="secondary">{duration}</Text>
                    </Space>
                    <Space size={8}>
                        <ReadOutlined style={{ color: '#fa8c16' }} />
                        <Text type="secondary">{chapters}</Text>
                    </Space>
                    <Space size={8}>
                        <Avatar size={20} style={{ background: '#fa541c' }} icon={<UserOutlined />} />
                        <Text type="secondary">{teacher}</Text>
                    </Space>
                </Space>
            </div> */}

            {/* Course Title */}
            <Title
                level={2}
                className="course-card-title"
                style={{
                    marginTop: 0,
                    marginBottom: 8,
                    fontSize: 24,
                    height: 64,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '32px',
                }}
            >
                {title}
            </Title>

            {/* ShortDescription */}
            {shortDescription && (
                <Text
                    type="secondary"
                    style={{
                        fontSize: 14,
                        lineHeight: '20px',
                        height: 40,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        marginBottom: 'auto',
                        paddingBottom: 16,
                    }}
                > {shortDescription} </Text>
            )}


            {/* Learn Button */}
            <Button
                size="large"
                block
                icon={<ArrowRightOutlined />}
                className="learn-now-btn"
                onClick={() => onClick?.(id)}
                style={{
                    background: '#fdecec',
                    border: 'none',
                    color: '#ff3700ff',
                    fontWeight: 700,
                    height: 44,
                    borderRadius: 12,
                    marginTop: 'auto'
                }}
            >
                Học Ngay
            </Button>
        </Card>
    );
};

const CourseCardGrid = ({ courses, onCardClick, loading }) => {
    // CourseCardGrid data

    // Loading state
    if (loading) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '50px 24px',
                maxWidth: 1600,
                margin: '0 auto'
            }}>
                <Spin size="large" />
                <p style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Đang tải danh sách khóa học...</p>
            </div>
        );
    }

    // No data state
    if (!courses || courses.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '50px 24px',
                maxWidth: 1600,
                margin: '0 auto'
            }}>
                <p style={{ fontSize: 18, color: '#666' }}>
                    Chưa có khóa học nào
                </p>
            </div>
        );
    }

    return (
        <Row
            gutter={[24, 24]}
            style={{
                maxWidth: 1600,
                margin: '0 auto',
                padding: '30px 24px'
            }}
        >
            {courses.map((course, index) => (
                <Col key={course.id} xs={24} sm={12} md={12} lg={8} xl={8}>
                    {/* Thêm animation cho mỗi card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: index * 0.1,
                            ease: "easeOut",
                        }}
                    >
                        <CourseCard
                            id={course.id}
                            level={course.level}
                            duration={course.duration}
                            // chapters={course.chapters}
                            // teacher={course.teacher}
                            title={course.title}
                            shortDescription={course.shortDescription} // Thêm shortDescription
                            image={course.image}
                            onClick={onCardClick}
                            avgScore={course.avgScore}
                        />
                    </motion.div>
                </Col>
            ))}
        </Row>
    );
};

export { CourseCard, CourseCardGrid };
export default CourseCardGrid;