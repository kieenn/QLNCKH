// src/api/axiosConfig.js
import axios from 'axios';

// SỬA DÒNG NÀY: Sử dụng process.env và tiền tố REACT_APP_
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // !! Quan trọng: Để gửi/nhận cookie session
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    // 'X-Requested-With': 'XMLHttpRequest', // Đôi khi cần thiết cho Laravel
  }
});

// Interceptor để xử lý lỗi 401 (Unauthorized)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.error("API Error: Unauthorized (401). Session may be invalid.");
      // Không tự động redirect ở đây, để component hoặc context xử lý
    }
     if (error.response && error.response.status === 419) {
        console.error("API Error: CSRF Token Mismatch (419). Refreshing might be needed.");
     }
    return Promise.reject(error);
  }
);

// Hàm lấy CSRF cookie từ Laravel Sanctum/Web guard
export const fetchCsrfToken = async () => {
  try {
    await apiClient.get('/sanctum/csrf-cookie');
    console.log("CSRF token potentially refreshed/fetched.");
  } catch (error) {
    console.error("Could not fetch CSRF token:", error);
  }
};

export default apiClient;
