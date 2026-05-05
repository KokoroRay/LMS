import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Tabs, Select, Button, Space, Typography, Spin } from 'antd';
import { DatabaseOutlined, FileTextOutlined, BarChartOutlined, SolutionOutlined, ArrowLeftOutlined } from '@ant-design/icons';
// Import thành phần quản lý Câu hỏi (Refactored SurveyTemplateManagement)
import SurveyQuestionManagement from '../../../components/admin/CourseEvaluation/SurveyQuestionManagement';

import SurveyManagement from '../../../components/admin/CourseEvaluation/SurveyManagement';
import EvaluationReports from '../../../components/admin/CourseEvaluation/EvaluationReports';
import { listSubjects } from '../../../services/subjectService';

const { Title, Text } = Typography;
const { Option } = Select;

export default function CourseEvaluationManagement() {
    const [activeTab, setActiveTab] = useState('surveys');
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [selectedSurveyForQuestions, setSelectedSurveyForQuestions] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoadingCourses(true);
            try {
                const data = await listSubjects();
                setCourses(Array.isArray(data) ? data : []);
                if (data.length > 0) {
                    setSelectedCourseId(data[0].courseId);
                }
            } catch (error) {
                console.error("Failed to load courses:", error);
            } finally {
                setLoadingCourses(false);
            }
        };
        fetchCourses();
    }, []);

    const courseSelect = (
        <Select
            showSearch
            value={selectedCourseId}
            onChange={setSelectedCourseId}
            placeholder="Select a course to view reports"
            optionFilterProp="label"
            style={{
                width: '100%',
                maxWidth: 400,
                minWidth: 200
            }}
            loading={loadingCourses}
        >
            {courses.map((c) => {
                const instructorNames = (c.instructors || []).map(i => i.fullName).join(', ');
                const label = `${c.title} (${instructorNames || 'No instructor'})`;
                return (
                    <Option key={c.courseId} value={c.courseId} label={label}>
                        {label}
                    </Option>
                );
            })}
        </Select>
    );

    // Xử lý khi Admin muốn quản lý Câu hỏi của một Survey
    const handleManageQuestions = (surveyId, surveyTitle) => {
        setSelectedSurveyForQuestions({ surveyId, surveyTitle });
    };

    const handleBackToSurveys = () => {
        setSelectedSurveyForQuestions(null);
    };

    const items = [
        {
            key: 'surveys',
            label: (
                <Space>
                    <DatabaseOutlined />
                    <span className="tab-label">Quản lý Khảo Sát</span>
                </Space>
            ),
            children: selectedSurveyForQuestions ? (
                // Hiển thị Quản lý Câu hỏi nếu có Survey được chọn
                <div style={{ padding: '16px 0' }}>
                    <Button
                        onClick={handleBackToSurveys}
                        icon={<ArrowLeftOutlined />}
                        style={{ marginBottom: 16 }}
                    >
                        Trở về
                    </Button>
                    <SurveyQuestionManagement // Component này đã được refactor để quản lý Questions
                        surveyId={selectedSurveyForQuestions.surveyId}
                        surveyTitle={selectedSurveyForQuestions.surveyTitle}
                    />
                </div>
            ) : (
                // Hiển thị Danh sách Survey
                <div style={{ padding: '16px 0' }}>
                    <SurveyManagement onManageQuestions={handleManageQuestions} />
                </div>
            ),
        },
        // Giữ lại Tab Reports
        {
            key: 'reports',
            label: (
                <Space>
                    <BarChartOutlined />
                    <span className="tab-label">Phản hồi của học sinh</span>
                </Space>
            ),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <EvaluationReports
                        courseSelect={courseSelect}
                        selectedCourseId={selectedCourseId}
                        courses={courses}
                    />
                </div>
            ),
        },
    ];

    return (
        <Layout style={{
            padding: '16px',
            background: '#f0f2f5',
            minHeight: '100vh'
        }}>
            <div style={{
                maxWidth: 1400,
                margin: '0 auto',
                width: '100%'
            }}>
                <Title
                    level={3}
                    style={{
                        margin: '0 0 16px 0',
                        fontSize: 'clamp(18px, 4vw, 24px)'
                    }}
                >
                    <FileTextOutlined style={{ marginRight: 10 }} />
                    Course Evaluation Management
                </Title>
                {/* <Card
                    bodyStyle={{ padding: 0 }}
                    style={{
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                > */}
                    <Tabs
                        defaultActiveKey="surveys"
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={items}
                        size="large"
                        style={{ padding: '0 16px' }}
                        tabBarStyle={{
                            marginBottom: 0,
                            paddingTop: 8
                        }}
                    />
                {/* </Card> */}
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .tab-label {
                        display: none;
                    }
                }
                
                @media (max-width: 576px) {
                    .ant-tabs-nav {
                        padding: 0 8px !important;
                    }
                    
                    .ant-tabs-tab {
                        padding: 8px 12px !important;
                    }
                }
            `}</style>
        </Layout>
    );
}