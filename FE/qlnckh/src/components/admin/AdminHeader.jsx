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
            console.log("AdminHeader: handleNewNotification CALLED with data:", JSON.stringify(data, null, 2)); // Log chi tiết hơn
            // Kiểm tra kỹ hơn cấu trúc data nhận được
            if (data && data.payload && typeof data.payload === 'object' && data.eventType) {
                const { payload, eventType } = data;
                let title = "Thông báo mới"; // Tiêu đề mặc định
                let body = ""; // Nội dung mặc định
                let toastOptions = {
                    autoClose: 8000,
                    onClick: () => { console.log("Toast clicked, no specific navigation."); } // Log khi click nếu không có điều hướng cụ thể
                };

                // Log toàn bộ payload để kiểm tra
                console.log("AdminHeader: Full payload received:", JSON.stringify(payload, null, 2));
                // Log cụ thể các trường bạn quan tâm
                console.log("AdminHeader: Payload details - ten_bai_bao:", payload.ten_bai_bao, "de_tai_ten:", payload.de_tai_ten, "lecturer_name:", payload.lecturer_name);

                if (eventType === 'research.topic.submitted') {
                    title = payload.title || "Đề tài mới được gửi";
                    body = `"${payload.topic_name || 'Chưa có tên đề tài'}" bởi GV ${payload.lecturer_name || 'Không rõ tên GV'}.`;
                    if (payload.topic_id) { // Chỉ điều hướng nếu có topic_id
                        // Giữ lại điều hướng cho đề tài nếu cần, hoặc bỏ đi nếu muốn thống nhất
                        toastOptions.onClick = () => navigate(`/admin/approve-topics`); 
                    }
                } else if (eventType === 'bai-bao.submitted') {
                    title = payload.title || "Bài báo mới được nộp"; // Giữ nguyên hoặc lấy từ payload.message nếu có
                    // Sử dụng payload.ten_bai_bao và payload.de_tai_ten từ log Pusher
                    body = `"${payload.ten_bai_bao || 'Chưa có tên bài báo'}" cho đề tài "${payload.de_tai_ten || 'Không rõ tên đề tài'}".`;
                    // Bỏ điều hướng khi click vào toast cho bài báo
                    // toastOptions.onClick = () => navigate(`/admin/approve-articles`); // Bỏ dòng này
                } else {
                    // Xử lý các eventType khác nếu có, hoặc log ra để debug
                    console.warn("AdminHeader: Unhandled eventType:", eventType, "Payload:", payload);
                    // Có thể lấy title và body trực tiếp từ payload nếu backend gửi chung chung
                    title = payload.title || title;
                    body = payload.body || payload.message || "Nội dung không xác định.";
                }
                
                // Tạo nội dung toast với "tiêu đề" và "nội dung"
                const toastMessage = (<div><strong>{title}</strong><br/>{body}</div>);

                toast.info(toastMessage, toastOptions);

            } else {
                console.warn("AdminHeader: Received notification without valid payload object or eventType. Data:", JSON.stringify(data, null, 2));
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
                    {/* <NavDropdown.Item as={Link} to="/admin/settings">
                        <FaCogs className="me-2 text-gray-400" /> Cài đặt
                    </NavDropdown.Item> */}
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
