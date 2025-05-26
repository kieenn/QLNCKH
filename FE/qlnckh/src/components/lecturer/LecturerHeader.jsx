// c:\Users\maing\OneDrive\Documents\KLTN\project\FE\qlnckh\src\components\lecturer\LecturerHeader.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Đảm bảo đường dẫn này đúng
import { Navbar, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { FaBell, FaUserCircle, FaSignOutAlt, FaCogs } from 'react-icons/fa';

const LecturerHeader = () => {
    const { user, logout, effectiveRoles } = useAuth();
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const handleLecturerPusherData = (event) => {
            // event.detail sẽ chứa { eventType, payload } từ LecturerNotificationListener
            const pusherData = event.detail;
            console.log("LecturerHeader: Received custom event with Pusher data:", pusherData);

            if (pusherData && pusherData.payload && pusherData.payload.message) {
                // Thêm thông báo mới vào đầu danh sách
                setNotifications(prev => [{ eventType: pusherData.eventType, payload: pusherData.payload }, ...prev].slice(0, 10)); // Giới hạn 10 thông báo
                setNotificationCount(prevCount => prevCount + 1);
            } else {
                console.warn("LecturerHeader: Received custom event without valid payload or message:", pusherData);
            }
        };

        // Lắng nghe các custom event từ LecturerNotificationListener
        window.addEventListener('lecturer-article-status-updated', handleLecturerPusherData);
        window.addEventListener('lecturer-topic-status-updated', handleLecturerPusherData);
        
        console.log("LecturerHeader: Added event listeners for custom lecturer Pusher events.");

        return () => {
            window.removeEventListener('lecturer-article-status-updated', handleLecturerPusherData);
            window.removeEventListener('lecturer-topic-status-updated', handleLecturerPusherData);
            console.log("LecturerHeader: Removed event listeners for custom lecturer Pusher events.");
        };
    }, []); // Chỉ chạy một lần khi component mount

    // Kiểm tra xem người dùng hiện tại có vai trò admin không (dựa trên effectiveRoles)
    const isAlsoAdmin = user?.is_superadmin && effectiveRoles && effectiveRoles.includes('admin');

    const handleNotificationDropdownClick = () => {
        // Reset số lượng thông báo khi người dùng mở dropdown
        setNotificationCount(0);
        // Bạn có thể thêm logic đánh dấu đã đọc ở đây nếu cần
    };

    const handleNotificationItemClick = (notificationPayload) => {
        // Xử lý khi người dùng click vào một item thông báo cụ thể
        // Ví dụ: điều hướng đến trang chi tiết
        console.log("LecturerHeader: Clicked notification item:", notificationPayload);
        // navigate(`/lecturer/path-to-details/${notificationPayload.id}`); // Ví dụ
    };

    return (
        <Navbar bg="white" expand="lg" className="shadow-sm px-3 topbar static-top" style={{ zIndex: 1030 }}>
            <Navbar.Brand as={Link} to="/lecturer" className="text-success fw-bold">
                QLNCKH - Giảng Viên
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="lecturer-navbar-nav" className="ms-auto me-2 d-lg-none" />
            <Navbar.Collapse id="lecturer-navbar-nav" className="justify-content-end">
                <Nav className="ms-auto align-items-center">
                    <NavDropdown
                        className="mx-1"
                        title={
                            <>
                                <FaBell />
                                {notificationCount > 0 && (
                                    <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle p-1" style={{ fontSize: '0.6em' }}>
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                        <span className="visually-hidden">Thông báo mới</span>
                                    </Badge>
                                )}
                            </>
                        }
                        id="lecturerAlertsDropdown"
                        align="end"
                        onClick={handleNotificationDropdownClick} 
                    >
                        {notifications.length === 0 ? (
                            <NavDropdown.ItemText>Không có thông báo mới</NavDropdown.ItemText>
                        ) : (
                            notifications.map((notif, index) => (
                                <NavDropdown.Item 
                                    key={notif.payload?.bai_bao_id || notif.payload?.topic_id || `notif-${index}-${Date.now()}`} 
                                    onClick={() => handleNotificationItemClick(notif.payload)}
                                >
                                    <span className="fw-bold">{notif.payload?.message || 'Thông báo không có nội dung.'}</span>
                                    <div className="small text-muted">
                                        {notif.eventType.includes('baibao.approved') ? 'Bài báo được duyệt' :
                                         notif.eventType.includes('baibao.rejected') ? 'Bài báo bị từ chối' :
                                         notif.eventType.includes('detai.approved') ? 'Đề tài được duyệt' :
                                         notif.eventType.includes('detai.rejected') ? 'Đề tài bị từ chối' :
                                         'Cập nhật mới'}
                                    </div>
                                </NavDropdown.Item>
                            ))
                        )}
                        {notifications.length > 0 && <NavDropdown.Divider />}
                        {notifications.length > 0 && 
                            <NavDropdown.Item as={Link} to="/lecturer/notifications" className="text-center small text-gray-500">
                                Xem tất cả thông báo
                            </NavDropdown.Item> 
                        }
                    </NavDropdown>

                    <div className="topbar-divider d-none d-sm-block mx-2 border-end" style={{height: '30px'}}></div>

                    <NavDropdown
                        title={
                            <>
                                <span className="me-2 d-none d-lg-inline text-gray-600 small">{user?.ho_ten || 'Giảng viên'}</span>
                                <FaUserCircle size={24} />
                            </>
                        }
                        id="lecturer-user-dropdown"
                        align="end"
                    >
                        <NavDropdown.Item as={Link} to="/lecturer/profile">
                            <FaUserCircle className="me-2 text-gray-400" /> Hồ sơ cá nhân
                        </NavDropdown.Item>

                        {isAlsoAdmin && (
                            <NavDropdown.Item as={Link} to="/admin">
                                <FaCogs className="me-2 text-gray-400" /> Trang Quản trị
                            </NavDropdown.Item>
                        )}
                        <NavDropdown.Divider />
                        <NavDropdown.Item onClick={logout}>
                            <FaSignOutAlt className="me-2 text-gray-400" /> Đăng xuất
                        </NavDropdown.Item>
                    </NavDropdown>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default LecturerHeader;
