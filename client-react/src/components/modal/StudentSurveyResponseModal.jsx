import { useState, useEffect } from "react";
import { Modal, Rate, Input, Button, Form, message, Spin, Radio, Checkbox, Empty, Typography } from "antd";
import { getQuestionsBySurvey, getResponsesByStudent } from "../../services/courseServey";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const StudentSurveyResponseModal = ({ visible, onClose, surveyId, studentId, surveyTitle, studentName }) => {
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (visible && surveyId && studentId) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const questionsData = await getQuestionsBySurvey(surveyId);
                    setQuestions(Array.isArray(questionsData) ? questionsData : []);

                    const studentResponsesData = await getResponsesByStudent(studentId);
                    const filteredResponses = (Array.isArray(studentResponsesData) ? studentResponsesData : [])
                        .filter(r => r.surveyId === surveyId);

                    const responseMap = filteredResponses.reduce((acc, res) => {
                        acc[res.questionId] = res.answer;
                        return acc;
                    }, {});
                    setResponses(responseMap);

                } catch (error) {
                    message.error("Lỗi tải dữ liệu đánh giá học sinh.");
                    console.error("Failed to fetch survey response details:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [visible, surveyId, studentId]);

    const renderReadOnlyAnswer = (q) => {
        const answer = responses[q.questionId];

        if (answer === undefined || answer === null || answer === "") {
            return <Text type="secondary" italic>No answer submitted.</Text>;
        }

        // Parse comment from answer string if it exists
        let mainAnswer = answer;
        let comment = "";
        const commentDelimiter = " | Comment: ";
        if (answer.includes(commentDelimiter)) {
            const parts = answer.split(commentDelimiter);
            mainAnswer = parts[0];
            comment = parts[1];
        }

        const renderInput = () => {
            switch (q.questionType) {
                case 'RATING':
                    const ratingValue = parseFloat(mainAnswer);
                    return <Rate disabled allowHalf value={ratingValue} style={{ fontSize: 24 }} />;
                case 'SINGLE_CHOICE':
                    return (
                        <Radio.Group value={mainAnswer} disabled>
                            {(q.options || []).map((option, index) => (
                                <Radio key={index} value={option}>{option}</Radio>
                            ))}
                        </Radio.Group>
                    );
                case 'MULTI_CHOICE':
                     const selectedOptions = mainAnswer ? mainAnswer.split(', ') : [];
                    return (
                        <Checkbox.Group value={selectedOptions} disabled>
                            {(q.options || []).map((option, index) => (
                                <Checkbox key={index} value={option}>{option}</Checkbox>
                            ))}
                        </Checkbox.Group>
                    );
                case 'TEXT':
                    return <Paragraph blockquote style={{ whiteSpace: 'pre-wrap' }}>{mainAnswer}</Paragraph>;
                default:
                    return <Text>{answer}</Text>;
            }
        };

        return (
            <div>
                {renderInput()}
                {comment && <Paragraph italic style={{ marginTop: '8px', color: '#888' }}>Comment: {comment}</Paragraph>}
            </div>
        );
    };

    return (
        <Modal
            title={`Tiêu đề bài đánh giá: ${surveyTitle || ''}`}
            open={visible}
            onCancel={onClose}
            footer={[<Button key="close" onClick={onClose}>Close</Button>]}
            width={700}
        >
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <Spin size="large" tip="Loading response..." />
                </div>
            ) : (
                <div>
                    {studentName && <Text strong>Học sinh: {studentName}</Text>}
                    <hr style={{ margin: '16px 0' }}/>
                    {questions.length > 0 ? questions.map((q) => (
                        <div key={q.questionId} style={{ marginBottom: 20, padding: 15, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                            <h4 style={{ marginBottom: 10 }}>
                                {q.questionText}
                                <span style={{ color: '#aaa', marginLeft: 10, fontSize: 12 }}>({q.questionType.replace('_', ' ')})</span>
                            </h4>
                            {renderReadOnlyAnswer(q)}
                        </div>
                    )) : <Empty description="No questions found for this survey." />}
                </div>
            )}
        </Modal>
    );
};

export default StudentSurveyResponseModal;
