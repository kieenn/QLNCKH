import apiClient from './axiosConfig';

// Profile
// export const getMyProfile = () => apiClient.get('/api/lecturer/profile');
export const updateMyProfile = (data) => apiClient.put('/api/profile', data);

// Researches
// API để lấy danh sách đề tài của giảng viên hiện tại, có thể có params để filter/pagination
export const getMyResearchList = (params) => apiClient.get('/api/researches', { params });
export const createResearchProposal = (data) => apiClient.post('/api/research-topics/submit', data);
// API để lấy chi tiết một đề tài cụ thể của giảng viên để sửa
export const getResearchDetailsForEdit = (maDeTai) => apiClient.get(`/api/researches/${maDeTai}/edit-details`); // Hoặc một endpoint khác tùy backend
export const updateResearchProposal = (maDeTai, data) => apiClient.put(`/api/researches/${maDeTai}`, data);
// export const deleteResearchProposal = (maDeTai) => apiClient.delete(`/api/lecturer/researches/${maDeTai}`); // Nếu có chức năng hủy/xóa đề xuất

// Common data (có thể lấy từ commonApi.js nếu bạn tách ra)
// Các API này có thể giống hệt adminApi nếu backend dùng chung endpoint
export const getAllLinhVuc = () => apiClient.get('/api/linh-vuc');
export const getAllCapNhiemVu = () => apiClient.get('/api/cap-nhiem-vu');
// API này có thể trả về các trạng thái mà giảng viên được phép thấy/lọc
export const getAllTrangThaiDeTaiForLecturer = () => apiClient.get('/api/trang-thai-de-tai/lecturer-view');
export const searchLecturers = (params) => apiClient.get('/api/lecturers/search', { params }); // API tìm giảng viên để thêm làm thành viên

// Tiến độ (nếu giảng viên tự cập nhật)
// export const updateResearchProgressLecturer = (maDeTai, data) => apiClient.post(`/api/lecturer/researches/${maDeTai}/progress`, data);
// API mới để lấy danh sách vai trò thành viên
export const getVaiTroThanhVienList = () => apiClient.get('/api/vai-tro-thanh-vien'); // Endpoint này bạn cần tạo ở backend

// API mới để tìm giảng viên theo MSVC
export const findLecturerByMSVC = (msvc) => apiClient.get(`/api/find-by-msvc`, { params: { msvc } }); // Endpoint này bạn cần tạo ở backend

// API để lấy danh sách các lựa chọn cho form (có thể dùng chung với admin)
export const getHocHamOptions = () => apiClient.get('/api/hoc-ham');
export const getHocViOptions = () => apiClient.get('/api/hoc-vi');
export const getDonViOptions = () => apiClient.get('/api/don-vi');

export const submitActualArticleDeclaration = async (researchId, formData) => {
    return apiClient.post(`/api/articles/declare/${researchId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

// API để lấy danh sách đề tài sắp đến hạn nộp
export const getDeadlineReminders = () => apiClient.get('/api/lecturer/deadline-reminders');

// API để lấy chi tiết một thông báo cụ thể
export const getNotificationDetails = (notificationId) => {
    return apiClient.get(`/api/notifications/${notificationId}`);
};

// API to get articles for a specific research topic
export const getArticlesForResearch = (researchId) => { // researchId is DeTai's ID
    return apiClient.get(`/api/researches/${researchId}/articles`);
};

// API to update a lecturer's article
export const updateLecturerArticle = (articleId, data) => { // articleId is BaiBao's ID
    // Axios automatically sets Content-Type to multipart/form-data when data is FormData.
    // No need to manually set headers if data is FormData.
    // If data might NOT be FormData (e.g., only text fields updated without file changes),
    // you might need more complex logic or ensure data is always FormData.
    // For simplicity, assuming `data` will be FormData if files are involved.
    // The backend controller is now expecting FormData if files are part of the update.
    return apiClient.put(`/api/articles/${articleId}`, data);
};