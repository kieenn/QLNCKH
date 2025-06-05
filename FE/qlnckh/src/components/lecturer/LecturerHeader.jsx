// c:\Users\maing\OneDrive\Documents\GitHub\QLNCKH\FE\qlnckh\src\components\lecturer\LecturerHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, NavDropdown, Badge, Button, Spinner } from 'react-bootstrap';
import { Bell, CheckCircle, Eye } from 'react-bootstrap-icons';
import { Link, useNavigate } from 'react-router-dom';
import lecturerApiService from '../../services/lecturerApiService'; // Giả sử bạn có service này
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth'; // Giả sử bạn có hook này để lấy thông tin user
import {
    initPusher,
    subscribeToLecturerNotifications,
    unsubscribeFromLecturerNotifications
} from '../../services/pusherService';
import { fetchCsrfToken } from '../../api/axiosConfig'; // Cần thiết cho Pusher auth
// import './LecturerHeader.css'; // Tạo file CSS này để style

// Giả sử bạn có một context để chia sẻ state thông báo
// import { useNotificationContext } from '../../contexts/NotificationContext';


const LecturerHeader = () => {
    // Nếu dùng context:
    // const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationContext();

    // Nếu không dùng context, quản lý state tại đây (ví dụ, được truyền từ LecturerNotificationListener)
    // Props này sẽ được truyền từ LecturerNotificationListener hoặc một component cha quản lý state
    const { user } = useAuth(); // Lấy thông tin user, giả sử có trường msvc
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const pusherSubscribedRef = useRef(false);


    const fetchNotificationsData = async () => {
        setIsLoading(true);
        try {
            const response = await lecturerApiService.getLecturerNotifications();
            // console.log("Fetched notifications:", response.data); // Log để kiểm tra cấu trúc
            setNotifications(response.data.notifications.data || []);
            setUnreadCount(response.data.unread_count || 0);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            // toast.error("Không thể tải thông báo."); // Có thể bỏ toast ở đây để tránh spam khi load trang
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch thông báo ban đầu khi component mount
    useEffect(() => {
        fetchNotificationsData();
        // Không cần interval nữa vì sẽ dùng Pusher
    }, []);

    // Effect for Pusher initialization and subscription
    useEffect(() => {
        const lecturerMsvc = user?.msvc; // Giả sử user object có trường msvc (Mã số giảng viên)

        const handleNewLecturerNotification = (notificationEvent) => {
            console.log("LecturerHeader: New notification received via Pusher:", notificationEvent);
            // Backend PHẢI gửi một object thông báo hoàn chỉnh trong payload, bao gồm:
            // id: ID thực sự của thông báo trong DB
            // data: { title: '...', body: '...' }
            // created_at: 'YYYY-MM-DD HH:MM:SS'
            // (read_at sẽ là null cho thông báo mới)

            if (notificationEvent && notificationEvent.payload && notificationEvent.payload.id) {
                const payloadData = notificationEvent.payload;

                const newNotification = {
                    id: payloadData.id, // QUAN TRỌNG: Sử dụng ID từ payload do backend cung cấp
                    data: payloadData.data || { title: 'Thông báo không có tiêu đề', body: '' }, // Đảm bảo 'data' object tồn tại
                    created_at: payloadData.created_at || new Date().toISOString(), // Lấy created_at từ payload hoặc fallback
                    read_at: null, // Thông báo mới luôn chưa đọc
                    // Các trường khác mà backend có thể gửi và bạn muốn sử dụng
                };

                setNotifications(prevNotifications => {
                    // Tránh thêm thông báo trùng lặp nếu có (dựa vào ID)
                    if (prevNotifications.some(n => n.id === newNotification.id)) {
                        console.log("LecturerHeader: Notification already exists, not adding:", newNotification.id);
                        return prevNotifications;
                    }
                    // Thêm thông báo mới vào đầu danh sách và giới hạn số lượng
                    return [newNotification, ...prevNotifications].slice(0, 10); // Giới hạn 10 thông báo trong dropdown
                });
                setUnreadCount(prevCount => prevCount + 1);
                toast.info(`Thông báo mới: ${newNotification.data?.title || 'Nội dung không xác định'}`, { autoClose: 8000 });
            } else {
                console.warn(
                    "LecturerHeader: Received Pusher notification without a valid payload or 'id'. Notification was not added. Event data:",
                    notificationEvent
                );
                // Không thêm thông báo này vào state nếu nó không có ID hợp lệ từ backend,
                // vì các hành động sau đó (mark as read, view details) sẽ thất bại.
            }
        };

        const initializeAndSubscribe = async () => {
            // Chỉ subscribe khi có user và msvc
            if (user && lecturerMsvc) {
                // Chỉ subscribe nếu chưa subscribe trong session/mount này
                if (!pusherSubscribedRef.current) {
                    try {
                        console.log("LecturerHeader: Attempting to initialize and subscribe Pusher for MSVC:", lecturerMsvc);
                        await fetchCsrfToken(); // Đảm bảo CSRF token đã được fetch
                        const pusherClientInstance = initPusher(); // initPusher trả về client hoặc null

                        if (pusherClientInstance) {
                            // Đăng ký kênh riêng của giảng viên
                            subscribeToLecturerNotifications(lecturerMsvc, handleNewLecturerNotification);
                            pusherSubscribedRef.current = true;
                            console.log(`LecturerHeader: Pusher subscribed successfully for MSVC ${lecturerMsvc}.`);
                        } else {
                            console.error("LecturerHeader: Failed to initialize Pusher client (initPusher returned null/falsy).");
                        }
                    } catch (error) {
                        console.error("LecturerHeader: Error during Pusher initialization or subscription:", error);
                    }
                } else {
                    // Nếu đã subscribe trước đó, chỉ cần đảm bảo callback được cập nhật
                    // (pusherService.js đã xử lý việc này bằng cách cập nhật currentLecturerNotificationCallback)
                    console.log("LecturerHeader: Pusher already subscribed, ensuring callback is updated for MSVC:", lecturerMsvc);
                    subscribeToLecturerNotifications(lecturerMsvc, handleNewLecturerNotification);
                }
            } else {
                 // Nếu người dùng không đăng nhập hoặc không có msvc, hủy đăng ký nếu có
                if (pusherSubscribedRef.current) {
                    console.log("LecturerHeader: User logged out or MSVC not present, cleaning up Pusher subscription.");
                    unsubscribeFromLecturerNotifications();
                    pusherSubscribedRef.current = false;
                    // Có thể reset state thông báo nếu cần
                    setNotifications([]);
                    setUnreadCount(0);
                }
            }
        };

        initializeAndSubscribe();

        // Hàm dọn dẹp (cleanup function)
        // Sẽ chạy khi component unmount, HOẶC trước mỗi lần effect chạy lại do 'user' thay đổi.
        return () => {
            // Chỉ unsubscribe nếu đã từng subscribe thành công
            if (pusherSubscribedRef.current) {
                console.log("LecturerHeader: useEffect cleanup - Unsubscribing due to unmount or user change.");
                unsubscribeFromLecturerNotifications();
                pusherSubscribedRef.current = false;
            }
        };
    }, [user]); // useEffect này chỉ phụ thuộc vào 'user'.

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    const handleNotificationClick = async (notification) => {
        setShowDropdown(false); // Đóng dropdown khi click

        if (!notification || !notification.id) {
            console.error("LecturerHeader: Cannot process notification click, notification or ID is missing.", notification);
            toast.error("Lỗi: Không thể xử lý thông báo này.");
            return;
        }

        // Đánh dấu thông báo là đã đọc nếu nó chưa đọc
        if (!notification.read_at) {
             try {
                await lecturerApiService.markNotificationAsRead(notification.id);
                // Cập nhật state cục bộ thay vì fetch lại toàn bộ
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
                // Không cần toast ở đây, hành động click đã ngầm hiểu là đọc
            } catch (error) {
                console.error(`Error marking notification ${notification.id} as read on click:`, error);
                // Nếu API báo lỗi (ví dụ: 404 Not Found), có thể thông báo này thực sự chưa có ở backend
                // hoặc có vấn đề với ID. Tuy nhiên, vẫn điều hướng để người dùng xem.
                // Trang chi tiết có thể có logic riêng để xử lý.
            }
        }

        // Chuyển hướng đến trang chi tiết thông báo
        navigate(`/lecturer/notifications/${notification.id}`);
    };

    // Hàm này sẽ được gọi khi click vào nút "Xem tất cả thông báo"
    // hoặc khi muốn điều hướng đến trang danh sách thông báo chung
    const handleViewAllNotifications = () => {
        setShowDropdown(false);
        navigate('/lecturer/notifications'); // Điều hướng đến trang danh sách thông báo
    };


    const handleMarkOneAsRead = async (notificationId, e) => {
        e.stopPropagation(); // Ngăn việc click vào item chính

        if (!notificationId) {
            console.error("LecturerHeader: Cannot mark notification as read, ID is missing.");
            toast.error("Lỗi: Không thể đánh dấu thông báo này đã đọc.");
            return;
        }
        try {
            await lecturerApiService.markNotificationAsRead(notificationId);
            // Cập nhật state cục bộ thay vì fetch lại toàn bộ
             setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
            toast.success("Đã đánh dấu thông báo là đã đọc.");
        } catch (error) {
            console.error(`Error marking notification ${notificationId} as read:`, error);
            toast.error("Lỗi khi đánh dấu đã đọc.");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await lecturerApiService.markAllNotificationsAsRead();
            // Cập nhật state cục bộ thay vì fetch lại toàn bộ
            setNotifications(prev => prev.map(n =>
                 n.read_at ? n : { ...n, read_at: new Date().toISOString() } // Chỉ cập nhật những cái chưa đọc
            ));
            setUnreadCount(0); // Set count về 0
            // toast.success("Đã đánh dấu tất cả thông báo là đã đọc."); // Bỏ toast khi đánh dấu tất cả đã đọc
            setShowDropdown(false);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            toast.error("Lỗi khi đánh dấu tất cả đã đọc.");
        }
    };

    return (
        <Navbar bg="white" expand="lg" className="border-bottom shadow-sm lecturer-header">
            {/* <Navbar.Brand as={Link} to="/lecturer/dashboard" className="fw-bold">QLNCKH</Navbar.Brand> */}
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="ms-auto align-items-center">
                    <NavDropdown
                        ref={dropdownRef}
                        show={showDropdown}
                        onToggle={() => setShowDropdown(!showDropdown)}
                        title={
                            <>
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <Badge pill bg="danger" style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.6em' }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Badge>
                                )}
                            </>
                        }
                        id="notification-dropdown"
                        align="end"
                        className="notification-dropdown-menu"
                    >
                        <NavDropdown.Header className="d-flex justify-content-between align-items-center">
                            <span>Thông báo</span>
                            {notifications.length > 0 && unreadCount > 0 && (
                                <Button variant="link" size="sm" onClick={handleMarkAllAsRead} className="p-0 text-decoration-none">
                                    Đánh dấu tất cả đã đọc
                                </Button>
                            )}
                        </NavDropdown.Header>
                        <NavDropdown.Divider />
                        {isLoading && <div className="text-center p-2"><Spinner animation="border" size="sm" /> Đang tải...</div>}
                        {!isLoading && notifications.length === 0 && <NavDropdown.ItemText>Không có thông báo mới.</NavDropdown.ItemText>}
                        {!isLoading && notifications.map(notif => (
                            <NavDropdown.Item key={notif.id} onClick={() => handleNotificationClick(notif)} className={!notif.read_at ? 'fw-bold unread-notification' : 'read-notification'}>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div style={{ maxWidth: '280px', overflow: 'hidden' }}> {/* Giới hạn chiều rộng và ẩn phần tràn */}
                                        <p className="mb-0 notification-title text-truncate">{notif.data?.title || 'Thông báo không có tiêu đề'}</p>
                                        <small className="text-muted notification-body">{notif.data?.body?.substring(0, 70) + (notif.data?.body?.length > 70 ? '...' : '')}</small>
                                        <br/>
                                        <small className="text-muted">{new Date(notif.created_at).toLocaleString()}</small>
                                    </div>
                                    {!notif.read_at && (
                                        <Button variant="link" size="sm" onClick={(e) => handleMarkOneAsRead(notif.id, e)} title="Đánh dấu đã đọc" className="p-0 ms-2">
                                            <CheckCircle color="green" />
                                        </Button>
                                    )}
                                </div>
                            </NavDropdown.Item>
                        ))}
                         <NavDropdown.Divider />
                        <NavDropdown.Item onClick={handleViewAllNotifications} className="text-center">
                            Xem tất cả thông báo
                        </NavDropdown.Item>
                    </NavDropdown>
                    {/* Các mục khác trên Header như User Profile Dropdown */}
                    <NavDropdown title={user?.hoTen || "Giảng viên"} id="user-dropdown" align="end">
                        <NavDropdown.Item as={Link} to="/lecturer/profile">Thông tin cá nhân</NavDropdown.Item>
                        <NavDropdown.Divider />
                        {/* Thay thế onClick này bằng hàm logout thực tế của bạn */}
                        <NavDropdown.Item onClick={() => { console.log("Logout clicked"); /* Xử lý logout */ }}>Đăng xuất</NavDropdown.Item>
                    </NavDropdown>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default LecturerHeader;
