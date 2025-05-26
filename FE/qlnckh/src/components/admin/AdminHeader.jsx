// src/components/admin/AdminHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Navbar, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { FaBell, FaUserCircle, FaSignOutAlt, FaCogs } from 'react-icons/fa';
import { 
    initPusher, 
    subscribeToAdminNotifications, 
    unsubscribeFromAdminNotifications,
    // disconnectPusher // Bạn có thể import nếu muốn disconnect hoàn toàn khi logout
} from '../../services/pusherService';
import { fetchCsrfToken } from '../../api/axiosConfig';
// import { toast } from 'react-toastify'; // Xóa import toast ở đây

const AdminHeader = () => {
    const { user, logout } = useAuth();
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    
    // Sử dụng useRef để theo dõi trạng thái đã subscribe Pusher hay chưa.
    // useRef không gây re-render khi giá trị thay đổi và giữ nguyên giá trị qua các lần render.
    const pusherSubscribedRef = useRef(false);

    useEffect(() => {
        // Định nghĩa handleNewNotification bên trong useEffect.
        // Khi useEffect chạy lại (do user thay đổi), một instance mới của handleNewNotification
        // với closure đúng cho state hiện tại (setNotifications, setNotificationCount) sẽ được tạo ra.
        const handleNewNotification = (data) => {
            console.log("AdminHeader: handleNewNotification CALLED with data:", data);
            if (data && data.payload) { // Đảm bảo data và payload tồn tại
                // Thêm thông báo mới (chứa payload đầy đủ) vào đầu danh sách và giới hạn số lượng hiển thị
                // Lưu trữ cả eventType và payload để có thể xử lý linh hoạt hơn trong dropdown
                setNotifications(prev => [{ eventType: data.eventType, payload: data.payload }, ...prev].slice(0, 10)); 
                setNotificationCount(prevCount => prevCount + 1);
                // Không hiển thị toast ở đây nữa, AdminNotificationListener sẽ làm việc này
            } else {
                console.warn("AdminHeader: Received notification without payload:", data);
            }
        };

        const initializeAndSubscribe = async () => {
            if (user) { // Nếu người dùng đã đăng nhập
                if (!pusherSubscribedRef.current) { // Và chưa từng subscribe trong session/mount này
                    try {
                        console.log("AdminHeader: Attempting to initialize and subscribe Pusher.");
                        await fetchCsrfToken();
                        const pusherClientInstance = initPusher(); // initPusher trả về client hoặc null
                        
                        if (pusherClientInstance) { 
                            subscribeToAdminNotifications(handleNewNotification);
                            pusherSubscribedRef.current = true; 
                            console.log("AdminHeader: Pusher subscribed successfully.");
                        } else {
                            // Điều này xảy ra nếu initPusher trả về null (ví dụ: thiếu key/cluster)
                            console.error("AdminHeader: Failed to initialize Pusher client (initPusher returned null/falsy).");
                        }
                    } catch (error) {
                        console.error("AdminHeader: Error during Pusher initialization or subscription:", error);
                    }
                } else { 
                    // Nếu đã subscribe trước đó (pusherSubscribedRef.current là true)
                    // Chỉ cần gọi lại subscribeToAdminNotifications để pusherService cập nhật
                    // currentAdminNotificationCallback bằng phiên bản mới nhất của handleNewNotification.
                    console.log("AdminHeader: Pusher already subscribed, ensuring callback is updated.");
                    subscribeToAdminNotifications(handleNewNotification); 
                }
            } else { // Nếu người dùng không đăng nhập (user là null)
                if (pusherSubscribedRef.current) { // Và trước đó đã từng subscribe
                    console.log("AdminHeader: User logged out or not present, cleaning up Pusher subscription.");
                    unsubscribeFromAdminNotifications();
                    pusherSubscribedRef.current = false;
                    // Nếu bạn muốn ngắt kết nối Pusher hoàn toàn khi logout:
                    // disconnectPusher(); 
                }
            }
        };

        initializeAndSubscribe();

        // Hàm dọn dẹp (cleanup function)
        // Sẽ chạy khi component unmount, HOẶC trước mỗi lần effect chạy lại do 'user' thay đổi.
        return () => {
            // Chỉ unsubscribe nếu đã từng subscribe thành công
            if (pusherSubscribedRef.current) {
                console.log("AdminHeader: useEffect cleanup - Unsubscribing due to unmount or user change.");
                unsubscribeFromAdminNotifications();
                pusherSubscribedRef.current = false; 
            }
        };
    }, [user]); // useEffect này chỉ phụ thuộc vào 'user'.

    const handleNotificationClick = (topicId) => {
        console.log("Navigate to topic:", topicId);
        // TODO: Implement navigation, e.g., using useNavigate() from react-router-dom
        // navigate(`/admin/research-topics/${topicId}`);
        
        // Xóa thông báo khỏi danh sách hoặc đánh dấu đã đọc
        // Ví dụ: đánh dấu đã đọc bằng cách không hiển thị lại hoặc thay đổi style
        setNotifications(prev => prev.filter(n => n.topic_id !== topicId)); // Xóa khỏi list hiển thị
        setNotificationCount(prev => Math.max(0, prev - 1)); // Giảm count
    };    

    return (
        <Navbar bg="white" expand="lg" className="shadow-sm px-3 topbar static-top" style={{ zIndex: 1030 }}> {/* Ensure header is above toast */}
            {/* Phần search form có thể giữ lại hoặc bỏ đi tùy ý bạn */}
            {/* <Form className="d-none d-sm-inline-block me-auto ms-md-3 my-2 my-md-0 mw-100"> ... </Form> */}

            <Nav className="ms-auto align-items-center">
                <NavDropdown
                    className="mx-1"
                    title={
                        <>
                            <FaBell />
                            {notificationCount > 0 && (
                                <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle p-1" style={{ fontSize: '0.6em' }}>
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                    <span className="visually-hidden">unread messages</span>
                                </Badge>
                            )}
                        </>
                    }
                    id="alertsDropdown"
                    align="end"
                >
                    {notifications.length === 0 ? (
                        <NavDropdown.ItemText>Không có thông báo mới</NavDropdown.ItemText>
                    ) : (
                        notifications.map((notif, index) => ( // Hiển thị các thông báo đã nhận
                            // Sử dụng ID duy nhất từ payload nếu có, ví dụ bai_bao_id hoặc topic_id
                            <NavDropdown.Item 
                                key={notif.payload?.bai_bao_id || notif.payload?.topic_id || `notif-${index}`} 
                                onClick={() => handleNotificationClick(notif.payload?.topic_id || notif.payload?.bai_bao_id)}
                            >
                                {notif.payload?.submitted_at && (
                                    <div className="small text-gray-500">{new Date(notif.payload.submitted_at).toLocaleString()}</div>
                                )}
                                {/* Hiển thị message chi tiết từ payload */}
                                <span className="fw-bold">{notif.payload?.message || 'Thông báo không có nội dung.'}</span>
                                <div className="small text-muted">{notif.eventType === 'bai-bao.submitted' ? 'Bài báo mới' : 'Đề tài mới'}</div>
                            </NavDropdown.Item>
                        ))
                    )}
                    {notifications.length > 0 && <NavDropdown.Divider />}
                    {notifications.length > 0 && 
                        <NavDropdown.Item as={Link} to="/admin/notifications" className="text-center small text-gray-500">
                            Xem tất cả thông báo
                        </NavDropdown.Item> /* Giả sử có trang xem tất cả */
                    }
                </NavDropdown>

                <div className="topbar-divider d-none d-sm-block mx-2 border-end" style={{height: '30px'}}></div>

                <NavDropdown
                    title={
                        <>
                            <span className="me-2 d-none d-lg-inline text-gray-600 small">{user?.hoTen || 'Admin'}</span>
                            <FaUserCircle size={24} />
                        </>
                    }
                    id="user-dropdown"
                    align="end"
                >
                    <NavDropdown.Item as={Link} to="/admin/profile">
                        <FaUserCircle className="me-2 text-gray-400" /> Hồ sơ
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/settings">
                        <FaCogs className="me-2 text-gray-400" /> Cài đặt
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={logout}>
                        <FaSignOutAlt className="me-2 text-gray-400" /> Đăng xuất
                    </NavDropdown.Item>
                </NavDropdown>
            </Nav>
        </Navbar>
    );
};

export default AdminHeader;
