import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Card, Spin, Tag, message, Space } from 'antd';
import { CheckOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { getPendingActivationReEnrollments, activateRetakeExam } from '../../services/reEnrollmentService';

const RetakeExamActivationManager = () => {
  const [loading, setLoading] = useState(false);
  const [reEnrollments, setReEnrollments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReEnrollment, setSelectedReEnrollment] = useState(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetchPendingActivations();
  }, []);

  const fetchPendingActivations = async () => {
    try {
      setLoading(true);
      const response = await getPendingActivationReEnrollments();
      if (response.data && response.data.data) {
        setReEnrollments(response.data.data);
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedReEnrollment(record);
    setIsModalVisible(true);
  };

  const handleActivateRetake = async (reEnrollmentId) => {
    try {
      setActivating(true);
      const response = await activateRetakeExam(reEnrollmentId);
      
      if (response.data) {
        message.success('Đã kích hoạt quyền làm lại bài kiểm tra thành công!');
        fetchPendingActivations(); // Refresh danh sách
      }
    } catch (error) {
      message.error('Lỗi khi kích hoạt: ' + (error.response?.data?.error || error.message));
    } finally {
      setActivating(false);
    }
  };

  const handleModalClose = () => {
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
        </div>
      ),
    },
    {
      title: 'Số tiền đã thanh toán',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <Tag color="green">{amount?.toLocaleString()} {record.currency}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="orange">{status}</Tag>
      ),
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
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            Chi tiết
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleActivateRetake(record.id)}
            loading={activating}
            size="small"
          >
            Kích hoạt thi lại
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="Quản lý kích hoạt quyền thi lại" 
      style={{ margin: '20px' }}
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchPendingActivations}
          loading={loading}
        >
          Làm mới
        </Button>
      }
    >
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
        title="Chi tiết yêu cầu học lại"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Đóng
          </Button>,
          <Button
            key="activate"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              handleActivateRetake(selectedReEnrollment.id);
              handleModalClose();
            }}
            loading={activating}
          >
            Kích hoạt thi lại
          </Button>,
        ]}
      >
        {selectedReEnrollment && (
          <div>
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
              <h4>Thông tin sinh viên:</h4>
              <p><strong>Tên:</strong> {selectedReEnrollment.studentName}</p>
              <p><strong>Email:</strong> {selectedReEnrollment.studentEmail}</p>
              <p><strong>ID:</strong> {selectedReEnrollment.studentId}</p>
            </div>
            
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 4 }}>
              <h4>Thông tin môn học:</h4>
              <p><strong>Môn học:</strong> {selectedReEnrollment.courseName}</p>
              <p><strong>Lớp:</strong> {selectedReEnrollment.className}</p>
              <p><strong>Điểm exam hiện tại:</strong> {selectedReEnrollment.currentExamScore ?? 'Chưa có điểm'}</p>
            </div>

            <div style={{ padding: 16, backgroundColor: '#f6ffed', borderRadius: 4 }}>
              <h4>Thông tin thanh toán:</h4>
              <p><strong>Số tiền:</strong> {selectedReEnrollment.amount?.toLocaleString()} {selectedReEnrollment.currency}</p>
              <p><strong>Trạng thái:</strong> <Tag color="green">{selectedReEnrollment.status}</Tag></p>
              <p><strong>Cập nhật lúc:</strong> {selectedReEnrollment.updatedAt ? new Date(selectedReEnrollment.updatedAt).toLocaleString('vi-VN') : 'N/A'}</p>
            </div>

            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
              <p><strong>Lưu ý:</strong> Sau khi kích hoạt, sinh viên sẽ có quyền làm lại các bài kiểm tra trong môn học này mà không cần chuyển sang lớp mới.</p>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default RetakeExamActivationManager;