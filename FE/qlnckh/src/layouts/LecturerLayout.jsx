// LecturerLayout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Row, Col, Modal, Button, ListGroup } from 'react-bootstrap'; // Thêm Modal, Button, ListGroup
import LecturerSidebar from '../components/lecturer/LecturerSidebar';
import LecturerHeader from '../components/lecturer/LecturerHeader';
import LecturerNotificationListener from '../components/lecturer/LecturerNotificationListener';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getDeadlineReminders } from '../api/lecturerApi'; // Import API mới

const LecturerLayout = () => {
  const [deadlineReminders, setDeadlineReminders] = useState([]);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);

  useEffect(() => {
    const fetchDeadlineReminders = async () => {
      try {
        const response = await getDeadlineReminders();
        if (response.data && response.data.length > 0) {
          setDeadlineReminders(response.data);
          setShowDeadlineModal(true); // Hiển thị modal nếu có thông báo
        }
      } catch (error) {
        console.error("Error fetching deadline reminders:", error);
        // Không cần hiển thị lỗi cho người dùng ở đây, vì đây là thông báo ngầm
      }
    };

    // Gọi API khi layout được mount (thường là sau khi đăng nhập thành công)
    fetchDeadlineReminders();
  }, []);

  const handleCloseDeadlineModal = () => setShowDeadlineModal(false);

  return (
    <Container fluid className="p-0 d-flex" style={{ minHeight: '100vh' }}>
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
        <LecturerHeader />
        <main className="flex-grow-1 p-3 p-md-4 bg-light">
          <Outlet />
        </main>
        <footer className="text-center p-3 bg-white border-top">
            Copyright © QLNCKH 2025 - Lecturer
        </footer>
      </Col>

      {/* Modal hiển thị thông báo hạn nộp */}
      <Modal show={showDeadlineModal} onHide={handleCloseDeadlineModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>🔔 Thông Báo Hạn Nộp NCKH</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deadlineReminders.length > 0 ? (
            <ListGroup variant="flush">
              {deadlineReminders.map(reminder => (
                <ListGroup.Item key={reminder.de_tai_id}>
                  <p className="mb-1">
                    Đề tài: <strong>{reminder.ten_de_tai}</strong> (Mã: {reminder.ma_de_tai || 'N/A'})
                  </p>
                  <p className="mb-0">
                    Còn <strong>{reminder.days_remaining} ngày</strong> nữa là đến hạn nộp (Ngày nộp: {reminder.ngay_ket_thuc_dukien}).
                  </p>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>Không có đề tài nào sắp đến hạn nộp trong thời gian tới.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseDeadlineModal}>
            Đã hiểu
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LecturerLayout;
