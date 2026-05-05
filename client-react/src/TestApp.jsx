import React from 'react';
import { Typography, Button, Card } from 'antd';

const { Title, Text } = Typography;

const TestApp = () => {
  return (
    <div style={{ 
      padding: '50px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5'
    }}>
      <Card style={{ maxWidth: 600, textAlign: 'center' }}>
        <Title level={1} style={{ color: '#1890ff' }}>
          ✅ Ứng dụng hoạt động
        </Title>
        <Text style={{ fontSize: 16, display: 'block', marginBottom: 20 }}>
          Đây là trang test để kiểm tra React app có render được không.
        </Text>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          Thời gian: {new Date().toLocaleString('vi-VN')}
        </Text>
        <Button 
          type="primary" 
          size="large"
          onClick={() => alert('Button hoạt động!')}
        >
          Test Button
        </Button>
      </Card>
    </div>
  );
};

export default TestApp;