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
    const { user, logout } = useAuth(); // Lấy thông tin user và hàm logout
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
            const fetchedNotifications = response.data.notifications.data || [];
            
            // Transform fetched notifications to the flat structure
            const standardizedNotifications = fetchedNotifications.map(notif => ({
                id: notif.id,
                type: notif.type, // Keep original type if present
                // Standardize to top-level properties, similar to Pusher notifications
                title: notif.data?.details?.deTaiTen ? `Đề tài "${notif.data.details.deTaiTen}" ${notif.data.title?.toLowerCase().includes('duyệt') ? 'đã được duyệt' : (notif.data.title?.toLowerCase().includes('từ chối') ? 'bị từ chối' : '')}` : (notif.data?.details?.baiBaoTen ? `Bài báo "${notif.data.details.baiBaoTen}" ${notif.data.title?.toLowerCase().includes('duyệt') ? 'đã được duyệt' : (notif.data.title?.toLowerCase().includes('từ chối') ? 'bị từ chối' : '')}` : (notif.data?.title || 'Thông báo không có tiêu đề')),
                body: notif.data?.body || '', // Keep original body
                link: notif.data?.link, // Keep original link
                details: notif.data?.details, // Keep original details
                created_at: notif.created_at,
                read_at: notif.read_at,
            }));
            console.log("LecturerHeader: Standardized fetched notifications:", JSON.stringify(standardizedNotifications, null, 2));
            setNotifications(standardizedNotifications);
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
            console.log("LecturerHeader: New notification received via Pusher:", JSON.stringify(notificationEvent, null, 2));
            console.log("LecturerHeader: Accessing notificationEvent.payload.title directly:", notificationEvent?.payload?.title);
            // Backend PHẢI gửi một object thông báo hoàn chỉnh trong payload, bao gồm:
            // id: ID thực sự của thông báo trong DB
            // data: { title: '...', body: '...' }
            // created_at: 'YYYY-MM-DD HH:MM:SS'
            // (read_at sẽ là null cho thông báo mới)

            if (notificationEvent && notificationEvent.payload && notificationEvent.payload.id) {
                const receivedPayload = notificationEvent.payload; // Đây là object phẳng từ BE

                // Tạo tiêu đề chi tiết hơn
                let detailedTitle = receivedPayload.title || 'Thông báo không có tiêu đề';
                if (receivedPayload.details?.deTaiTen) {
                    detailedTitle = `Đề tài "${receivedPayload.details.deTaiTen}" ${receivedPayload.type === 'DeTaiApproved' ? 'đã được duyệt' : (receivedPayload.type === 'DeTaiRejected' ? 'bị từ chối' : '')}`;
                } else if (receivedPayload.details?.baiBaoTen) {
                    detailedTitle = `Bài báo "${receivedPayload.details.baiBaoTen}" ${receivedPayload.type === 'BaiBaoApproved' ? 'đã được duyệt' : (receivedPayload.type === 'BaiBaoRejected' ? 'bị từ chối' : '')}`;
                }


                // Hiển thị toast cho thông báo mới
                toast.info(`Thông báo mới: ${detailedTitle || 'Nội dung không xác định'}`, { autoClose: 8000 });
                
                // Cập nhật số lượng chưa đọc một cách lạc quan
                setUnreadCount(prevCount => prevCount + 1);

                // Quan trọng: Gọi lại fetchNotificationsData để làm mới danh sách từ API
                // Điều này đảm bảo tất cả thông báo trong dropdown đều có ID và dữ liệu từ DB.
                console.log("LecturerHeader: Pusher event received, refetching notifications from API.");
                fetchNotificationsData();

                // Không thêm trực tiếp newNotification (từ Pusher payload) vào state `notifications` nữa
                // vì fetchNotificationsData sẽ cập nhật nó với dữ liệu đầy đủ từ API.
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
            console.error("LecturerHeader: handleNotificationClick - Notification or ID is missing.", JSON.stringify(notification, null, 2));
            toast.error("Lỗi: Không thể xử lý thông báo này.");
            return;
        }
        console.log("LecturerHeader: handleNotificationClick - Clicked notification:", JSON.stringify(notification, null, 2));

        // Tìm thông báo trong state hiện tại để đảm bảo làm việc với dữ liệu mới nhất (tùy chọn, thường không cần thiết nếu state cập nhật đúng)
        // const currentNotificationInState = notifications.find(n => n.id === String(notification.id));
        // console.log("LecturerHeader: handleNotificationClick - Current notification in state:", JSON.stringify(currentNotificationInState, null, 2));
        // const targetNotification = currentNotificationInState || notification;

        // Đánh dấu thông báo là đã đọc nếu nó chưa đọc
        if (!notification.read_at) { // Sử dụng notification trực tiếp từ map
             try {
                await lecturerApiService.markNotificationAsRead(notification.id);
                // Cập nhật state cục bộ thay vì fetch lại toàn bộ
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
                // Không cần toast ở đây, hành động click đã ngầm hiểu là đọc
            } catch (error) {
                console.error(`LecturerHeader: handleNotificationClick - Error marking notification ${notification.id} as read:`, error.response?.data || error.message);
                // Nếu API báo lỗi (ví dụ: 404 Not Found), có thể thông báo này thực sự chưa có ở backend
                // hoặc có vấn đề với ID. Tuy nhiên, vẫn điều hướng để người dùng xem.
                // Trang chi tiết có thể có logic riêng để xử lý.
                // Cân nhắc hiển thị một toast lỗi nhẹ nếu cần, nhưng vẫn cho phép điều hướng.
                // toast.warn("Có lỗi khi đánh dấu đã đọc, nhưng bạn vẫn có thể xem chi tiết.");
            }
        }

        // Chuyển hướng đến trang chi tiết thông báo
        // Đảm bảo ID là chuỗi và hợp lệ
        navigate(`/lecturer/notifications/${String(notification.id)}`);
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
        console.log("LecturerHeader: handleMarkOneAsRead - Marking notification ID:", notificationId);
        try {
            await lecturerApiService.markNotificationAsRead(notificationId);
            // Cập nhật state cục bộ thay vì fetch lại toàn bộ
             setNotifications(prev => prev.map(n =>
                String(n.id) === String(notificationId) ? { ...n, read_at: new Date().toISOString() } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
            toast.success("Đã đánh dấu thông báo là đã đọc.");
        } catch (error) {
            console.error(`LecturerHeader: handleMarkOneAsRead - Error marking notification ${notificationId} as read:`, error.response?.data || error.message);
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
            console.error("LecturerHeader: handleMarkAllAsRead - Error marking all notifications as read:", error.response?.data || error.message);
            toast.error("Lỗi khi đánh dấu tất cả đã đọc.");
        }
    };

    const handleLogout = async () => {
        try {
            await logout(); // Gọi hàm logout từ useAuth
            navigate('/login'); // Hoặc trang đăng nhập của giảng viên
            toast.success("Đăng xuất thành công!");
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Đăng xuất thất bại. Vui lòng thử lại.");
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
                        {!isLoading && notifications.map(notif => {
                            // Log giá trị của notif và notif.title ngay trước khi render
                            console.log("LecturerHeader: Rendering notification item - notif:", JSON.stringify(notif, null, 2));
                            console.log("LecturerHeader: Rendering notification item - notif.title:", notif.title);
                            return (
                                <NavDropdown.Item key={notif.id} onClick={() => handleNotificationClick(notif)} className={!notif.read_at ? 'fw-bold unread-notification' : 'read-notification'}>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div style={{ maxWidth: '280px', overflow: 'hidden' }}>
                                        <p className="mb-0 notification-title text-truncate">{notif.title || 'Thông báo không có tiêu đề'}</p>
                                        <small className="text-muted notification-body">{notif.body?.substring(0, 70) + (notif.body?.length > 70 ? '...' : '')}</small>
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
                            );
                        })}
                         <NavDropdown.Divider />
                        <NavDropdown.Item onClick={handleViewAllNotifications} className="text-center">
                            Xem tất cả thông báo
                        </NavDropdown.Item>
                    </NavDropdown>
                    {/* Các mục khác trên Header như User Profile Dropdown */}
                    <NavDropdown title={user?.hoTen || "Giảng viên"} id="user-dropdown" align="end">
                        <NavDropdown.Item as={Link} to="/lecturer/profile">Thông tin cá nhân</NavDropdown.Item>
                        <NavDropdown.Divider />
                        <NavDropdown.Item onClick={handleLogout}>Đăng xuất</NavDropdown.Item>
                    </NavDropdown>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default LecturerHeader;
