import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const LecturerDashboardPage = () => {
    const { user } = useAuth();

    return (
        <div>
            <h2>Chào mừng, Giảng viên {user?.name || ''}!</h2>
            <p>Đây là trang tổng quan dành cho giảng viên.</p>
            {/* Hiển thị thông tin nhanh liên quan đến giảng viên */}
            <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff', borderRadius: '5px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                <h3>Thông tin NCKH của bạn</h3>
                <ul>
                    <li>Số đề tài đang thực hiện: [Số liệu]</li>
                    <li>Số bài báo đã công bố: [Số liệu]</li>
                    <li>Giờ NCKH đã khai báo năm nay: [Số liệu]</li>
                    <li>Thông báo mới: [Số liệu]</li>
                </ul>
                 {/* Thêm link nhanh */}
                 <div style={{marginTop: '1rem'}}>
                    <a href="/lecturer/my-research" style={{marginRight: '1rem'}}>Xem đề tài</a>
                    <a href="/lecturer/declarations">Khai báo NCKH</a>
                 </div>
            </div>
        </div>
    );
};

export default LecturerDashboardPage;
