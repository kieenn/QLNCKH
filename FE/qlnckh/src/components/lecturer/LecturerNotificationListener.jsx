// c:\Users\maing\OneDrive\Documents\KLTN\project\FE\qlnckh\src\components\lecturer\LecturerNotificationListener.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    initPusher,
    subscribeToLecturerNotifications,
    unsubscribeFromLecturerNotifications,
} from '../../services/pusherService'; // Đảm bảo đường dẫn này đúng
import { useAuth } from '../../hooks/useAuth'; // Đảm bảo đường dẫn này đúng
import { fetchCsrfToken } from '../../api/axiosConfig';

const LecturerNotificationListener = () => {
    const { user } = useAuth(); 
    const [pusherSubscribedForLecturer, setPusherSubscribedForLecturer] = useState(false);

    // Xác định xem có thể đăng ký kênh giảng viên không
    // Dựa vào việc user tồn tại và có user.msvc
    const canSubscribeAsLecturer = !!user && !!user.msvc;

    useEffect(() => {
        const initializeAndSubscribeLecturer = async () => {
            console.log("LecturerNotificationListener: useEffect triggered. canSubscribeAsLecturer:", canSubscribeAsLecturer, "userMsvc:", user?.msvc, "pusherSubscribedForLecturer:", pusherSubscribedForLecturer);
            
            if (canSubscribeAsLecturer && !pusherSubscribedForLecturer) {
                try {
                    console.log("LecturerNotificationListener: Conditions met. Lecturer MSVC:", user.msvc, ". Initializing Pusher...");
                    await fetchCsrfToken(); // Đảm bảo CSRF token được lấy trước
                    const pusherInstance = initPusher(); // Khởi tạo hoặc lấy instance đã có
                    
                    if (pusherInstance) {
                        setPusherSubscribedForLecturer(true); // Đánh dấu đã cố gắng subscribe
                        console.log("LecturerNotificationListener: Pusher initialized/retrieved for lecturer.");

                        const handleLecturerNotification = (data) => {
                            console.log("LecturerNotificationListener: Received notification data - ", data);
                            if (data && data.payload && data.payload.message) {
                                const notificationMessage = data.payload.message;
                                
                                let toastType = 'info';
                                if (data.eventType.includes('approved')) {
                                    toastType = 'success';
                                } else if (data.eventType.includes('rejected')) {
                                    toastType = 'error';
                                }

                                toast[toastType](notificationMessage, {
                                    position: "top-right",
                                    autoClose: 10000,
                                    theme: "colored",
                                });
                                console.log(`LecturerNotificationListener: Toast displayed for eventType: ${data.eventType} with message: "${notificationMessage}"`);
                                
                                // Bắn custom event để LecturerHeader hoặc các component khác có thể cập nhật
                                if (data.eventType === 'baibao.approved' || data.eventType === 'baibao.rejected') {
                                    window.dispatchEvent(new CustomEvent('lecturer-article-status-updated', { detail: { eventType: data.eventType, payload: data.payload } }));
                                }
                                if (data.eventType === 'detai.approved' || data.eventType === 'detai.rejected') {
                                    window.dispatchEvent(new CustomEvent('lecturer-topic-status-updated', { detail: { eventType: data.eventType, payload: data.payload } }));
                                }
                            } else {
                                console.warn("LecturerNotificationListener: Received notification without valid payload or message:", data);
                            }
                        };

                        subscribeToLecturerNotifications(user.msvc, handleLecturerNotification);
                        console.log("LecturerNotificationListener: Subscribed to lecturer notifications for MSVC:", user.msvc);
                    } else {
                        console.error("LecturerNotificationListener: Failed to initialize Pusher (initPusher returned null).");
                    }
                } catch (error) {
                    console.error("LecturerNotificationListener: Error during Pusher initialization or CSRF token fetching:", error);
                }
            }
        };

        initializeAndSubscribeLecturer();

        return () => {
            // Chỉ unsubscribe nếu đã từng cố gắng subscribe và user còn tồn tại
            if (pusherSubscribedForLecturer && user?.msvc) { 
                console.log("LecturerNotificationListener: Component unmounting or dependencies changed. Unsubscribing from lecturer notifications for MSVC:", user.msvc);
                unsubscribeFromLecturerNotifications();
                // setPusherSubscribedForLecturer(false); // Reset để có thể subscribe lại nếu component mount lại
            }
        };
    }, [canSubscribeAsLecturer, user, pusherSubscribedForLecturer]); // Phụ thuộc vào các giá trị này

    return null; 
};

export default LecturerNotificationListener;