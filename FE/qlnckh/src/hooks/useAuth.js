import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext'; // Đảm bảo path đúng

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Lỗi này xảy ra nếu dùng useAuth bên ngoài <AuthProvider>
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
