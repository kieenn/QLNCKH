import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { ArrowLeft, CheckCircleFill } from 'react-bootstrap-icons';
import lecturerApiService from '../../services/lecturerApiService';
import { toast } from 'react-toastify';

const LecturerNotificationDetailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { notificationId } = useParams();

    // Ưu tiên lấy notification từ state, nếu không có thì fetch
    const [notification, setNotification] = useState(location.state?.notification || null);
    const [isLoading, setIsLoading] = useState(!location.state?.notification);
    const [error, setError] = useState(null);

    const fetchNotificationDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Giả sử API getLecturerNotifications có thể lấy chi tiết một thông báo nếu có ID
            // Hoặc bạn cần một endpoint mới: getLecturerNotificationById(notificationId)
            // Tạm thời, chúng ta sẽ lọc từ danh sách (không tối ưu cho trường hợp chỉ có ID)
            // Để tối ưu, backend nên có endpoint lấy chi tiết 1 notification
            const response = await lecturerApiService.getLecturerNotifications({ per_page: 1000 }); // Lấy nhiều để tìm
            const allNotifications = response.data.notifications.data || [];
            const foundNotification = allNotifications.find(n => n.id === notificationId);
            if (foundNotification) {
                setNotification(foundNotification);
            } else {
                setError("Không tìm thấy thông báo.");
            }
        } catch (err) {
            console.error("Error fetching notification details:", err);
            setError("Không thể tải chi tiết thông báo.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!notification && notificationId) {
            fetchNotificationDetails();
        }
    }, [notificationId, notification]);

    const handleMarkAsRead = async () => {
        if (!notification || notification.read_at) return;
        try {
            await lecturerApiService.markNotificationAsRead(notification.id);
            setNotification(prev => ({ ...prev, read_at: new Date().toISOString() }));
            toast.success("Đã đánh dấu thông báo là đã đọc.");
            // Cập nhật lại danh sách thông báo ở Header (có thể thông qua context hoặc event bus)
            // Hoặc đơn giản là người dùng sẽ thấy nó đã đọc khi quay lại
        } catch (err) {
            console.error("Error marking notification as read:", err);
            toast.error("Lỗi khi đánh dấu đã đọc.");
        }
    };

    if (isLoading) {
        return <Container className="p-4 text-center"><Spinner animation="border" /></Container>;
    }

    if (error) {
        return <Container className="p-4"><Alert variant="danger">{error}</Alert></Container>;
    }

    if (!notification) {
        return <Container className="p-4"><Alert variant="warning">Không có dữ liệu thông báo.</Alert></Container>;
    }

    return (
        <Container fluid className="p-4">
            <Button as={Link} to="/lecturer/notifications" variant="light" className="mb-3">
                <ArrowLeft /> Quay lại danh sách
            </Button>
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">{notification.data?.title || 'Chi tiết thông báo'}</h4>
                    {!notification.read_at && (
                        <Badge pill bg="warning" text="dark">Chưa đọc</Badge>
                    )}
                </Card.Header>
                <Card.Body>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{notification.data?.body || 'Không có nội dung.'}</p>
                    <hr />
                    <p className="text-muted">
                        Ngày nhận: {new Date(notification.created_at).toLocaleString()}
                    </p>
                    {!notification.read_at && (
                        <Button variant="success" onClick={handleMarkAsRead}><CheckCircleFill className="me-1" /> Đánh dấu đã đọc</Button>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default LecturerNotificationDetailPage;