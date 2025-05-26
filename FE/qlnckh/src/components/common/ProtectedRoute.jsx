import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Đảm bảo đường dẫn này đúng với cấu trúc dự án của bạn
import LoadingSpinner from './LoadingSpinner'; // Giả sử bạn có component này

const ProtectedRoute = ({ allowedRoles, requiredPermissions }) => {
    const { isAuthenticated, effectiveRoles, hasPermission, user, isLoading } = useAuth(); // Sử dụng effectiveRoles
    const location = useLocation();

    // Nếu AuthContext vẫn đang trong quá trình kiểm tra trạng thái xác thực ban đầu,
    // hiển thị một spinner hoặc null để tránh redirect sớm.
    if (isLoading) {
        return <LoadingSpinner />; // Hoặc return null;
    }

    // Nếu người dùng chưa được xác thực, chuyển hướng đến trang đăng nhập.
    // `state={{ from: location }}` để lưu lại trang người dùng muốn truy cập,
    // ताकि sau khi đăng nhập có thể quay lại.
    if (!isAuthenticated) {
        console.log("ProtectedRoute: User not authenticated, redirecting to login.");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Kiểm tra vai trò:
    // Nếu `allowedRoles` được định nghĩa cho route, người dùng phải có ít nhất một trong các vai trò đó.
    const hasEffectiveRole = allowedRoles
        ? effectiveRoles.some(role => allowedRoles.includes(role))
        : true; // Nếu không có `allowedRoles` nào được yêu cầu, coi như người dùng có vai trò hợp lệ.

    if (!hasEffectiveRole) {
        console.warn(`ProtectedRoute: User with effective roles [${effectiveRoles.join(', ')}] does not have required roles [${allowedRoles.join(', ')}] for ${location.pathname}`);
        return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }

    // Kiểm tra quyền chi tiết (permissions):
    // Nếu `requiredPermissions` được định nghĩa và người dùng không phải là superadmin,
    // họ phải có TẤT CẢ các quyền được yêu cầu.
    if (requiredPermissions && requiredPermissions.length > 0 && !user?.is_superadmin) {
        const hasAllRequiredPermissions = requiredPermissions.every(permission => hasPermission(permission));
        if (!hasAllRequiredPermissions) {
            console.warn(`ProtectedRoute: User does not have all required permissions [${requiredPermissions.join(', ')}] for ${location.pathname}`);
            return <Navigate to="/unauthorized" state={{ from: location }} replace />;
        }
    }

    // Nếu tất cả kiểm tra đều qua, cho phép truy cập route.
    return <Outlet />;
};

export default ProtectedRoute;