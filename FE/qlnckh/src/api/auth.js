import axiosInstance, { fetchCsrfToken } from './axiosConfig.js'; // Đảm bảo import đúng

/**
 * Gửi yêu cầu đặt lại mật khẩu (gửi OTP qua email).
 * @param {object} data - Dữ liệu chứa email. Ví dụ: { email: 'user@example.com' }
 */
export const requestPasswordReset = async (data) => {
    // await fetchCsrfToken(); // Có thể cần CSRF nếu endpoint yêu cầu
    try {
        const response = await axiosInstance.post('/api/forgot-password', data); // Gọi endpoint backend
        return response.data; // Trả về message từ backend (ví dụ: { message: "Mã OTP đã được gửi..." })
    } catch (error) {
        console.error("Error requesting password reset:", error.response || error);
        throw error; // Ném lỗi để component LoginPage xử lý và hiển thị
    }
};

/**
 * Xác thực mã OTP đã gửi qua email.
 * @param {object} data - Dữ liệu chứa email và otp. Ví dụ: { email: 'user@example.com', otp: '123456' }
 */
export const verifyOtp = async (data) => {
    // await fetchCsrfToken(); // Có thể cần CSRF
    try {
        const response = await axiosInstance.post('/api/verify-otp', data); // Gọi endpoint backend
        return response.data; // Trả về message từ backend (ví dụ: { message: "Xác thực OTP thành công." })
    } catch (error) {
        console.error("Error verifying OTP:", error.response || error);
        throw error; // Ném lỗi để component xử lý
    }
};

/**
 * Cập nhật mật khẩu mới sau khi đã xác thực OTP thành công.
 * @param {object} data - Dữ liệu chứa email, password, password_confirmation.
 */
export const updatePasswordAfterOtp = async (data) => {
    // await fetchCsrfToken(); // Có thể cần CSRF
    try {
        const response = await axiosInstance.post('/api/update-password', data); // Gọi endpoint backend
        return response.data; // Trả về message từ backend (ví dụ: { message: "Mật khẩu đã được đặt lại thành công." })
    } catch (error) {
        console.error("Error updating password after OTP:", error.response || error);
        throw error; // Ném lỗi để component xử lý
    }
};