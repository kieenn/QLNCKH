import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Nav, Button, Collapse } from 'react-bootstrap';
import {
    FaTachometerAlt, FaUsersCog, FaFileAlt, FaChartBar, FaUserCircle,
    FaSignOutAlt, FaBars, FaTimes, FaBuilding, FaLayerGroup, FaTags,
    FaChevronDown, FaChevronRight, FaTasks, FaCheckCircle, FaBoxOpen
} from 'react-icons/fa';
import './AdminSidebar.css'; // Import CSS riêng nếu cần tùy chỉnh sâu hơn

// Định nghĩa các hằng số quyền dựa trên ma_quyen bạn cung cấp
const PERMISSIONS = {
    MANAGE_ACCOUNTS: 'Quản Lý Tài Khoản',
    MANAGE_DECLARATIONS: 'Quản Lý Khai Báo',
    MANAGE_RESEARCH_PROGRESS: 'Quản Lý Tiến Độ Đề Tài',
    VIEW_REPORTS_STATS: 'Báo Cáo Thống Kê',
    APPROVE_TOPICS: 'Duyệt Đề Tài',
    MANAGE_PRODUCTS: 'Quản lý sản phẩm'
};

const AdminSidebar = () => {
    const { user, logout, hasPermission } = useAuth(); // Lấy thêm hasPermission
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [declarationsOpen, setDeclarationsOpen] = useState(false);

    return (
        <div
            className={`d-flex flex-column p-3 text-white vh-100 sidebar ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
            style={{
                background: 'linear-gradient(to bottom, #4e73df, #224abe)',
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
                        <div className="fw-bold">{user?.ho_ten || user?.name || 'Admin User'}</div>
                        <div className="small">{user?.msvc || user?.email}</div>
                        <NavLink to="/admin/profile" className="small text-white-50 text-decoration-none">
                            Cá Nhân
                        </NavLink>
                    </>
                )}
            </div>

            <Nav variant="pills" className="flex-column mb-auto">
                <Nav.Item>
                    <Nav.Link
                        as={NavLink}
                        to="/admin"
                        end
                        className="text-white d-flex align-items-center"
                        title={isCollapsed ? 'Dashboard' : ''}
                    >
                        <FaTachometerAlt size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                        {!isCollapsed && 'Dashboard'}
                    </Nav.Link>
                </Nav.Item>

                {/* Quản Lý Tài Khoản */}
                {hasPermission(PERMISSIONS.MANAGE_ACCOUNTS) && (
                    <Nav.Item>
                        <Nav.Link
                            as={NavLink}
                            to="/admin/accounts"
                            className="text-white d-flex align-items-center"
                            title={isCollapsed ? 'Quản Lý Tài Khoản' : ''}
                        >
                            <FaUsersCog size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                            {!isCollapsed && 'Quản Lý Tài Khoản'}
                        </Nav.Link>
                    </Nav.Item>
                )}

                {/* Quản Lý Khai Báo */}
                {hasPermission(PERMISSIONS.MANAGE_DECLARATIONS) && (
                    <Nav.Item>
                        <Nav.Link
                            onClick={() => !isCollapsed && setDeclarationsOpen(!declarationsOpen)}
                            aria-controls="declarations-collapse-nav"
                            aria-expanded={declarationsOpen}
                            className="text-white d-flex align-items-center justify-content-between"
                            style={{ cursor: isCollapsed ? 'default' : 'pointer', userSelect: 'none' }}
                            title={isCollapsed ? 'Quản Lý Khai Báo' : ''}
                        >
                            <div className="d-flex align-items-center">
                                <FaFileAlt size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                                {!isCollapsed && 'Quản Lý Khai Báo'}
                            </div>
                            {!isCollapsed && (declarationsOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />)}
                        </Nav.Link>
                        <Collapse in={!isCollapsed && declarationsOpen}>
                            <div id="declarations-collapse-nav">
                                <Nav className="flex-column ms-4 sub-nav">
                                    <Nav.Link as={NavLink} to="/admin/manage-units" className="text-white d-flex align-items-center py-1 sub-nav-link">
                                        <FaBuilding className="me-2 opacity-75" size={16} /> Quản lý đơn vị
                                    </Nav.Link>
                                    <Nav.Link as={NavLink} to="/admin/manage-task-levels" className="text-white d-flex align-items-center py-1 sub-nav-link">
                                        <FaLayerGroup className="me-2 opacity-75" size={16} /> Cấp nhiệm vụ
                                    </Nav.Link>
                                    <Nav.Link as={NavLink} to="/admin/manage-research-fields" className="text-white d-flex align-items-center py-1 sub-nav-link">
                                        <FaTags className="me-2 opacity-75" size={16} /> Lĩnh vực nghiên cứu
                                    </Nav.Link>
                                </Nav>
                            </div>
                        </Collapse>
                    </Nav.Item>
                )}

                {/* Quản Lý Tiến Độ Đề Tài */}
                {hasPermission(PERMISSIONS.MANAGE_RESEARCH_PROGRESS) && (
                    <Nav.Item>
                        <Nav.Link
                            as={NavLink}
                            to="/admin/research-progress"
                            className="text-white d-flex align-items-center"
                            title={isCollapsed ? 'Quản Lý Tiến Độ Đề Tài' : ''}
                        >
                            <FaTasks size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                            {!isCollapsed && 'Quản Lý Tiến Độ Đề Tài'}
                        </Nav.Link>
                    </Nav.Item>
                )}

                {/* Duyệt Đề Tài */}
                {hasPermission(PERMISSIONS.APPROVE_TOPICS) && (
                    <Nav.Item>
                        <Nav.Link
                            as={NavLink}
                            to="/admin/approve-topics" // Đảm bảo route này được định nghĩa trong AppRouter
                            className="text-white d-flex align-items-center"
                            title={isCollapsed ? 'Duyệt Đề Tài' : ''}
                        >
                            <FaCheckCircle size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                            {!isCollapsed && 'Duyệt Đề Tài'}
                        </Nav.Link>
                    </Nav.Item>
                )}
                
                {/* Báo Cáo Thống Kê
                {hasPermission(PERMISSIONS.VIEW_REPORTS_STATS) && (
                    <Nav.Item>
                        <Nav.Link
                            as={NavLink}
                            to="/admin/reports" // Đảm bảo route này được định nghĩa
                            className="text-white d-flex align-items-center"
                            title={isCollapsed ? 'Báo Cáo Thống Kê' : ''}
                        >
                            <FaChartBar size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                            {!isCollapsed && 'Báo Cáo Thống Kê'}
                        </Nav.Link>
                    </Nav.Item>
                )} */}

                {/* Quản Lý Sản Phẩm */}
                {hasPermission(PERMISSIONS.MANAGE_PRODUCTS) && (
                    <Nav.Item>
                        <Nav.Link
                            as={NavLink}
                            to="/admin/approve-articles" // Đảm bảo route này được định nghĩa
                            className="text-white d-flex align-items-center"
                            title={isCollapsed ? 'Quản Lý Sản Phẩm' : ''}
                        >
                            <FaBoxOpen size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                            {!isCollapsed && 'Quản Lý Sản Phẩm'}
                        </Nav.Link>
                    </Nav.Item>
                )}
            </Nav>

            <hr className="text-white-50"/>

            <div className="mt-auto">
                 <Button variant="danger" onClick={logout} className="w-100 d-flex align-items-center justify-content-center">
                     <FaSignOutAlt size={20} className={`me-2 ${isCollapsed ? 'mx-auto' : ''}`} />
                     {!isCollapsed && 'Đăng xuất'}
                 </Button>
             </div>

             <div className="text-center mt-3 d-none d-md-block">
                <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
                >
                    {isCollapsed ? <FaBars /> : <FaTimes />}
                </Button>
             </div>
        </div>
    );
};

export default AdminSidebar;
