import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import lecturerApiService from '../services/lecturerApiService';
import { useAuth } from '../hooks/useAuth'; // Cần thông tin user để subscribe Pusher
import { initPusher, subscribeToLecturerNotifications, unsubscribeFromLecturerNotifications } from '../services/pusherService';
import { fetchCsrfToken } from '../api/axiosConfig'; // Cần cho Pusher auth
import { toast } from 'react-toastify';

// Tạo Context
const NotificationContext = createContext(null);

// Hook tùy chỉnh để sử dụng Context dễ dàng hơn
export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};

// Provider Component
export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const pusherSubscribedRef = React.useRef(false); // Dùng useRef để theo dõi trạng thái subscribe

    // Hàm fetch thông báo từ API
    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await lecturerApiService.getLecturerNotifications();
            setNotifications(response.data.notifications.data || []);
            setUnreadCount(response.data.unread_count || 0);
        } catch (error) {
            console.error("NotificationContext: Error fetching notifications:", error);
            // toast.error("Không thể tải thông báo."); // Có thể bỏ toast ở đây
        } finally {
            setIsLoading(false);
        }
    }, []); // Không có dependencies vì chỉ fetch dữ liệu chung

    // Hàm xử lý thông báo mới từ Pusher
    const handleNewPusherNotification = useCallback((notificationEvent) => {
        console.log("NotificationContext: New notification received via Pusher:", notificationEvent);
        if (notificationEvent && notificationEvent.payload && notificationEvent.payload.id) {
            const payloadData = notificationEvent.payload;
            const newNotification = {
                id: payloadData.id,
                data: payloadData.data || { title: 'Thông báo không có tiêu đề', body: '' },
                created_at: payloadData.created_at || new Date().toISOString(),
                read_at: null, // Thông báo mới luôn chưa đọc
            };

            setNotifications(prevNotifications => {
                 // Tránh thêm thông báo trùng lặp nếu có (dựa vào ID)
                if (prevNotifications.some(n => n.id === newNotification.id)) {
                    console.log("NotificationContext: Notification already exists, not adding:", newNotification.id);
                    return prevNotifications;
                }
                // Thêm thông báo mới vào đầu danh sách và giới hạn số lượng
                // Có thể giới hạn số lượng trong context nếu muốn, hoặc để component hiển thị tự giới hạn
                return [newNotification, ...prevNotifications]; //.slice(0, 20); // Giới hạn 20 thông báo trong context
            });
            setUnreadCount(prevCount => prevCount + 1);
            toast.info(`Thông báo mới: ${newNotification.data?.title || 'Nội dung không xác định'}`, { autoClose: 8000 });
        } else {
            console.warn(
                "NotificationContext: Received Pusher notification without a valid payload or 'id'. Notification was not added. Event data:",
                notificationEvent
            );
        }
    }, []); // Không có dependencies vì chỉ sử dụng setNotifications và setUnreadCount

    // Hàm đánh dấu một thông báo là đã đọc
    const markAsRead = useCallback(async (notificationId) => {
        if (!notificationId) {
            console.error("NotificationContext: Cannot mark as read, notificationId is missing.");
            return;
        }
        // Cập nhật state ngay lập tức (optimistic update)
        setNotifications(prev => prev.map(n =>
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await lecturerApiService.markNotificationAsRead(notificationId);
            // Nếu API thành công, state đã đúng rồi, không cần làm gì thêm
            // toast.success("Đã đánh dấu thông báo là đã đọc."); // Có thể bỏ toast này
        } catch (error) {
            console.error(`NotificationContext: Error marking notification ${notificationId} as read:`, error);
            // Hoàn tác optimistic update nếu API lỗi (tùy chọn, có thể phức tạp)
            // setNotifications(prev => prev.map(n =>
            //     n.id === notificationId ? { ...n, read_at: null } : n // Giả sử trạng thái trước đó là null
            // ));
            // setUnreadCount(prev => prev + 1);
            toast.error("Lỗi khi đánh dấu đã đọc.");
        }
    }, []); // Không có dependencies

    // Hàm đánh dấu tất cả thông báo là đã đọc
    const markAllAsRead = useCallback(async () => {
         // Cập nhật state ngay lập tức (optimistic update)
        setNotifications(prev => prev.map(n =>
             n.read_at ? n : { ...n, read_at: new Date().toISOString() }
        ));
        setUnreadCount(0);

        try {
            await lecturerApiService.markAllNotificationsAsRead();
            // toast.success("Đã đánh dấu tất cả thông báo là đã đọc."); // Bỏ toast này theo yêu cầu trước
        } catch (error) {
            console.error("NotificationContext: Error marking all notifications as read:", error);
             // Hoàn tác optimistic update nếu API lỗi (tùy chọn)
            // fetchNotifications(); // Cách đơn giản là fetch lại toàn bộ
            toast.error("Lỗi khi đánh dấu tất cả đã đọc.");
        }
    }, []); // Không có dependencies

    // Effect để fetch thông báo ban đầu khi component mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]); // Phụ thuộc vào fetchNotifications (được bọc trong useCallback)

    // Effect để khởi tạo và đăng ký Pusher
    useEffect(() => {
        const lecturerMsvc = user?.msvc;

        const initializeAndSubscribe = async () => {
            if (user && lecturerMsvc) {
                if (!pusherSubscribedRef.current) {
                    try {
                        console.log("NotificationContext: Attempting to initialize and subscribe Pusher for MSVC:", lecturerMsvc);
                        await fetchCsrfToken();
                        const pusherClientInstance = initPusher();

                        if (pusherClientInstance) {
                            // Đăng ký kênh và truyền callback xử lý thông báo mới
                            subscribeToLecturerNotifications(lecturerMsvc, handleNewPusherNotification);
                            pusherSubscribedRef.current = true;
                            console.log(`NotificationContext: Pusher subscribed successfully for MSVC ${lecturerMsvc}.`);
                        } else {
                            console.error("NotificationContext: Failed to initialize Pusher client.");
                        }
                    } catch (error) {
                        console.error("NotificationContext: Error during Pusher initialization or subscription:", error);
                    }
                } else {
                     // Nếu đã subscribe, đảm bảo callback được cập nhật
                    subscribeToLecturerNotifications(lecturerMsvc, handleNewPusherNotification);
                }
            } else {
                 // Nếu user logout hoặc không có msvc, hủy đăng ký
                if (pusherSubscribedRef.current) {
                    console.log("NotificationContext: User logged out or MSVC not present, cleaning up Pusher subscription.");
                    unsubscribeFromLecturerNotifications();
                    pusherSubscribedRef.current = false;
                    // Reset state thông báo khi logout
                    setNotifications([]);
                    setUnreadCount(0);
                }
            }
        };

        initializeAndSubscribe();

        // Cleanup function
        return () => {
            if (pusherSubscribedRef.current) {
                console.log("NotificationContext: useEffect cleanup - Unsubscribing due to unmount or user change.");
                unsubscribeFromLecturerNotifications();
                pusherSubscribedRef.current = false;
            }
        };
    }, [user, handleNewPusherNotification]); // Phụ thuộc vào user và callback Pusher

    // Giá trị được cung cấp bởi Context
    const contextValue = {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications, // Cung cấp hàm fetch để các component khác có thể tải lại
        markAsRead,
        markAllAsRead,
        // Không cần cung cấp handleNewPusherNotification ra ngoài
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

// Lưu ý: Component LecturerNotificationListener.jsx có thể được xóa bỏ
// vì logic Pusher đã chuyển vào NotificationProvider.
// Nếu bạn có logic khác trong LecturerNotificationListener, hãy tích hợp nó vào đây
// hoặc điều chỉnh lại vai trò của nó.