// src/components/admin/CourseEvaluation/EvaluationReports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Space, Typography, Table, Tag, Tooltip, Modal, Row, Col, Spin, message, Empty, Divider } from 'antd';
import { ReloadOutlined, EyeOutlined, BarChartOutlined, UserOutlined } from '@ant-design/icons';
import { listAllSurveys, getSurveyStatistics, getResponsesBySurvey } from '../../../services/courseServey';
import { getStudentById } from '../../../services/studentService';
import StudentSurveyResponseModal from '../../../components/modal/StudentSurveyResponseModal';


const { Title, Text } = Typography;

// Helper to calculate average rating from optionCounts
const calculateAverage = (optionCounts) => {
  if (!optionCounts || typeof optionCounts !== "object") return 0;

  let totalScore = 0;
  let totalVotes = 0;

  const extractRating = (rawOption) => {
    if (rawOption == null) return 0;
    // Lấy phần trước dấu "|" rồi parseFloat
    const numStr = String(rawOption).split("|")[0].trim(); // "4.5"
    const num = parseFloat(numStr);
    return Number.isFinite(num) ? num : 0;
  };

  for (const [option, count] of Object.entries(optionCounts)) {
    const rating = extractRating(option);  // 4.5
    const c = Number(count) || 0;
    totalScore += rating * c;
    totalVotes += c;
  }

  return totalVotes > 0 ? totalScore / totalVotes : 0;
};


// Sub-component for detailed report view in the modal
const DetailedReportContent = ({ stats, report }) => {
  if (!report) return null;
  const overallAvgScore = report.avgScore || 0;
  const submissions = report.submissions || 0;
  const questionStats = stats
    .filter(s => s.questionType === 'RATING' && s.totalResponses > 0)
    .map(s => ({
      key: s.questionId,
      question: s.questionText,
      avg: calculateAverage(s.optionCounts),
      optionCounts: s.optionCounts,
    }));

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row gutter={16}>
            <Col span={12}>
                <Card title="Overall Average Score" size="small">
                    <Title level={2} style={{ margin: 0, color: '#1890ff' }}>{overallAvgScore.toFixed(2)}/5.0</Title>
                    <Text type="secondary">{submissions} responses</Text>
                </Card>
            </Col>
            <Col span={12}>
                <Card title="Submission Count" size="small">
                    <Title level={2} style={{ margin: 0, color: '#52c41a' }}>{submissions}</Title>
                    <Text type="secondary">Total evaluations submitted</Text>
                </Card>
            </Col>
        </Row>
        
        {questionStats.length > 0 && (
          <>
            <Title level={5} style={{ marginBottom: 0 }}>Question Analysis (Scale 1-5)</Title>
            <Table
                dataSource={questionStats}
                columns={[
                    { title: 'Question', dataIndex: 'question', key: 'question' },
                    { title: 'Avg Score', dataIndex: 'avg', key: 'avg', render: (avg) => <Tag color="geekblue">{avg.toFixed(2)}</Tag>, align: 'right' },
                    { 
                        title: 'Distribution', 
                        dataIndex: 'optionCounts', 
                        key: 'distribution', 
                        render: (optionCounts) => (
                            <Space size={[0, 8]} wrap>
                                {Object.entries(optionCounts || {}).sort(([a], [b]) => parseInt(b) - parseInt(a)).map(([option, count]) => (
                                    <Tag key={option}>{option}: {count}</Tag>
                                ))}
                            </Space>
                        )
                    },
                ]}
                pagination={false}
                size="small"
            />
          </>
        )}
        {stats.filter(s => s.questionType === 'TEXT').length > 0 && (
             <Title level={5} style={{ marginBottom: 0, marginTop: 16, color: '#888' }}>
                * Text-based responses are not shown in this summary.
            </Title>
        )}
    </Space>
  );
};


export default function EvaluationReports({ courseSelect, selectedCourseId, courses }) {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [detailedStats, setDetailedStats] = useState([]);

  // State for individual submissions
  const [individualSubmissions, setIndividualSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [selectedStudentData, setSelectedStudentData] = useState(null);

  const courseMap = useMemo(() => {
    return (courses || []).reduce((acc, course) => {
      acc[course.courseId] = course.title;
      return acc;
    }, {});
  }, [courses]);

  const fetchData = async () => {
    setLoading(true);
    setIndividualSubmissions([]); // Clear previous submissions
    try {
      const allSurveys = await listAllSurveys();
      const filteredSurveys = selectedCourseId ? allSurveys.filter(s => s.courseId === selectedCourseId) : allSurveys;

      if (!filteredSurveys || filteredSurveys.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }
      
      const reportPromises = filteredSurveys.map(async (survey) => {
        try {
          const stats = await getSurveyStatistics(survey.surveyId);
          let submissions = 0;
          if (stats && stats.length > 0) {
            submissions = Math.max(0, ...stats.map(s => s.totalResponses || 0));
          }
          const ratingStats = (stats || []).filter(s => s.questionType === 'RATING' && s.totalResponses > 0);
          let surveyAverage = 0;
          if (ratingStats.length > 0) {
              const avgRatings = ratingStats.map(stat => calculateAverage(stat.optionCounts));
              surveyAverage = avgRatings.reduce((sum, avg) => sum + avg, 0) / avgRatings.length;
          }
          return {
            id: survey.surveyId,
            courseId: survey.courseId,
            courseTitle: courseMap[survey.courseId] || `Course ID: ${survey.courseId}`,
            surveyTitle: survey.title,
            submissions,
            avgScore: surveyAverage,
            status: survey.active ? 'Đang mở' : 'Đã đóng',
            detailedStats: stats || [],
          };
        } catch (error) { return null; }
      });

      const settledReports = (await Promise.all(reportPromises)).filter(Boolean);
      setReports(settledReports);

    } catch (error) {
      message.error('Failed to load evaluation reports.');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch individual submissions when a course is selected
  useEffect(() => {
    const fetchIndividualSubmissions = async () => {
      // Only run if a single course is selected and we have its report
      if (selectedCourseId && reports.length === 1) {
        const surveyId = reports[0].id;
        if (!surveyId) return;

        setSubmissionsLoading(true);
        try {
          const responses = await getResponsesBySurvey(surveyId);
          const studentIds = [...new Set(responses.map(r => r.studentId))];

          const studentDataPromises = studentIds.map(async (id) => {
            try {
              const student = await getStudentById(id);
              // The DTO from backend might be nested, e.g., student.data.data
              const studentDetails = student?.data?.data || student?.data || student;
              const name = studentDetails?.firstName || studentDetails?.lastName
                ? `${studentDetails.firstName ?? ""} ${studentDetails.lastName ?? ""}`.trim()
                : (studentDetails?.fullName || studentDetails?.user?.fullName || 'Unknown Student');
              return {
                studentId: id,
                studentName: name,
                surveyId: surveyId
              };
            } catch {
              return { studentId: id, studentName: 'Unknown Student', surveyId: surveyId }; // Fallback
            }
          });
          
          const students = await Promise.all(studentDataPromises);
          setIndividualSubmissions(students);

        } catch (error) {
          message.error("Failed to load individual submissions.");
        } finally {
          setSubmissionsLoading(false);
        }
      } else {
        setIndividualSubmissions([]); // Clear if no course is selected
      }
    };

    fetchIndividualSubmissions();
  }, [reports, selectedCourseId]);

  useEffect(() => {
    fetchData();
  }, [selectedCourseId, courses]);

  const openStudentResponseModal = (student) => {
    setSelectedStudentData(student);
    setIsStudentModalVisible(true);
  };
  
  const individualSubmissionsColumns = [
    { title: 'Student Name', dataIndex: 'studentName', key: 'studentName' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" onClick={() => openStudentResponseModal(record)}>View Response</Button>
      ),
    },
  ];

  const openReportDetail = (record) => {
    setReportData(record);
    setDetailedStats(record.detailedStats);
    setIsModalVisible(true);
  };
  const closeReportDetail = () => setIsModalVisible(false);

  return (
    // <Card bordered={false}>
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <Space size="middle">
          {courseSelect}
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Tải lại</Button>
        </Space>
      </div>
      <Spin spinning={loading}>
        <Table 
          columns={[{ title: 'Môn', dataIndex: 'courseTitle' }, { title: 'Mô Tả', dataIndex: 'surveyTitle' }, { title: 'Số bài nộp', dataIndex: 'submissions', align: 'right' }, { title: 'Trung Bình Điểm', dataIndex: 'avgScore', render: (s) => <Tag color="processing">{s.toFixed(2)}/5.0</Tag>, align: 'right' }, { title: 'Trạng Thái', dataIndex: 'status', render: (s) => <Tag color={s === 'Đang mở' ? 'volcano' : 'green'}>{s}</Tag> }, { title: 'Hành động', key: 'action', render: (_, rec) => <Button icon={<EyeOutlined />} onClick={() => openReportDetail(rec)} size="small">View Report</Button> }]} 
          dataSource={reports} 
          rowKey="id" 
          locale={{ emptyText: <Empty description={loading ? 'Loading...' : 'No reports found.'} /> }}
        />
      </Spin>

      {selectedCourseId && (
        <>
          <Divider />
          <Title level={4}><UserOutlined style={{marginRight: 8}}/>Đánh giá của học sinh</Title>
          <Spin spinning={submissionsLoading}>
            <Table
              columns={individualSubmissionsColumns}
              dataSource={individualSubmissions}
              rowKey="studentId"
              locale={{ emptyText: <Empty description="No individual submissions found for this course's survey." /> }}
              size="small"
            />
          </Spin>
        </>
      )}

      {/* Modal for Aggregate Report */}
      <Modal title={<Title level={4} style={{ margin: 0 }}><BarChartOutlined style={{ marginRight: 8 }} /> Chi tiết thông tin đánh giá</Title>} open={isModalVisible} onCancel={closeReportDetail} footer={[<Button key="close" onClick={closeReportDetail}>Close</Button>]} width={800}>
        {reportData && (
          <div style={{ padding: '16px 0' }}>
            <Text strong>Course:</Text> {reportData.courseTitle} <br/>
            <Text strong>Survey Form:</Text> <Tag color="blue" style={{ marginLeft: 5 }}>{reportData.surveyTitle}</Tag>
            <hr style={{ margin: '16px 0' }}/>
            <DetailedReportContent stats={detailedStats} report={reportData} />
          </div>
        )}
      </Modal>

      {/* Modal for Individual Student Response */}
      {selectedStudentData && (
          <StudentSurveyResponseModal
              visible={isStudentModalVisible}
              onClose={() => setIsStudentModalVisible(false)}
              surveyId={selectedStudentData.surveyId}
              studentId={selectedStudentData.studentId}
              studentName={selectedStudentData.studentName}
              surveyTitle={reports.find(r => r.id === selectedStudentData.surveyId)?.surveyTitle}
          />
      )}
    </div>
  );
}