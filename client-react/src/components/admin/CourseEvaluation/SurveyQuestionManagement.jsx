import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Table, Tag, Popconfirm, Modal, Form, Input, Select, Divider, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined, ReloadOutlined, CloseCircleOutlined } from '@ant-design/icons';
import * as surveyService from '../../../services/courseServey'; 

const { Title, Text } = Typography;
const { Option } = Select;

const QUESTION_TYPES = [
    { value: 'RATING', label: 'Thang điểm (Rating)' },
    { value: 'TEXT', label: 'Tự luận (Text)' },
    { value: 'SINGLE_CHOICE', label: 'Trắc nghiệm (Chọn 1)' },
    { value: 'MULTI_CHOICE', label: 'Trắc nghiệm (Chọn nhiều)' },
];

export default function SurveyQuestionManagement({ surveyId, surveyTitle }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [form] = Form.useForm();

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const data = await surveyService.getQuestionsBySurvey(surveyId);
            setQuestions(Array.isArray(data) ? data.map(q => ({...q, key: q.questionId})) : []);
        } catch (error) {
            message.error("Failed to load questions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (surveyId) {
            fetchQuestions();
        }
    }, [surveyId]);

    const handleOpenModal = (question = null) => {
        setEditingQuestion(question);
        
        // Chuyển mảng string options thành mảng đối tượng { value: string } cho Form.List
        const initialOptions = (question && Array.isArray(question.options)) 
            ? question.options.map(opt => ({ value: opt }))
            : [{ value: '' }]; // Luôn có ít nhất 1 trường trống khi tạo mới

        form.setFieldsValue(question ? {
            questionText: question.questionText,
            questionType: question.questionType,
            options: initialOptions,
        } : {
            questionType: 'RATING', 
            options: [{ value: '' }]
        });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingQuestion(null);
        form.resetFields();
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            
            // Xử lý Options: Lấy ra mảng string từ Form.List, loại bỏ trường rỗng
            let optionsList = null;
            if (values.options && Array.isArray(values.options)) {
                optionsList = values.options
                    .map(item => item.value ? item.value.trim() : null)
                    .filter(s => s && s.length > 0);
            }
            
            const payload = {
                ...values,
                options: optionsList,
                surveyId: surveyId 
            };
            
            // Kiểm tra nếu là trắc nghiệm mà không có options nào
            if ((values.questionType === 'SINGLE_CHOICE' || values.questionType === 'MULTI_CHOICE') && (optionsList === null || optionsList.length < 2)) {
                return message.error("Vui lòng nhập ít nhất 2 lựa chọn cho câu hỏi trắc nghiệm.");
            }


            if (editingQuestion) {
                await surveyService.updateSurveyQuestion(editingQuestion.questionId, payload);
                message.success("Question updated successfully!");
            } else {
                await surveyService.addSurveyQuestion(surveyId, payload);
                message.success("Question added successfully!");
            }
            handleCancel();
            fetchQuestions();
        } catch (error) {
            message.error("Failed to save question. Check server response.");
        }
    };
    
    const handleDelete = async (questionId) => {
        try {
            await surveyService.deleteSurveyQuestion(questionId);
            message.success("Question deleted successfully!");
            fetchQuestions();
        } catch (error) {
            message.error("Failed to delete question.");
        }
    };

    const questionColumns = [
        {
            title: 'ID',
            dataIndex: 'questionId',
            key: 'questionId',
            width: 80,
        },
        {
            title: 'Nội dung Câu hỏi',
            dataIndex: 'questionText',
            key: 'questionText',
            width: '40%',
        },
        {
            title: 'Loại câu hỏi',
            dataIndex: 'questionType',
            key: 'questionType',
            render: (type) => (
                <Tag color="blue">
                    {QUESTION_TYPES.find(t => t.value === type)?.label || type}
                </Tag>
            )
        },
        {
            title: 'Lựa chọn',
            dataIndex: 'options',
            key: 'options',
            render: (options) => {
                if (!options || options.length === 0) return <Text type="secondary">N/A</Text>;
                return options.length > 3 
                    ? `${options.slice(0, 3).join(', ')},...` 
                    : options.join(', ');
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleOpenModal(record)} />
                    <Popconfirm
                        title="Xóa Câu hỏi?"
                        description={`Bạn có chắc muốn xóa câu hỏi này?`}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record.questionId)}
                    >
                        <Button icon={<DeleteOutlined />} danger size="small" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (!surveyId) {
        return <Card bordered={false}><Text>Vui lòng chọn một Khảo sát để quản lý câu hỏi.</Text></Card>;
    }

    const QuestionFormContent = () => {
        const questionType = Form.useWatch('questionType', form);
        
        const needsOptions = questionType === 'SINGLE_CHOICE' || questionType === 'MULTI_CHOICE';

        return (
            <>
                <Form.Item
                    name="questionText"
                    label="Nội dung Câu hỏi"
                    rules={[{ required: true, message: 'Vui lòng nhập nội dung câu hỏi!' }]}
                >
                    <Input.TextArea rows={3} placeholder="Ví dụ: Giảng viên đã hỗ trợ sinh viên kịp thời và hiệu quả như thế nào?" />
                </Form.Item>
                
                <Form.Item
                    name="questionType"
                    label="Loại Câu hỏi"
                    rules={[{ required: true, message: 'Vui lòng chọn loại câu hỏi!' }]}
                >
                    <Select placeholder="Chọn loại câu hỏi">
                        {QUESTION_TYPES.map(type => (
                            <Option key={type.value} value={type.value}>{type.label}</Option>
                        ))}
                    </Select>
                </Form.Item>
                
                {needsOptions && (
                    <Form.List name="options">
                        {(fields, { add, remove }) => (
                            <div style={{ border: '1px dashed #ccc', padding: 10, borderRadius: 4, marginTop: 15 }}>
                                <Text strong>Lựa chọn trả lời:</Text>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'value']}
                                            rules={[{ required: true, message: `Lựa chọn ${index + 1} không được để trống` }]}
                                            style={{ flex: 1, marginBottom: 0 }}
                                        >
                                            <Input placeholder={`Lựa chọn ${index + 1}`} />
                                        </Form.Item>
                                        
                                        {fields.length > 1 && (
                                            <CloseCircleOutlined
                                                style={{ color: 'red' }}
                                                onClick={() => remove(name)}
                                            />
                                        )}
                                    </Space>
                                ))}
                                <Form.Item style={{ marginTop: 10, marginBottom: 0 }}>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Thêm Lựa chọn
                                    </Button>
                                </Form.Item>
                            </div>
                        )}
                    </Form.List>
                )}

                <Divider />
                <Text type="secondary">
                    {!needsOptions
                        ? 'Loại Thang điểm (RATING) và Tự luận (TEXT) không cần nhập lựa chọn.'
                        : 'Vui lòng nhập ít nhất 2 lựa chọn cho câu hỏi trắc nghiệm.'
                    }
                </Text>
            </>
        );
    };

    return (
        <Card bordered={false}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>
                    <SettingOutlined /> Câu hỏi cho: {surveyTitle}
                </Title>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(null)}>
                        Thêm Câu hỏi Mới
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchQuestions} loading={loading}>
                        Tải lại
                    </Button>
                </Space>
            </div>
            
            <Table 
                columns={questionColumns} 
                dataSource={questions} 
                rowKey="questionId" 
                loading={loading}
                bordered
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingQuestion ? "Sửa Câu hỏi" : "Thêm Câu hỏi Mới"}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                destroyOnClose
                width={600}
            >
                <Form form={form} layout="vertical" name="questionForm">
                    <QuestionFormContent />
                </Form>
            </Modal>
        </Card>
    );
}