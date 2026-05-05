import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, message, Card, Spin, Tag } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { getPaidReEnrollments } from '../../services/reEnrollmentService';
import { updateExamScoreForReEnrollment } from '../../services/gradeService';

const ReEnrollmentExamScoreManager = () => {
  const [loading, setLoading] = useState(false);
  const [reEnrollments, setReEnrollments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReEnrollment, setSelectedReEnrollment] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPaidReEnrollments();
  }, []);

  const fetchPaidReEnrollments = async () => {
    try {
      setLoading(true);
      const response = await getPaidReEnrollments();
      if (response.data && response.data.data) {
        setReEnrollments(response.data.data);
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách học lại: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExamScore = (record) => {
    setSelectedReEnrollment(record);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Gọi API để cập nhật điểm exam
      const response = await updateExamScoreForReEnrollment(
        selectedReEnrollment.studentId,
        selectedReEnrollment.classId,
        selectedReEnrollment.courseId,
        values.examScore
      );

      if (response.data) {
        message.success('Cập nhật điểm exam thành công!');
        setIsModalVisible(false);
        fetchPaidReEnrollments(); // Refresh danh sách
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật điểm: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedReEnrollment(null);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Sinh viên',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (name, record) => (
        <div>
          <div><strong>{name}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.studentId}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.studentEmail}</div>
        </div>
      ),
    },
    {
      title: 'Môn học',
      dataIndex: 'courseName',
      key: 'courseName',
      render: (courseName, record) => (
        <div>
          <div><strong>{courseName}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>Lớp: {record.className}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Điểm hiện tại: {record.currentExamScore ?? 'Chưa có'}</div>
        </div>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => `${amount?.toLocaleString()} ${record.currency}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'PAYMENT_SUCCESS' ? 'green' : 
                    status === 'ENROLLED' ? 'blue' : 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Cập nhật lúc',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => date ? new Date(date).toLocaleString('vi-VN') : 'N/A',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => handleUpdateExamScore(record)}
          size="small"
        >
          Cập nhật điểm exam
        </Button>
      ),
    },
  ];

  return (
    <Card title="Quản lý điểm exam cho học lại" style={{ margin: '20px' }}>
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={reEnrollments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
          }}
        />
      </Spin>

      <Modal
        title="Cập nhật điểm exam"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            examScore: 0,
          }}
        >
          <Form.Item
            label="Điểm exam"
            name="examScore"
            rules={[
              {
                required: true,
                message: 'Vui lòng nhập điểm exam!',
              },
              {
                type: 'number',
                min: 0,
                max: 10,
                message: 'Điểm exam phải từ 0 đến 10!',
              },
            ]}
          >
            <InputNumber
              min={0}
              max={10}
              step={0.1}
              precision={1}
              style={{ width: '100%' }}
              placeholder="Nhập điểm exam (0-10)"
            />
          </Form.Item>

          {selectedReEnrollment && (
            <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
              <h4>Thông tin chi tiết:</h4>
              <p><strong>Sinh viên:</strong> {selectedReEnrollment.studentName} (ID: {selectedReEnrollment.studentId})</p>
              <p><strong>Email:</strong> {selectedReEnrollment.studentEmail}</p>
              <p><strong>Môn học:</strong> {selectedReEnrollment.courseName}</p>
              <p><strong>Lớp:</strong> {selectedReEnrollment.className}</p>
              <p><strong>Điểm exam hiện tại:</strong> {selectedReEnrollment.currentExamScore ?? 'Chưa có điểm'}</p>
              <p><strong>Trạng thái:</strong> <Tag color="green">{selectedReEnrollment.status}</Tag></p>
              <p><strong>Số tiền đã thanh toán:</strong> {selectedReEnrollment.amount?.toLocaleString()} {selectedReEnrollment.currency}</p>
            </div>
          )}
        </Form>
      </Modal>
    </Card>
  );
};

export default ReEnrollmentExamScoreManager;