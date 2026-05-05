// src/components/modal/PaymentModal.jsx
import { Modal, Button, Typography, Row, Col } from 'antd';
import { WarningOutlined, ShoppingCartOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Contact2Icon } from 'lucide-react';

const { Title, Text } = Typography;

const PaymentModal = ({ visible, courseTitle, courseId }) => {
    const navigate = useNavigate();

    const handleNavigateToPayment = () => {
        // Chuyển hướng đến trang thanh toán (ví dụ)
        navigate(`/payment/${courseId}`);
    };

    const handleClose = () => {
        // Chuyển hướng về trang chủ
        navigate('/elearning');
    };

    return (
        <Modal
            open={visible}
            onCancel={handleClose}
            footer={null}
            closable={false}
            centered
            width={480}
        >
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <WarningOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 24 }} />

                <Title level={3} style={{ margin: 0 }}>Truy cập bị chặn</Title>

                {/* <Text type="secondary" style={{ display: 'block', margin: '16px 0', fontSize: 16 }}>
                    Bạn cần thanh toán để có thể truy cập vào môn học:
                </Text> */}
                <Text type="secondary" style={{ display: 'block', margin: '16px 0', fontSize: 16 }}>
                   Môn này hiện tại đang nằm ngoài chương trình của bạn
                </Text>

                <Title level={4} style={{ marginTop: 0, color: '#1677ff' }}>{courseTitle || "..."}</Title>

                <Row gutter={16} style={{ marginTop: 32 }}>
                    <Col span={12}>
                        <Button
                            block
                            size="large"
                            icon={<CloseCircleOutlined />}
                            onClick={handleClose}
                        >
                            Về trang môn học
                        </Button>
                    </Col>
                    <Col span={12}>
                        <Button
                            type="primary"
                            block
                            size="large"
                            icon={<Contact2Icon />}
                            onClick={handleNavigateToPayment}
                        >
                            Liên hệ người phụ trách
                        </Button>
                    </Col>
                </Row>
            </div>
        </Modal>
    );
};

export default PaymentModal;
