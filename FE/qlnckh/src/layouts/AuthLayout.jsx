import React from 'react';
import { Outlet } from 'react-router-dom';

// Layout đơn giản cho các trang không cần sidebar/header (Login, Register,...)
const AuthLayout = () => {
  return (
    <div>
      {/* Có thể thêm nền hoặc style chung cho các trang auth ở đây */}
      <Outlet /> {/* Nơi render nội dung của trang (ví dụ: LoginPage) */}
    </div>
  );
};

export default AuthLayout;
