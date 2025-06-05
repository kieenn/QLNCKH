import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, ListGroup, Button, Spinner, Alert, Badge, Pagination, Card } from 'react-bootstrap';
import { CheckCircleFill, EyeFill } from 'react-bootstrap-icons';
import lecturerApiService from '../../services/lecturerApiService';
import { toast } from 'react-toastify';

const AllNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paginationData, setPaginationData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    const fetchNotifications = async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await lecturerApiService.getLecturerNotifications({ page: page, per_page: 10 }); // Lấy 10 thông báo mỗi trang
            setNotifications(response.data.notifications.data || []);
            setPaginationData({
                currentPage: response.data.notifications.current_page,
                lastPage: response.data.notifications.last_page,
                total: response.data.notifications.total,
                perPage: response.data.notifications.per_page,
            });
            setCurrentPage(response.data.notifications.current_page);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError("Không thể tải danh sách thông báo.");
            // toast.error("Không thể tải danh sách thông báo."); // Cân nhắc có nên toast ở đây không vì đã có Alert
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(currentPage);
    }, [currentPage]);

    const handleNotificationClick = (notification) => {
        navigate(`/lecturer/notifications/${notification.id}`, { state: { notification } });
    };

    const handleMarkOneAsRead = async (notificationId, e) => {
        e.stopPropagation(); 
        try {
            await lecturerApiService.markNotificationAsRead(notificationId);
            toast.success("Đã đánh dấu thông báo là đã đọc.");
            setNotifications(prevNotifications =>
                prevNotifications.map(n =>
                    n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
                )
            );
        } catch (err) {
            console.error("Error marking notification as read:", err);
            toast.error("Lỗi khi đánh dấu đã đọc.");
        }
    };

    const handlePageChange = (pageNumber) => {
        if (pageNumber !== currentPage && pageNumber > 0 && pageNumber <= paginationData.lastPage) {
            setCurrentPage(pageNumber);
        }
    };

    if (isLoading && notifications.length === 0) {
        return <Container className="p-4 text-center"><Spinner animation="border" /> Đang tải thông báo...</Container>;
    }

    if (error && notifications.length === 0) {
        return <Container className="p-4"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <Container fluid className="p-4">
            <h2 className="mb-4">Tất cả thông báo</h2>
            {notifications.length === 0 && !isLoading ? (
                <Alert variant="info">Bạn không có thông báo nào.</Alert>
            ) : (
                <ListGroup>
                    {notifications.map(notif => (
                        <ListGroup.Item
                            key={notif.id}
                            action
                            onClick={() => handleNotificationClick(notif)}
                            className={`d-flex justify-content-between align-items-center flex-wrap ${!notif.read_at ? 'list-group-item-warning' : ''}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="flex-grow-1 me-3">
                                <h5 className={`mb-1 ${!notif.read_at ? 'fw-bold' : ''}`}>{notif.data?.title || 'Thông báo không có tiêu đề'}</h5>
                                <p className="mb-1 text-muted" style={{fontSize: '0.9rem'}}>
                                    {notif.data?.body?.substring(0, 150) + (notif.data?.body?.length > 150 ? '...' : '')}
                                </p>
                                <small>Nhận lúc: {new Date(notif.created_at).toLocaleString()}</small>
                                {!notif.read_at && <Badge bg="primary" pill className="ms-2">Mới</Badge>}
                            </div>
                            <div className="d-flex flex-column align-items-end mt-2 mt-md-0">
                                {!notif.read_at && (
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={(e) => handleMarkOneAsRead(notif.id, e)}
                                        className="mb-2"
                                        title="Đánh dấu đã đọc"
                                    >
                                        <CheckCircleFill className="me-1" /> Đánh dấu đã đọc
                                    </Button>
                                )}
                                {/* <Button variant="primary" size="sm" onClick={() => handleNotificationClick(notif)} title="Xem chi tiết">
                                    <EyeFill className="me-1" /> Xem chi tiết
                                </Button> */}
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}

            {paginationData && paginationData.lastPage > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                        {[...Array(paginationData.lastPage).keys()].map(page => (
                            <Pagination.Item key={page + 1} active={page + 1 === currentPage} onClick={() => handlePageChange(page + 1)}>
                                {page + 1}
                            </Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === paginationData.lastPage} />
                        <Pagination.Last onClick={() => handlePageChange(paginationData.lastPage)} disabled={currentPage === paginationData.lastPage} />
                    </Pagination>
                </div>
            )}
        </Container>
    );
};

export default AllNotificationsPage;