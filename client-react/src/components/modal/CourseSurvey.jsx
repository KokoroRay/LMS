import { useState, useEffect } from "react";
import { Modal, Rate, Input, Button, Form, message, Spin, Radio, Checkbox } from "antd";
import { useSelector } from "react-redux";
import { getQuestionsBySurvey, submitSurveyResponse } from "../../services/courseServey";
import { selectCurrentUserId } from "../../redux/api/slices/authSlice";
import { useNavigate } from "react-router-dom";


const { TextArea } = Input;

const CourseSurvey = ({ visible, onClose, courseId, instructorId, surveyId, onSuccess }) => {
    const [form] = Form.useForm();
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const studentId = useSelector(selectCurrentUserId);
    const navigate = useNavigate();


    useEffect(() => {
        if (visible && surveyId) {
            const fetchQuestions = async () => {
                setIsLoading(true);
                try {
                    const data = await getQuestionsBySurvey(surveyId);
                    setQuestions(Array.isArray(data) ? data : []);
                } catch (error) {
                    message.error("Failed to load survey questions.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchQuestions();
        }
    }, [visible, surveyId]);

    const renderQuestionInput = (q) => {
        const rules = [{ required: true, message: `Please answer the question: ${q.questionText}` }];

        switch (q.questionType) {
            case 'RATING':
                return (
                    <Form.Item name={`answer_${q.questionId}`} rules={rules}>
                        <Rate allowHalf style={{ fontSize: 28 }} />
                    </Form.Item>
                );
            case 'SINGLE_CHOICE':
                return (
                    <Form.Item name={`answer_${q.questionId}`} rules={rules}>
                        <Radio.Group>
                            {q.options && q.options.map((option, index) => (
                                <Radio key={index} value={option}>{option}</Radio>
                            ))}
                        </Radio.Group>
                    </Form.Item>
                );
            case 'MULTI_CHOICE':
                return (
                    <Form.Item name={`answer_${q.questionId}`} rules={rules} valuePropName="value">
                        <Checkbox.Group>
                            {q.options && q.options.map((option, index) => (
                                <Checkbox key={index} value={option}>{option}</Checkbox>
                            ))}
                        </Checkbox.Group>
                    </Form.Item>
                );
            case 'TEXT':
                return (
                    <Form.Item name={`answer_${q.questionId}`} rules={rules}>
                        <TextArea rows={4} placeholder="Your detailed response" />
                    </Form.Item>
                );
            default:
                return null;
        }
    };

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            const responsesPayload = questions.map(q => {
                const mainAnswer = values[`answer_${q.questionId}`];
                const comment = values[`comment_${q.questionId}`] || "";

                let answerString;

                switch (q.questionType) {
                    case 'RATING':
                        // Backend expects a string
                        answerString = String(mainAnswer);
                        if (comment) answerString += ` | Comment: ${comment}`;
                        break;
                    case 'SINGLE_CHOICE':
                        answerString = mainAnswer;
                        if (comment) answerString += ` | Comment: ${comment}`;
                        break;
                    case 'MULTI_CHOICE':
                        // Join array into comma-separated string
                        answerString = mainAnswer ? mainAnswer.join(', ') : "";
                        if (comment) answerString += ` | Comment: ${comment}`;
                        break;
                    case 'TEXT':
                        answerString = mainAnswer;
                        // No separate comment for TEXT type as it's the main answer
                        break;
                    default:
                        answerString = String(mainAnswer);
                        if (comment) answerString += ` | Comment: ${comment}`;
                        break;
                }

                return {
                    surveyId: surveyId,
                    questionId: q.questionId,
                    answer: answerString,
                    // studentId is now handled by the backend from the session
                };
            });

            await submitSurveyResponse(responsesPayload);

            message.success("Cảm ơn bạn đã hoàn thành khảo sát!");
            form.resetFields();
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (error) {
            const errorMessage = error?.response?.data?.message || "Khảo sát thắt bại vui lòng thử lại!";
            message.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title="Đánh giá môn học"
            open={visible}
            onCancel={onClose}
            footer={[
                <Button
                    key="back"
                    onClick={() => {
                        onClose();
                        navigate("/qlmh/progress");   
                    }}
                    disabled={isSubmitting}
                >
                    Skip for now
                </Button>
                ,
                <Button
                    key="submit"
                    type="primary"
                    loading={isSubmitting}
                    onClick={() => form.submit()}
                >
                    Submit
                </Button>,
            ]}
            width={700}
        >
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <Spin size="large" tip="Loading questions..." />
                </div>
            ) : (
                <Form form={form} onFinish={handleSubmit} layout="vertical" preserve={false}>
                    <p>Đánh giá của bạn là ý kiến để chúng tôi tối ưu tốt cho khóa học</p>
                    {questions.map((q) => (
                        <div key={q.questionId} style={{ marginBottom: 20, padding: 15, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                            <h4 style={{ marginBottom: 10 }}>
                                {q.questionText}
                                <span style={{ color: '#aaa', marginLeft: 10, fontSize: 12 }}>({q.questionType.replace('_', ' ')})</span>
                            </h4>

                            {renderQuestionInput(q)}

                            {q.questionType !== 'TEXT' && (
                                <Form.Item
                                    name={`comment_${q.questionId}`}
                                    label="Thêm bình luận (tùy chọn)"
                                >
                                    <TextArea rows={2} placeholder="Nhập bình luận của bạn" />
                                </Form.Item>
                            )}

                        </div>
                    ))}
                </Form>
            )}
        </Modal>
    );
};

export default CourseSurvey;