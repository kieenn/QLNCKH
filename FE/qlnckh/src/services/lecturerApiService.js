import apiClient from '../api/axiosConfig'; // Assuming you have a configured axios instance

/**
 * Fetches notifications for the logged-in lecturer.
 * @param {object} params - Query parameters for pagination (e.g., { page, per_page }).
 * @returns {Promise<AxiosResponse<any>>}
 */
export const getLecturerNotifications = (params) => {
    return apiClient.get('/api/notifications', { params });
};

/**
 * Marks a specific notification as read for the logged-in lecturer.
 * @param {string} notificationId - The ID of the notification to mark as read.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const markNotificationAsRead = (notificationId) => {
    return apiClient.patch(`/api/notifications/${notificationId}/read`);
};

/**
 * Marks all unread notifications as read for the logged-in lecturer.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const markAllNotificationsAsRead = () => {
    return apiClient.patch('/api/notifications/mark-all-as-read');
};

// Add other lecturer-specific API calls here as needed.
// For example:
// export const getLecturerProfile = () => {
//     return apiClient.get('/lecturer/profile');
// };

// export const updateLecturerProfile = (data) => {
//     return apiClient.post('/lecturer/profile', data);
// };

// export const submitResearchTopic = (data) => {
//     return apiClient.post('/lecturer/research-topics/submit', data);
// };

const lecturerApiService = {
    getLecturerNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};
export default lecturerApiService;