// src/layouts/AdminLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
// Import các component layout từ react-bootstrap
import { Container, Col } from 'react-bootstrap';
// Import các component con (Sidebar, Header) với đường dẫn tương đối đúng
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
// Import AdminNotificationListener và ToastContainer
import AdminNotificationListener from '../components/admin/AdminNotificationListener'; // Changed 'Admin' to 'admin'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS cho Toastify
// Import useAuth từ đúng vị trí trong thư mục src
import { useAuth } from '../hooks/useAuth'; // Đảm bảo đường dẫn này đúng

const AdminLayout = () => {
  // Bạn có thể dùng useAuth ở đây nếu layout cần thông tin user,
  // nhưng trong trường hợp này, các component con (Sidebar, Header) đã dùng nó rồi.
  // const { user } = useAuth();

  return (
    // Sử dụng Container fluid để chiếm toàn bộ chiều rộng
    // d-flex để sắp xếp Sidebar và Content Area cạnh nhau
    <Container fluid className="p-0 d-flex" style={{ minHeight: '100vh' }}>
        {/* Component lắng nghe thông báo, không render UI trực tiếp */}
        <AdminNotificationListener />

        {/* ToastContainer để hiển thị các thông báo */}
        <ToastContainer
            position="top-right"
            autoClose={8000} // Thời gian tự đóng thông báo (ms)
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored" // Có thể là "light", "dark", hoặc "colored"
        />

        {/* Sidebar: Component này tự quản lý chiều rộng của nó */}
        <AdminSidebar />

        {/* Content Area: Sử dụng Col và flex-grow-1 để chiếm phần còn lại */}
        {/* d-flex flex-column để Header, main, footer xếp chồng lên nhau */}
        <Col className="d-flex flex-column flex-grow-1 p-0"> {/* Bỏ padding ở đây nếu muốn header/footer chiếm toàn bộ */}

            {/* Header */}
            <AdminHeader />

            {/* Main Content Area */}
            {/* flex-grow-1 để main chiếm hết không gian còn lại */}
            {/* p-3 p-md-4 để thêm padding cho nội dung */}
            {/* bg-light để thêm màu nền xám nhạt */}
            <main className="flex-grow-1 p-3 p-md-4 bg-light">
              {/* Outlet là nơi các trang con (AdminDashboardPage, ManageAccountsPage,...) sẽ được render */}
              <Outlet />
            </main>

            {/* Footer */}
            <footer className="text-center p-3 bg-white border-top">
                 Copyright © QLNCKH 2025
            </footer>
        </Col>
    </Container>
  );
};

export default AdminLayout;
