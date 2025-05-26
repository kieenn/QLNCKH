import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const UnauthorizedPage = () => {
    const { userRole } = useAuth();
    // Xác định trang chủ mặc định dựa trên vai trò (nếu đã đăng nhập)
    const homePath = userRole === 'admin' ? '/admin' : (userRole === 'lecturer' ? '/lecturer' : '/login');

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>403 - Truy cập bị từ chối</h1>
      <p>Bạn không có quyền truy cập vào trang này.</p>
      <Link to={homePath}>Quay về trang của bạn</Link>
    </div>
  );
};

export default UnauthorizedPage;
