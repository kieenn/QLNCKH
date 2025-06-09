// src/components/admin/AdminHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate
import { useAuth } from '../../hooks/useAuth';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap'; // Bỏ Badge và FaBell
import { FaUserCircle, FaSignOutAlt, FaCogs } from 'react-icons/fa';
import { 
    initPusher, 
    subscribeToAdminNotifications, 
    unsubscribeFromAdminNotifications,
    // disconnectPusher // Bạn có thể import nếu muốn disconnect hoàn toàn khi logout
} from '../../services/pusherService';
import { fetchCsrfToken } from '../../api/axiosConfig';
import { toast } from 'react-toastify'; // Import toast để hiển thị thông báo

const AdminHeader = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate(); // Khởi tạo useNavigate

    // Sử dụng useRef để theo dõi trạng thái đã subscribe Pusher hay chưa.
    // useRef không gây re-render khi giá trị thay đổi và giữ nguyên giá trị qua các lần render.
    const pusherSubscribedRef = useRef(false);

    useEffect(() => {
        // Định nghĩa handleNewNotification bên trong useEffect.
        // Khi useEffect chạy lại (do user thay đổi), một instance mới của handleNewNotification
        // với closure đúng cho state hiện tại (setNotifications, setNotificationCount) sẽ được tạo ra.
        const handleNewNotification = (data) => {
            console.log("AdminHeader: handleNewNotification CALLED with data:", data);
            if (data && data.payload && data.eventType) {
                const { payload, eventType } = data;
                let title = "Thông báo mới"; // Tiêu đề mặc định
                let body = ""; // Nội dung mặc định
                let toastOptions = {
                    autoClose: 8000,
                    onClick: () => {} // Mặc định không làm gì khi click
                };

                if (eventType === 'research.topic.submitted' && payload.topic_id) {
                    // Giả sử payload có trường 'title' hoặc bạn tự tạo title
                    title = payload.title || "Đề tài mới được gửi"; 
                    body = `"${payload.topic_name || 'Không có tên'}" từ GV ${payload.lecturer_name || 'Không rõ'}.`;
                    toastOptions.onClick = () => navigate(`/admin/research-proposals/pending-approval`); // Điều hướng đến trang duyệt đề tài
                } else if (eventType === 'bai-bao.submitted' && payload.bai_bao_id) {
                    // Giả sử payload có trường 'title' hoặc bạn tự tạo title
                    title = payload.title || "Bài báo mới được nộp";
                    body = `"${payload.article_name || 'Không có tên'}" (ĐT: ${payload.topic_code || 'N/A'}).`;
                    toastOptions.onClick = () => navigate(`/admin/articles/pending`); // Điều hướng đến trang duyệt bài báo
                }
                
                // Tạo nội dung toast với "tiêu đề" và "nội dung"
                const toastMessage = (<div><strong>{title}</strong><br/>{body}</div>);

                toast.info(toastMessage, toastOptions);

            } else {
                console.warn("AdminHeader: Received notification without payload or eventType:", data);
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

    return (
        <Navbar bg="white" expand="lg" className="shadow-sm px-3 topbar static-top" style={{ zIndex: 1030 }}> {/* Ensure header is above toast */}
            {/* Phần search form có thể giữ lại hoặc bỏ đi tùy ý bạn */}
            {/* <Form className="d-none d-sm-inline-block me-auto ms-md-3 my-2 my-md-0 mw-100"> ... </Form> */}

            <Nav className="ms-auto align-items-center">
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
