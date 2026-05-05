// File: src/components/notification/NotificationDropdown.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Popover, List, Empty, Button, Typography, Space, Divider, Pagination, Spin, Popconfirm } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNotifications } from './NotificationComponent';
import { selectCurrentUserId } from '../../redux/api/slices/authSlice';
import { useSelector } from 'react-redux';
import './NotificationDropdown.css';

const { Text } = Typography;

const NotificationDropdown = () => {
    const userId = useSelector(selectCurrentUserId);
    const { 
        notifications, 
        unreadCount, 
        loading,
        markAsRead, 
        markAllAsRead, 
        deleteNotification,
        deleteAllRead,
        refreshNotifications,
        page,
        setPage,
        totalPages,
        totalElements,
    } = useNotifications(userId);

    const [displayCount, setDisplayCount] = useState(0);
    const [shouldShake, setShouldShake] = useState(false);
    const hasAnimatedRef = useRef(false);
    const hasCountedUpRef = useRef(false);
    const countIntervalRef = useRef(null);
    const shakeIntervalRef = useRef(null);

    // Hiệu ứng lắc chuông liên tục mỗi 3 giây nếu có thông báo
    useEffect(() => {
        // Clear interval cũ nếu có
        if (shakeIntervalRef.current) {
            clearInterval(shakeIntervalRef.current);
            shakeIntervalRef.current = null;
        }

        if (unreadCount > 0) {
            // Lắc lần đầu ngay lập tức (chỉ khi component mới mount hoặc unreadCount thay đổi từ 0)
            if (!hasAnimatedRef.current) {
                setShouldShake(true);
                hasAnimatedRef.current = true;
                
                // Sau khi lắc xong
                const shakeTimer = setTimeout(() => {
                    setShouldShake(false);
                }, 600); // Lắc trong 0.6 giây

                // Sau đó lắc lại mỗi 3 giây
                shakeIntervalRef.current = setInterval(() => {
                    setShouldShake(true);
                    setTimeout(() => {
                        setShouldShake(false);
                    }, 600);
                }, 3000); // Lắc lại mỗi 3 giây

                return () => {
                    clearTimeout(shakeTimer);
                    if (shakeIntervalRef.current) {
                        clearInterval(shakeIntervalRef.current);
                        shakeIntervalRef.current = null;
                    }
                };
            } else {
                // Nếu đã lắc lần đầu rồi, chỉ cần set interval lắc lại mỗi 3 giây
                shakeIntervalRef.current = setInterval(() => {
                    setShouldShake(true);
                    setTimeout(() => {
                        setShouldShake(false);
                    }, 600);
                }, 3000); // Lắc lại mỗi 3 giây

                return () => {
                    if (shakeIntervalRef.current) {
                        clearInterval(shakeIntervalRef.current);
                        shakeIntervalRef.current = null;
                    }
                };
            }
        } else {
            // Không còn thông báo thì dừng lắc
            setShouldShake(false);
            hasAnimatedRef.current = false;
            hasCountedUpRef.current = false;
        }
    }, [unreadCount]);

    // Hiệu ứng count-up từ 0 đến unreadCount (chỉ chạy lần đầu)
    useEffect(() => {
        // Clear interval cũ nếu có
        if (countIntervalRef.current) {
            clearInterval(countIntervalRef.current);
            countIntervalRef.current = null;
        }

        if (unreadCount === 0) {
            setDisplayCount(0);
            hasCountedUpRef.current = false;
            return;
        }

        // Nếu đã chạy count-up rồi, chỉ cần hiển thị số thông báo trực tiếp
        if (hasCountedUpRef.current) {
            setDisplayCount(unreadCount);
            return;
        }

        // Chỉ chạy count-up lần đầu tiên
        setDisplayCount(0);

        // Đợi animation lắc xong rồi mới bắt đầu count-up
        const delay = hasAnimatedRef.current ? 400 : 200;
        
        const timer = setTimeout(() => {
            const duration = 1000; // 1 giây để count từ 0 đến số cuối (mượt hơn)
            const startTime = Date.now();

            countIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Sử dụng easing function để animation mượt hơn (ease-out)
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const newCount = Math.floor(easedProgress * unreadCount);
                setDisplayCount(newCount);

                if (progress >= 1) {
                    setDisplayCount(unreadCount);
                    hasCountedUpRef.current = true;
                    if (countIntervalRef.current) {
                        clearInterval(countIntervalRef.current);
                        countIntervalRef.current = null;
                    }
                }
            }, 16); // ~60fps để mượt mắt
        }, delay);

        return () => {
            clearTimeout(timer);
            if (countIntervalRef.current) {
                clearInterval(countIntervalRef.current);
                countIntervalRef.current = null;
            }
        };
    }, [unreadCount]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const content = (
        <div className="notification-dropdown">
            <div className="notification-header">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong>Thông báo {unreadCount > 0 && `(${unreadCount})`}</Text>
                    <Space>
                        <Button
                            type="text"
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={refreshNotifications}
                            title="Làm mới"
                        />
                        {unreadCount > 0 && (
                            <Button
                                type="link"
                                size="small"
                                icon={<CheckOutlined />}
                                onClick={markAllAsRead}
                            >
                                Đánh dấu tất cả đã đọc
                            </Button>
                        )}
                        {notifications.some(n => n.isRead) && (
                            <Popconfirm
                                title="Xóa tất cả thông báo đã đọc?"
                                onConfirm={deleteAllRead}
                                okText="Xóa"
                                cancelText="Hủy"
                            >
                                <Button
                                    type="link"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                >
                                    Xóa đã đọc
                                </Button>
                            </Popconfirm>
                        )}
                    </Space>
                </Space>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <Spin spinning={loading}>
                <div className="notification-list-container">
                    {notifications.length === 0 ? (
                        <Empty
                            description="Không có thông báo"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            style={{ padding: '20px 0' }}
                        />
                    ) : (
                        <>
                            <List
                                dataSource={notifications}
                                renderItem={(notification) => (
                                    <List.Item
                                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                        style={{ cursor: 'pointer' }}
                                        actions={[
                                            <Popconfirm
                                                title="Xóa thông báo này?"
                                                onConfirm={() => deleteNotification(notification.notificationId)}
                                                okText="Xóa"
                                                cancelText="Hủy"
                                            >
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Popconfirm>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            onClick={() => {
                                                if (!notification.isRead) {
                                                    markAsRead(notification.notificationId);
                                                }
                                            }}
                                            title={
                                                <Space>
                                                    <Text strong={!notification.isRead}>
                                                        {notification.title}
                                                    </Text>
                                                    {!notification.isRead && (
                                                        <span className="unread-dot" />
                                                    )}
                                                </Space>
                                            }
                                            description={
                                                <div>
                                                    <Text type="secondary">{notification.message}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {formatDate(notification.createdAt)}
                                                    </Text>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                            {totalPages > 1 && (
                                <div style={{ padding: '12px', textAlign: 'center' }}>
                                    <Pagination
                                        current={page + 1}
                                        total={totalElements}
                                        pageSize={10}
                                        showSizeChanger={false}
                                        showQuickJumper
                                        showTotal={(total) => `Tổng ${total} thông báo`}
                                        onChange={(newPage) => setPage(newPage - 1)}
                                        size="small"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Spin>
        </div>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            placement="bottomRight"
            overlayClassName="notification-popover"
            overlayStyle={{ width: '400px', maxHeight: '600px' }}
        >
            <Button
                type="text"
                size="large"
                icon={<BellOutlined />}
                className={shouldShake ? 'notification-bell-shake' : ''}
                style={{ position: 'relative' }}
            >
                {unreadCount > 0 && (
                    <span className="notification-badge">{displayCount}</span>
                )}
            </Button>
        </Popover>
    );
};

export default NotificationDropdown;