import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Nav, Button } from 'react-bootstrap';
import {
    FaUserCircle, FaSignOutAlt, FaBars, FaTimes, FaBook, FaPlusSquare, FaUserEdit, FaTachometerAlt, FaCogs
} from 'react-icons/fa';
import './LecturerSidebar.css'; // Sẽ tạo file CSS này

const LecturerSidebar = () => {
    const { user, logout, effectiveRoles } = useAuth(); // Lấy thêm effectiveRoles
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Kiểm tra xem người dùng hiện tại có vai trò admin không (dựa trên effectiveRoles)
    // Điều này quan trọng nếu admin đăng nhập với tư cách giảng viên
    const isAlsoAdmin = user?.is_superadmin && effectiveRoles.includes('admin');

    return (
        <div
            className={`d-flex flex-column p-3 text-white vh-100 sidebar ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
            style={{
                background: 'linear-gradient(to bottom, #4e73df, #224abe)', // Đổi lại màu xanh dương giống admin
                width: isCollapsed ? '80px' : '250px',
                transition: 'width 0.3s ease',
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflowY: 'auto'
            }}
        >
            <Button
                variant="link"
                className="text-white d-md-none mb-3 align-self-end"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? "Mở menu" : "Đóng menu"}
            >
                {isCollapsed ? <FaBars size={20} /> : <FaTimes size={20} />}
            </Button>

            <div className={`text-center mb-4 ${isCollapsed ? 'd-none d-md-block' : ''}`}>
                <FaUserCircle size={isCollapsed ? 30 : 50} className="mb-2" />
                {!isCollapsed && (
                    <>
                        <div className="fw-bold">{user?.ho_ten || 'Giảng viên'}</div>
                        <div className="small">{user?.msvc || user?.email}</div>
                        <NavLink to="/lecturer/profile" className="small text-white-50 text-decoration-none">
                            Hồ sơ cá nhân
                        </NavLink>
                    </>
                )}
            </div>

            <Nav variant="pills" className="flex-column mb-auto">
                <Nav.Item>
                    <Nav.Link
                        as={NavLink}
                        to="/lecturer/"
                        end // Thêm prop "end" cho NavLink trỏ đến route index
                        className="text-white d-flex align-items-center"
                        title={isCollapsed ? 'Đề tài của tôi' : ''}
                    >
                        <FaBook size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                        {!isCollapsed && 'Đề tài của tôi'}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        as={NavLink}
                        to="/lecturer/researches/register"
                        className="text-white d-flex align-items-center"
                        title={isCollapsed ? 'Đăng ký đề tài mới' : ''}
                    >
                        <FaPlusSquare size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                        {!isCollapsed && 'Đăng ký đề tài mới'}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        as={NavLink}
                        to="/lecturer/profile" // Link đến trang profile giảng viên
                        className="text-white d-flex align-items-center"
                        title={isCollapsed ? 'Cập nhật hồ sơ' : ''}
                    >
                        <FaUserEdit size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                        {!isCollapsed && 'Cập nhật hồ sơ'}
                    </Nav.Link>
                </Nav.Item>

                {/* Liên kết quay lại trang Admin nếu người dùng là is_superadmin và đang trong session admin */}
                {isAlsoAdmin && (
                     <Nav.Item className="mt-3">
                        <Nav.Link
                            as={NavLink}
                            to="/admin" // Giữ nguyên link đến admin
                            className="text-white d-flex align-items-center" // Bỏ bg-primary để đồng bộ
                            title={isCollapsed ? 'Trang Quản trị' : ''}
                        >
                            <FaCogs size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                            {!isCollapsed && 'Tới trang Quản trị'}
                        </Nav.Link>
                    </Nav.Item>
                )}
            </Nav>

            <hr className="text-white-50"/>

            <div className="mt-auto">
                 <Button variant="danger" onClick={logout} className="w-100 d-flex align-items-center justify-content-center"> {/* Đổi variant lại thành danger như admin */}
                     <FaSignOutAlt size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                     {!isCollapsed && 'Đăng xuất'}
                 </Button>
             </div>

             <div className="text-center mt-3 d-none d-md-block">
                <Button variant="outline-light" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} aria-label={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}>
                    {isCollapsed ? <FaBars /> : <FaTimes />}
                </Button>
             </div>
        </div>
    );
};

export default LecturerSidebar;