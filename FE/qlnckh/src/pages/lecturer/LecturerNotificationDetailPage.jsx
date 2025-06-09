import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'; // Import Link as RouterLink
import { Container, Card, Button, Spinner, Alert, Badge, Breadcrumb } from 'react-bootstrap'; // Thêm Breadcrumb
import { ArrowLeft, CheckCircleFill, Link45deg, ExclamationTriangleFill } from 'react-bootstrap-icons'; // Thêm Link45deg, ExclamationTriangleFill
import lecturerApiService from '../../services/lecturerApiService'; // Đảm bảo import đúng service
import { toast } from 'react-toastify';

const LecturerNotificationDetailPage = () => {
    const navigate = useNavigate();
    const { notificationId } = useParams(); // Lấy notificationId từ URL params

    const [notification, setNotification] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Bắt đầu với trạng thái loading
    const [error, setError] = useState(null);

    console.log("LecturerNotificationDetailPage: Component rendered."); // Log khi component render
    console.log(`LecturerNotificationDetailPage: Component mounted/updated. Current notificationId from URL: ${notificationId}`);
    // useEffect sẽ chạy khi component mount và mỗi khi notificationId thay đổi
    useEffect(() => {
        const fetchDetails = async () => {
            if (!notificationId) {
                setError("ID thông báo không hợp lệ.");
                setIsLoading(false);
                console.error("LecturerNotificationDetailPage: notificationId is missing or invalid before API call."); // Thêm log này
                return;
            }

            console.log(`LecturerNotificationDetailPage: Fetching details for notification ID: ${notificationId}`);
            setIsLoading(true);
            setError(null); // Reset lỗi trước khi fetch

            try {
                // Gọi API mới để lấy chi tiết thông báo
                console.log(`LecturerNotificationDetailPage: Calling API: lecturerApiService.getNotificationDetails(${notificationId})`); // Thêm log này
                const response = await lecturerApiService.getNotificationDetails(notificationId);
                setNotification(response.data); // response.data nên là object thông báo đã được chuẩn hóa từ backend

                // Tự động đánh dấu đã đọc nếu thông báo chưa đọc
                // (Backend API showNotification nên trả về read_at)
                if (response.data && !response.data.read_at) {
                    try {
                        console.log(`LecturerNotificationDetailPage: Marking notification ${notificationId} as read automatically.`);
                        // Note: This markAsRead call is separate from the detail fetch.
                        await lecturerApiService.markNotificationAsRead(notificationId);
                        // Cập nhật trạng thái read_at trong state cục bộ để UI phản ánh ngay
                        setNotification(prev => ({ ...prev, read_at: new Date().toISOString() }));
                        // Không cần toast ở đây, việc xem chi tiết đã ngầm hiểu là đọc
                    } catch (markReadError) {
                        console.warn("Could not mark notification as read automatically:", markReadError);
                        // Không chặn hiển thị nếu đánh dấu đã đọc tự động thất bại
                    }
                }

            } catch (err) {
                console.error(`LecturerNotificationDetailPage: API call failed for ID ${notificationId}. Error details:`, err.response?.data || err.message || err); // Log chi tiết lỗi hơn
                console.error("Error fetching notification details:", err);
                const errorMessage = err.response?.data?.message || "Không thể tải chi tiết thông báo. Thông báo có thể không tồn tại hoặc bạn không có quyền truy cập.";
                setError(errorMessage);
                toast.error(errorMessage); // Hiển thị toast lỗi
                setNotification(null); // Xóa thông báo cũ nếu có lỗi
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();

    }, [notificationId]); // QUAN TRỌNG: useEffect phụ thuộc vào notificationId

    const handleGoBackToList = () => {
        navigate('/lecturer/notifications');
    };

    // Hàm này có thể không cần thiết nữa nếu việc đánh dấu đã đọc được xử lý tự động khi xem
    // hoặc đã được xử lý ở LecturerHeader.jsx
    // const handleMarkAsRead = async () => {
    //     if (!notification || notification.read_at) return;
    //     try {
    //         await lecturerApiService.markNotificationAsRead(notification.id);
    //         setNotification(prev => ({ ...prev, read_at: new Date().toISOString() }));
    //         toast.success("Đã đánh dấu thông báo là đã đọc.");
    //     } catch (err) {
    //         console.error("Error marking notification as read:", err);
    //         toast.error("Lỗi khi đánh dấu đã đọc.");
    //     }
    // };

    if (isLoading) {
        return <Container className="p-4 text-center"><Spinner animation="border" /></Container>;
    }

    if (error) {
        return (
            <Container className="p-4">
                <Breadcrumb className="mb-3">
                    {/* <Breadcrumb.Item linkAs={RouterLink} linkProps={{ to: "/lecturer/dashboard" }}>Bảng điều khiển</Breadcrumb.Item> */}
                    <Breadcrumb.Item linkAs={RouterLink} linkProps={{ to: "/lecturer/notifications" }}>Danh sách thông báo</Breadcrumb.Item>
                    <Breadcrumb.Item active>Lỗi</Breadcrumb.Item>
                </Breadcrumb>
                <Alert variant="danger">
                    <h4>Lỗi tải thông báo</h4>
                    <p>{error}</p>
                    <Button variant="secondary" onClick={handleGoBackToList}>Quay lại danh sách</Button>
                </Alert>
            </Container>
        );
    }

    if (!notification) {
        return (
            <Container className="p-4">
                <Breadcrumb className="mb-3">
                    {/* <Breadcrumb.Item linkAs={RouterLink} linkProps={{ to: "/lecturer/dashboard" }}>Bảng điều khiển</Breadcrumb.Item> */}
                    <Breadcrumb.Item linkAs={RouterLink} linkProps={{ to: "/lecturer/notifications" }}>Danh sách thông báo</Breadcrumb.Item>
                    <Breadcrumb.Item active>Không tìm thấy</Breadcrumb.Item>
                </Breadcrumb>
                <Alert variant="warning">
                    <h4>Không tìm thấy thông báo</h4>
                    <p>Thông báo bạn yêu cầu không tồn tại hoặc đã bị xóa.</p>
                    <Button variant="secondary" onClick={handleGoBackToList}>Quay lại danh sách</Button>
                </Alert>
            </Container>
        );
    }

    // Giả sử notification object từ API đã có cấu trúc phẳng:
    // id, type, title, body, link, details, created_at, read_at
    return (
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                {/* <Breadcrumb.Item linkAs={RouterLink} linkProps={{ to: "/lecturer/dashboard" }}>Bảng điều khiển</Breadcrumb.Item> */}
                <Breadcrumb.Item linkAs={RouterLink} linkProps={{ to: "/lecturer/notifications" }}>Danh sách thông báo</Breadcrumb.Item>
                <Breadcrumb.Item active style={{maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {notification.title || 'Chi tiết'}
                </Breadcrumb.Item>
            </Breadcrumb>

            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">{notification.title || 'Chi tiết thông báo'}</h4>
                    {notification.read_at !== null ? ( // Check explicitly for null
                        <Badge pill bg="success" text="white"><CheckCircleFill className="me-1"/> Đã đọc</Badge>
                    ) : (
                        <Badge pill bg="warning" text="dark">Chưa đọc</Badge>
                    )}
                </Card.Header>
                <Card.Body>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{notification.body || 'Không có nội dung.'}</p>
                    
                    {notification.details && Object.keys(notification.details).length > 0 && (
                        <>
                            <hr />
                            <h6>Thông tin chi tiết:</h6>
                            <ul className="list-unstyled">
                                {Object.entries(notification.details).map(([key, value]) => (
                                    <li key={key}>
                                        <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {String(value)}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    <hr />
                    <p className="text-muted mb-0">
                        Loại: {notification.type || 'Không xác định'}
                    </p>
                    <p className="text-muted">
                        Ngày nhận: {new Date(notification.created_at).toLocaleString()}
                    </p>
                    {notification.read_at !== null && ( // Check explicitly for null
                         <p className="text-muted">
                            Đã đọc lúc: {new Date(notification.read_at).toLocaleString()}
                        </p>
                    )}
                </Card.Body>
                <Card.Footer className="text-end">
                    {/* {notification.link && (
                        <Button variant="primary" onClick={() => navigate(notification.link)} className="me-2">
                            <Link45deg className="me-1"/> Đi đến liên kết
                        </Button>
                    )} */}
                    <Button variant="outline-secondary" onClick={handleGoBackToList}>
                        <ArrowLeft className="me-1" /> Quay lại danh sách
                    </Button>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default LecturerNotificationDetailPage;