import React, { useState, useEffect } from 'react';
import { Table, Card, Spin, Tag, message, Select, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getPaidReEnrollments } from '../../services/reEnrollmentService';

const { Option } = Select;

const InstructorRetakeStudentsView = () => {
  const [loading, setLoading] = useState(false);
  const [reEnrollments, setReEnrollments] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchRetakeStudents();
  }, []);

  useEffect(() => {
    filterData();
  }, [reEnrollments, selectedStatus]);

  const fetchRetakeStudents = async () => {
    try {
      setLoading(true);
      const response = await getPaidReEnrollments();
      if (response.data && response.data.data) {
        setReEnrollments(response.data.data);
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = reEnrollments;
    
    if (selectedStatus !== 'all') {
      filtered = reEnrollments.filter(item => item.status === selectedStatus);
    }
    
    setFilteredData(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAYMENT_SUCCESS':
        return 'orange';
      case 'RETAKE_ACTIVATED':
        return 'green';
      case 'ENROLLED':
        return 'blue';
      case 'COMPLETED':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PAYMENT_SUCCESS':
        return 'Đã thanh toán';
      case 'RETAKE_ACTIVATED':
        return 'Đã kích hoạt thi lại';
      case 'ENROLLED':
        return 'Đã enroll lớp mới';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      default:
        return status;
    }
  };

  const columns = [
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Thông tin kích hoạt',
      key: 'activation',
      render: (_, record) => {
        if (record.status === 'RETAKE_ACTIVATED') {
          return (
            <div>
              <div style={{ fontSize: '12px' }}>
                <strong>Kích hoạt bởi:</strong> {record.activatedByAdminName || 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.retakeActivatedAt ? new Date(record.retakeActivatedAt).toLocaleString('vi-VN') : 'N/A'}
              </div>
            </div>
          );
        }
        return <span style={{ color: '#999' }}>Chưa kích hoạt</span>;
      },
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <Tag color="green">{amount?.toLocaleString()} {record.currency}</Tag>
      ),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => date ? new Date(date).toLocaleString('vi-VN') : 'N/A',
    },
  ];

  return (
    <Card 
      title="Danh sách sinh viên học lại" 
      style={{ margin: '20px' }}
      extra={
        <Space>
          <Select
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: 200 }}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="PAYMENT_SUCCESS">Đã thanh toán</Option>
            <Option value="RETAKE_ACTIVATED">Đã kích hoạt thi lại</Option>
            <Option value="ENROLLED">Đã enroll lớp mới</Option>
            <Option value="COMPLETED">Đã hoàn thành</Option>
          </Select>
        </Space>
      }
    >
      <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f9ff', borderRadius: 4, border: '1px solid #bae7ff' }}>
        <p><strong>Hướng dẫn:</strong></p>
        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
          <li><strong>"Đã thanh toán":</strong> Sinh viên đã đóng tiền học lại, đang chờ admin kích hoạt</li>
          <li><strong>"Đã kích hoạt thi lại":</strong> Sinh viên có thể làm lại bài kiểm tra ở lớp hiện tại</li>
          <li><strong>"Đã enroll lớp mới":</strong> Luồng cũ - sinh viên chuyển sang lớp mới</li>
          <li><strong>"Đã hoàn thành":</strong> Đã cập nhật điểm và hoàn tất quá trình học lại</li>
        </ul>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
          }}
        />
      </Spin>
    </Card>
  );
};

export default InstructorRetakeStudentsView;