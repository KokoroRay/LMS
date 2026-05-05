// src/components/admin/CourseEvaluation/SurveyManagement.jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm, Dropdown, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SettingOutlined, MoreOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
// Giả định import từ surveyService.js đã cung cấp ở bước trước
import * as surveyService from '../../../services/courseServey'; 
import { listSubjects } from '../../../services/subjectService';

const { Option } = Select;

const SurveyManagement = ({ onManageQuestions }) => {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState(null);
    const [form] = Form.useForm();

    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // --- Course Fetching (Giữ nguyên) ---
    const fetchCourses = async () => {
        setLoadingCourses(true);
        try {
            const data = await listSubjects();
            setCourses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load courses:", error);
        } finally {
            setLoadingCourses(false);
        }
    };

    // --- Survey Fetching ---
    const fetchSurveys = async () => {
        setLoading(true);
        try {
            const activeSurveys = await surveyService.listSurveys(true);
            const inactiveSurveys = await surveyService.listSurveys(false);
            // Gộp và sắp xếp theo ID
            setSurveys([...activeSurveys, ...inactiveSurveys].sort((a, b) => b.surveyId - a.surveyId));
        } catch (error) {
            message.error("Failed to load surveys.");
            console.error("Failed to load surveys:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSurveys();
        fetchCourses();
    }, []);

    // --- CRUD Handlers ---
    const handleOpenModal = (survey = null) => {
        setEditingSurvey(survey);
        form.setFieldsValue(survey ? {
            title: survey.title,
            description: survey.description,
            courseId: survey.courseId,
            // classId cũng có thể thêm vào đây
        } : {});
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingSurvey(null);
        form.resetFields();
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
            };

            if (editingSurvey) {
                await surveyService.updateSurvey(editingSurvey.surveyId, payload);
                message.success("Survey updated successfully!");
            } else {
                await surveyService.createSurvey(payload);
                message.success("Survey created successfully!");
            }
            handleCancel();
            fetchSurveys();
        } catch (error) {
            message.error("Failed to save survey. Check server response.");
            console.error("Failed to save survey:", error);
        }
    };

    const handleDelete = async (surveyId) => {
        try {
            await surveyService.deleteSurvey(surveyId);
            message.success("Survey deleted successfully!");
            fetchSurveys();
        } catch (error) {
            message.error("Failed to delete survey.");
            console.error("Failed to delete survey:", error);
        }
    };

    const handleToggleActive = async (survey) => {
        try {
            if (survey.isActive) {
                await surveyService.deactivateSurvey(survey.surveyId);
                message.success("Survey deactivated.");
            } else {
                await surveyService.activateSurvey(survey.surveyId);
                message.success("Survey activated.");
            }
            fetchSurveys();
        } catch (error) {
            message.error("Failed to toggle survey status.");
        }
    }

    // Tạo menu items cho Dropdown
    const getActionMenuItems = (record) => [
        {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleOpenModal(record),
        },
        {
            key: 'toggle',
            icon: record.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
            label: record.isActive ? 'Deactivate' : 'Activate',
            onClick: () => {
                Modal.confirm({
                    title: `${record.isActive ? 'Deactivate' : 'Activate'} Survey?`,
                    content: `Are you sure you want to ${record.isActive ? 'deactivate' : 'activate'} this survey?`,
                    onOk: () => handleToggleActive(record),
                    okText: 'Yes',
                    cancelText: 'No',
                });
            },
        },
        {
            type: 'divider',
        },
        {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => {
                Modal.confirm({
                    title: 'Delete Survey?',
                    content: 'Are you sure you want to delete this survey and all its responses?',
                    onOk: () => handleDelete(record.surveyId),
                    okText: 'Yes',
                    cancelText: 'No',
                    okButtonProps: { danger: true },
                });
            },
        },
    ];

    const columns = [
        {
            title: 'Tên',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Môn',
            dataIndex: 'courseId',
            key: 'courseId',
            render: (courseId) => {
                const course = courses.find(c => c.courseId === courseId);
                return course ? course.title : 'N/A';
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 100,
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    {/* Nút chính: Manage Questions */}
                    <Tooltip title="Manage Questions">
                        <Button 
                            type="primary"
                            icon={<SettingOutlined />} 
                            onClick={() => onManageQuestions(record.surveyId, record.title)}
                        />
                    </Tooltip>
                    
                    {/* Dropdown cho các actions khác */}
                    <Dropdown
                        menu={{ items: getActionMenuItems(record) }}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button icon={<MoreOutlined />} />
                    </Dropdown>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '0 16px' }}>
            <Space 
                style={{ 
                    marginBottom: 16, 
                    width: '100%',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                }}
            >
                <h2 style={{ margin: 0 }}>Danh sách khảo sát</h2>
                <Space wrap>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
                        Tạo Khảo Sát Mới
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchSurveys} loading={loading}>
                        Tải Lại
                    </Button>
                </Space>
            </Space>
            <Table
                columns={columns}
                dataSource={surveys}
                loading={loading}
                rowKey="surveyId"
                bordered
                scroll={{ x: 800 }}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} surveys`,
                }}
            />
            {/* Modal Create/Edit Survey (Giữ nguyên) */}
            <Modal
                title={editingSurvey ? "Edit Survey" : "Create New Survey"}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                destroyOnClose
                okText={editingSurvey ? "Update" : "Create"}
            >
                <Form form={form} layout="vertical" name="surveyForm">
                    <Form.Item
                        name="title"
                        label="Tên khảo sát"
                        rules={[{ required: true, message: 'Please input the survey title!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item
                        name="courseId"
                        label="Chọn môn cần khảo sát"
                        rules={[{ required: true, message: 'vui lòng chọn môn!' }]}
                    >
                        <Select placeholder="môn học" loading={loadingCourses}>
                            {courses.map(course => (
                                <Option key={course.courseId} value={course.courseId}>
                                    {course.title}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/* Có thể thêm Form.Item cho classId nếu cần */}
                </Form>
            </Modal>
        </div>
    );
};

export default SurveyManagement;