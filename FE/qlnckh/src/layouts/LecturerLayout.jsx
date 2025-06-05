// c:\Users\maing\OneDrive\Documents\GitHub\QLNCKH\FE\qlnckh\src\layouts\LecturerLayout.jsx
import React from 'react';
import { Outlet }
from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import LecturerSidebar from '../components/lecturer/LecturerSidebar'; // Đường dẫn đến Sidebar của bạn
import LecturerHeader from '../components/lecturer/LecturerHeader';   // Đường dẫn đến Header của bạn
import LecturerNotificationListener from '../components/lecturer/LecturerNotificationListener'; // Component này sẽ quản lý việc fetch và state thông báo
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LecturerLayout = () => {
  return (
    <Container fluid className="p-0 d-flex" style={{ minHeight: '100vh' }}>
      {/* LecturerNotificationListener có thể được đặt ở đây hoặc trong một Context Provider 
          để quản lý state thông báo toàn cục và cung cấp cho Header, Dropdown */}
      <LecturerNotificationListener />
      <ToastContainer
            position="top-right"
            autoClose={8000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
        />
      <LecturerSidebar />
      <Col className="d-flex flex-column flex-grow-1 p-0">
        {/* LecturerHeader sẽ nhận unread_count và danh sách thông báo từ LecturerNotificationListener (qua props hoặc context) */}
        <LecturerHeader />
        <main className="flex-grow-1 p-3 p-md-4 bg-light">
          <Outlet />
        </main>
        <footer className="text-center p-3 bg-white border-top">
            Copyright © QLNCKH 2025 - Lecturer
        </footer>
      </Col>
    </Container>
  );
};

export default LecturerLayout;
