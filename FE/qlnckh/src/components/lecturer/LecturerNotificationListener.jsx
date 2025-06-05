import React, { useState, useEffect, useCallback } from 'react';
import lecturerApiService from '../../services/lecturerApiService';
import { toast } from 'react-toastify';

// (Tùy chọn) Tạo một Context để chia sẻ state thông báo
// export const NotificationContext = React.createContext();

const LecturerNotificationListener = ({ children }) => {
    // const [notifications, setNotifications] = useState([]);
    // const [unreadCount, setUnreadCount] = useState(0);
    // const [isLoading, setIsLoading] = useState(false);

    // const fetchNotifications = useCallback(async () => {
    //     setIsLoading(true);
    //     try {
    //         const response = await lecturerApiService.getLecturerNotifications();
    //         setNotifications(response.data.notifications.data || []);
    //         setUnreadCount(response.data.unread_count || 0);
    //     } catch (error) {
    //         console.error("Error fetching notifications:", error);
    //         // Không nên toast error ở đây nếu nó chạy ngầm, trừ khi là lỗi nghiêm trọng
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }, []);

    // useEffect(() => {
    //     fetchNotifications();
    //     const intervalId = setInterval(fetchNotifications, 60000); // Fetch mỗi phút
    //     return () => clearInterval(intervalId);
    // }, [fetchNotifications]);

    // const markAsRead = async (notificationId) => { /* ... */ };
    // const markAllAsRead = async () => { /* ... */ };

    // (Tùy chọn) Nếu dùng Context:
    // const contextValue = { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead };
    // return <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>;

    // Nếu không dùng Context và LecturerHeader tự fetch, component này có thể chỉ để lắng nghe WebSocket (nếu có)
    // Hoặc đơn giản là không cần thiết nếu Header tự quản lý việc fetch.
    // Trong ví dụ này, LecturerHeader đang tự fetch, nên Listener này có thể không cần thiết
    // hoặc chỉ dùng cho các tác vụ nền khác liên quan đến thông báo.

    return null; // Component này không render UI trực tiếp
};

export default LecturerNotificationListener;