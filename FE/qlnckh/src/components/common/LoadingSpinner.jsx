import React from 'react';
// Đảm bảo bạn đã có style cho class này trong App.css
// Hoặc sử dụng component spinner từ thư viện UI

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner"></div>
    </div>
  );
};

export default LoadingSpinner;
