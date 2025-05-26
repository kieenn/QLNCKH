import apiClient, { fetchCsrfToken } from './axiosConfig.js';

// ============================
// === Account Management ===
// ============================

// Lấy danh sách người dùng (hỗ trợ phân trang và lọc)
export const getUsersPaginated = async (params = {}) => {
    // params có thể chứa: page, search, don_vi_id, per_page,...
    const response = await apiClient.get('/api/admin/users', { params });
    return response.data; // Trả về cấu trúc phân trang từ Laravel { data: [], links: {}, meta: {} }
};

// Tạo tài khoản mới
export const createUser = async (userData) => {
    await fetchCsrfToken();
    const response = await apiClient.post('/api/admin/users', userData);
    return response.data;
};

// Cập nhật thông tin tài khoản
export const updateUser = async (userId, userData) => {
    await fetchCsrfToken();
    // Sử dụng PUT hoặc PATCH tùy backend
    const response = await apiClient.put(`/api/admin/users/${userId}`, userData);
    return response.data;
};

// Xóa tài khoản
export const deleteUser = async (userId) => {
    await fetchCsrfToken();
    const response = await apiClient.delete(`/api/admin/users/${userId}`);
    return response.data; // Thường là thông báo thành công hoặc status
};

// Lấy danh sách tất cả các quyền có thể gán
export const getAllPermissions = async () => {
    const response = await apiClient.get('/api/admin/permissions');
    return response.data; // Mảng các object permission { id, ma_quyen, mo_ta }
};

// Lấy danh sách quyền hiện tại của một người dùng
export const getUserPermissions = async (userId) => {
    const response = await apiClient.get(`/api/admin/users/${userId}/permissions`);
    return response.data; // Mảng các object permission của user đó
};

// Đồng bộ (cập nhật) quyền cho người dùng
export const syncUserPermissions = async (userId, permissionData) => {
    // permissionData: { permissions: ['ma_quyen_1', 'ma_quyen_2'], is_superadmin: false }
    await fetchCsrfToken();
    const response = await apiClient.put(`/api/admin/users/${userId}/sync-permissions`, permissionData);
    return response.data; // Thường là thông báo thành công
};

// ============================
// === Unit Management (Đơn vị) ===
// ============================

// Lấy TẤT CẢ đơn vị (KHÔNG phân trang, dùng cho dropdown/lọc)
export const getAllUnits = async () => {
  // Endpoint không phân trang
  const response = await apiClient.get('/api/admin/don-vi');
  return response.data; // Phải trả về một mảng [{id, ten, parent_id}, ...]
};

// Lấy danh sách đơn vị CÓ PHÂN TRANG (dùng cho bảng chính)
export const getUnitsPaginated = async (params = {}) => {
    // Endpoint có phân trang và lọc
    const response = await apiClient.get('/api/admin/getDonVi', { params });
    return response.data; // Cấu trúc phân trang { data: [], links: {}, meta: {} }
};


// Tạo đơn vị mới
export const createUnit = async (unitData) => {
  await fetchCsrfToken();
  const response = await apiClient.post('/api/admin/don-vi/add', unitData);
  return response.data;
};

// Cập nhật đơn vị
export const updateUnit = async (unitId, unitData) => {
  await fetchCsrfToken();
  const response = await apiClient.put(`/api/admin/don-vi/update/${unitId}`, unitData);
  return response.data;
};

// Xóa đơn vị
export const deleteUnit = async (unitId) => {
  await fetchCsrfToken();
  const response = await apiClient.delete(`/api/admin/don-vi/delete/${unitId}`);
  return response.data;
};

// ============================
// === Task Level Management (Cấp nhiệm vụ) ===
// ============================

// Lấy TẤT CẢ Cấp nhiệm vụ (KHÔNG phân trang, dùng cho dropdown)
export const getAllTaskLevels = async () => {
    const response = await apiClient.get('/api/admin/cap-nhiem-vu');
    return response.data; // Mảng [{id, ten, kinh_phi, parent_id}, ...]
};

// Lấy danh sách Cấp nhiệm vụ CÓ PHÂN TRANG (dùng cho bảng chính)
export const getTaskLevelsPaginated = async (params = {}) => {
    const response = await apiClient.get('/api/admin/getCapNhiemVu', { params });
    return response.data; // Cấu trúc phân trang { data: [...], links: {}, meta: {} }
};

// Tạo Cấp nhiệm vụ mới
export const createTaskLevel = async (taskLevelData) => {
    await fetchCsrfToken();
    const response = await apiClient.post('/api/admin/cap-nhiem-vu/add', taskLevelData);
    return response.data;
};

// Cập nhật Cấp nhiệm vụ
export const updateTaskLevel = async (taskLevelId, taskLevelData) => {
    await fetchCsrfToken();
    const response = await apiClient.put(`/api/admin/cap-nhiem-vu/update/${taskLevelId}`, taskLevelData);
    return response.data;
};

// Xóa Cấp nhiệm vụ
export const deleteTaskLevel = async (taskLevelId) => {
    await fetchCsrfToken();
    const response = await apiClient.delete(`/api/admin/cap-nhiem-vu/delete/${taskLevelId}`);
    return response.data;
};

// ============================
// === Research Field Management (Lĩnh vực đề tài) ===
// ============================

// Lấy danh sách Lĩnh vực nghiên cứu CÓ PHÂN TRANG
export const getResearchFieldsPaginated = async (params = {}) => {
    const response = await apiClient.get('/api/admin/getLinhVucNghienCuu', { params });
    return response.data; // Cấu trúc phân trang { data: [...], links: {}, meta: {} }
};

// Tạo Lĩnh vực nghiên cứu mới
export const createResearchField = async (fieldData) => {
    await fetchCsrfToken();
    const response = await apiClient.post('/api/admin/linh-vuc-nghien-cuu/add', fieldData);
    return response.data;
};

// Cập nhật Lĩnh vực nghiên cứu
export const updateResearchField = async (fieldId, fieldData) => {
    await fetchCsrfToken();
    // Đổi tên param trong URL để khớp với route backend: linhVucNghienCuu
    const response = await apiClient.put(`/api/admin/linh-vuc-nghien-cuu/update/${fieldId}`, fieldData);
    return response.data;
};

// Xóa Lĩnh vực nghiên cứu
export const deleteResearchField = async (fieldId) => {
    await fetchCsrfToken();
    // Đổi tên param trong URL để khớp với route backend: linhVucNghienCuu
    const response = await apiClient.delete(`/api/admin/linh-vuc-nghien-cuu/delete/${fieldId}`);
    return response.data;
};

// API cho Quản lý Tiến độ Đề tài
export const getResearchProgressList = (params) => apiClient.get('/api/admin/tien-do-de-tai', { params });
export const getAllLinhVuc = () => apiClient.get('/api/admin/linh-vuc-nghien-cuu');
export const getAllTrangThaiDeTai = () => apiClient.get('/api/admin/trang-thai-de-tai');
export const getAllTienDoMilestones = () => apiClient.get('/api/admin/tien-do'); // Lấy các mốc tiến độ

// API cập nhật tiến độ (Ví dụ - Cần endpoint cụ thể từ backend)
// Giả sử endpoint là PUT /api/admin/tien-do-de-tai/{de_tai_id}/update-progress
export const updateResearchProgress = (deTaiId, progressData) => {
    // progressData có thể chứa: trang_thai_id, tien_do_id (mốc mới), mo_ta, thoi_gian_nop,...
    return apiClient.post(`/api/admin/tien-do-de-tai/${deTaiId}/update-progress`, progressData);
};

// ============================
// === Related Data Fetching ===
// ============================

// Lấy danh sách Học hàm
export const getAllHocHam = async () => { return apiClient.get('/api/admin/hoc-ham').then(res => res.data); };

// Lấy danh sách Học vị
export const getAllHocVi = async () => { return apiClient.get('/api/admin/hoc-vi').then(res => res.data); };

// Lưu ý: Hàm getAllUnits và getAllTaskLevels đã có ở trên, dùng chung cho cả quản lý và lấy options.
export const getDonViList = async () => {
    const response = await apiClient.get('/api/admin/don-vi');
    return response.data; // Trả về mảng các đơn vị [{id, ten,...}]
};

export const getPendingProposalsForAdmin = (params) => {
    return apiClient.get('/api/admin/research-proposals/pending-approval', { params }); // Adjusted to match typical API prefixing
  };
  
  export const submitAdminReview = (proposalId, reviewData) => {
    // reviewData: { trang_thai_id: newStatusId, ly_do_tu_choi: "...", ghi_chu_xet_duyet: "..." }
    return apiClient.put(`api/admin/research-proposals/${proposalId}/review`, reviewData);
  };
  
  // Lấy các trạng thái Admin có thể chọn khi duyệt
  export const getAdminReviewStatusOptions = () => {
    // Ví dụ: trả về [{id: 2, ten_hien_thi: "Đã duyệt"}, {id: 4, ten_hien_thi: "Yêu cầu chỉnh sửa"}, {id: 5, ten_hien_thi: "Từ chối"}]
    // ID 1 là "Chờ duyệt"
    return apiClient.get('/api/admin/trang-thai-de-tai'); // Đảm bảo endpoint này tồn tại ở backend
  };

// Lấy tất cả vai trò thành viên
export const getAllVaiTro = () => {
  return apiClient.get('/api/admin/vai-tro'); // Endpoint bạn cung cấp
};


// Lấy danh sách bài báo đang chờ duyệt (có phân trang và filter)
export const getPendingArticles = async (params) => {
    return apiClient.get('/api/admin/articles/pending', { params }); // Ví dụ endpoint
};

// Lấy chi tiết một bài báo (bao gồm cả file đính kèm)
export const getArticleDetailsForAdmin = async (articleId) => {
    return apiClient.get(`/api/admin/articles/${articleId}`); // Ví dụ endpoint
};

// Duyệt (đồng ý) một bài báo
export const approveArticleByAdmin = async (articleId, data = {}) => {
    // data có thể trống hoặc chứa các thông tin bổ sung nếu cần
    return apiClient.post(`/api/admin/articles/${articleId}/approve`, data); // Ví dụ endpoint
};

// Từ chối một bài báo
export const rejectArticleByAdmin = async (articleId, data) => {
    // data nên chứa { ly_do_tu_choi: "..." }
    return apiClient.post(`/api/admin/articles/${articleId}/reject`, data); // Ví dụ endpoint
};