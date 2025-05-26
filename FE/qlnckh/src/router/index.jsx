// c:/Users/maing/OneDrive/Documents/KLTN/project/FE/qlnckh/src/router/index.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layouts, Pages, Common Components...
import AdminLayout from '../layouts/AdminLayout';
import LecturerLayout from '../layouts/LecturerLayout';
import AuthLayout from '../layouts/AuthLayout';
import LoginPage from '../pages/auth/LoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import ManageAccountsPage from '../pages/admin/ManageAccountsPage';
// Import trang profile mới
import AdminProfilePage from '../pages/admin/AdminProfilePage';
// Import trang Quản lý Đơn vị
import ManageUnitsPage from '../pages/admin/ManageUnitsPage';
import ManageTaskLevelsPage from '../pages/admin/ManageTaskLevelsPage.jsx';
// Import các trang admin khác nếu có
// import ManageTaskLevelsPage from '../pages/admin/ManageTaskLevelsPage';
import ManageResearchFieldsPage from '../pages/admin/ManageResearchFieldsPage';
// Import trang Quản lý Tiến độ Đề tài
import ManageResearchProgressPage from '../pages/admin/ManageResearchProgressPage'; // Đã import
// import ManageTopicsPage from '../pages/admin/ManageTopicsPage';
// import ReportsPage from '../pages/admin/ReportsPage';
import LecturerDashboardPage from '../pages/lecturer/LecturerDashboardPage';
import MyResearchPage from '../pages/lecturer/MyResearchPage';
import NotFoundPage from '../pages/common/NotFoundPage';
import UnauthorizedPage from '../pages/common/UnauthorizedPage';
import ProtectedRoute from '../components/common/ProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MyProfilePageLecturer from '../pages/lecturer/MyProfilePage'; // Đổi tên để tránh trùng với AdminProfilePage nếu có
import RegisterOrEditResearchPage from '../pages/lecturer/RegisterOrEditResearchPage'; // Thêm trang đăng ký/sửa đề tài
import AdminResearchApprovalPage from '../pages/admin/AdminResearchApprovalPage';
import DeclareArticlePage from '../pages/lecturer/DeclareArticlePage';
import ApproveArticlesPage from '../pages/admin/ApproveArticlesPage.jsx';

// --- Định nghĩa mã quyền (phải khớp với DB và backend) ---
const MANAGE_ACCOUNTS = 'Quản Lý Tài Khoản';
const MANAGE_DECLARATIONS = 'Quản Lý Khai Báo';
// const MANAGE_TOPICS = 'Quản Lý Đề Tài'; // Cân nhắc nếu cần quyền chung này, hiện tại chưa dùng
const MANAGE_RESEARCH_PROGRESS = 'Quản Lý Tiến Độ Đề Tài';
const VIEW_REPORTS_STATS = 'Báo Cáo Thống Kê';
const APPROVE_TOPICS = 'Duyệt Đề Tài';
const MANAGE_PRODUCTS = 'Quản lý sản phẩm';
// Thêm các mã quyền khác

const AppRouter = () => {
    const { isAuthenticated, isLoading, effectiveRoles, user } = useAuth(); // Sử dụng effectiveRoles

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />

                    {/* Quản lý tài khoản */}
                    <Route element={<ProtectedRoute requiredPermissions={[MANAGE_ACCOUNTS]} />}>
                        {/* Sửa path ở đây nếu bạn muốn /admin/manage-accounts */}
                        <Route path="accounts" element={<ManageAccountsPage />} />
                    </Route>

                    {/* --- THÊM ROUTE PROFILE --- */}
                    <Route path="profile" element={<AdminProfilePage />} />
                    {/* ------------------------- */}

                    {/* Quản lý Khai Báo */}
                    <Route element={<ProtectedRoute requiredPermissions={[MANAGE_DECLARATIONS]} />}>
                        {/* Route cha cho khai báo nếu cần trang tổng hợp */}
                        {/* <Route path="declarations" element={<ManageDeclarationsPage />} /> */}

                        {/* Các route con cho từng mục khai báo */}
                        <Route path="manage-units" element={<ManageUnitsPage />} />
                        <Route path="manage-task-levels" element={<ManageTaskLevelsPage />} />
                        <Route path="manage-research-fields" element={<ManageResearchFieldsPage />} />
                        {/* <Route path="manage-task-levels" element={<ManageTaskLevelsPage />} /> */}
                        {/* <Route path="manage-research-fields" element={<ManageResearchFieldsPage />} /> */}
                    </Route>

                    {/* Quản lý Đề Tài - Hiện tại không có route con nào dùng MANAGE_TOPICS */}
                    {/* <Route element={<ProtectedRoute requiredPermissions={[MANAGE_TOPICS]} />}>
                         {/* <Route path="topics" element={<ManageTopicsPage />} /> */}
                         {/* Ví dụ: <Route path="topic-progress" element={<TopicProgressPage />} /> */}
                    {/* </Route> */}

                    {/* --- THÊM ROUTE QUẢN LÝ TIẾN ĐỘ --- */}
                    <Route element={<ProtectedRoute requiredPermissions={[MANAGE_RESEARCH_PROGRESS]} />}>
                        <Route path="research-progress" element={<ManageResearchProgressPage />} />
                    </Route>
                    {/* --------------------------------- */}

                     {/* Duyệt Đề Tài */}
                     <Route element={<ProtectedRoute requiredPermissions={[APPROVE_TOPICS]} />}>
                        <Route path="approve-topics" element={<AdminResearchApprovalPage />} />
                    </Route>

                    {/* Báo cáo & Thống kê */}
                    <Route element={<ProtectedRoute requiredPermissions={[VIEW_REPORTS_STATS]} />}>
                        {/* <Route path="reports" element={<ReportsPage />} />  // Nếu có trang báo cáo chung */}
                    </Route>
                    <Route element={<ProtectedRoute requiredPermissions={[MANAGE_PRODUCTS]} />}>
                        {/* <Route path="products" element={<ManageProductsPage />} /> */}
                    </Route>


                    {/* Duyệt Bài Báo */}
                    <Route element={<ProtectedRoute requiredPermissions={[MANAGE_PRODUCTS]} />}>
                        <Route path="approve-articles" element={<ApproveArticlesPage />} />
                    </Route>

                </Route>
            </Route>

            {/* Protected Lecturer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['lecturer']} />}>
                 <Route path="/lecturer" element={<LecturerLayout />}>
                    <Route index  element={<MyResearchPage />} />
                    <Route path="profile" element={<MyProfilePageLecturer />} />
                    <Route path="researches/register" element={<RegisterOrEditResearchPage />} />
                    <Route path="researches/edit/:maDeTaiForEdit" element={<RegisterOrEditResearchPage />} />
                     <Route path="researches/:researchId/articles/declare" element={<DeclareArticlePage />} />
                </Route>
            </Route>

            {/* Root path redirect */}
            <Route
                path="/"
                element={
                    isAuthenticated ? (
                        effectiveRoles.includes('admin') ? // Nếu vai trò hiệu lực là admin
                            <Navigate to="/admin" replace /> :
                            <Navigate to="/lecturer" replace /> // Mặc định là giảng viên
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            {/* Not Found Route */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRouter;
