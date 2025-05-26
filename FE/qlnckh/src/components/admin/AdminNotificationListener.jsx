// c:\Users\maing\OneDrive\Documents\KLTN\project\FE\qlnckh\src\components\admin\AdminNotificationListener.jsx
import React, { useEffect, useState } from 'react';
import { 
    initPusher, 
    subscribeToAdminNotifications, 
    unsubscribeFromAdminNotifications, 
    // disconnectPusher 
} from '../../services/pusherService'; 
import { useAuth } from '../../hooks/useAuth'; 
import { toast } from 'react-toastify';
import { fetchCsrfToken } from '../../api/axiosConfig'; 

const AdminNotificationListener = () => {
  const { user, roles } = useAuth(); 
  const [pusherInitialized, setPusherInitialized] = useState(false);

  const isAdmin = user && roles && (roles.includes('admin') || roles.includes('superadmin'));

  useEffect(() => {
    const initializeAndSubscribe = async () => {
      if (isAdmin && !pusherInitialized) {
        try {
          console.log("AdminNotificationListener: Admin detected, initializing Pusher...");
          await fetchCsrfToken(); 
          initPusher(); 
          setPusherInitialized(true);
          console.log("AdminNotificationListener: Pusher initialized and CSRF token fetched.");

          const handleAdminNotification = (data) => {
            console.log("AdminNotificationListener: Received notification data - ", data);
            
            if (data && data.payload && data.payload.message) { // Đảm bảo lấy message từ payload
                const notificationMessage = data.payload.message;
                
                let onClickAction = () => {}; 

                if (data.eventType === 'bai-bao.submitted') {
                    onClickAction = () => {
                        // Điều hướng đến trang xét duyệt bài báo
                        // Cân nhắc dùng useNavigate nếu component này có thể truy cập context của Router
                        if (window.location.pathname !== '/admin/approve-articles') {
                           window.location.href = '/admin/approve-articles'; 
                        }
                    };
                } else if (data.eventType === 'research.topic.submitted') {
                    // onClickAction = () => { 
                    //   if (window.location.pathname !== '/admin/approve-topics') {
                    //     window.location.href = '/admin/approve-topics'; 
                    //   }
                    // };
                }

                toast.info(notificationMessage, { // Hiển thị message chi tiết
                  position: "top-right",
                  autoClose: 10000, 
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "colored",
                  onClick: onClickAction, 
                });
                console.log(`AdminNotificationListener: Toast displayed with message: "${notificationMessage}" for eventType: ${data.eventType}`);

                if (data.eventType === 'bai-bao.submitted') {
                    const event = new CustomEvent('new-article-submitted', { detail: data.payload });
                    window.dispatchEvent(event);
                    console.log("AdminNotificationListener: Dispatched 'new-article-submitted' event.");
                } else if (data.eventType === 'research.topic.submitted') {
                    const event = new CustomEvent('new-research-topic-submitted', { detail: data.payload });
                    window.dispatchEvent(event);
                    console.log("AdminNotificationListener: Dispatched 'new-research-topic-submitted' event.");
                }
            } else {
                console.warn("AdminNotificationListener: Received notification without valid payload or message:", data);
            }
          };

          subscribeToAdminNotifications(handleAdminNotification);
          console.log("AdminNotificationListener: Subscribed to admin notifications.");

        } catch (error) {
          console.error("AdminNotificationListener: Error during Pusher initialization or CSRF token fetching:", error);
        }
      } else if (!isAdmin && pusherInitialized) {
        console.log("AdminNotificationListener: User is no longer admin, unsubscribing...");
        unsubscribeFromAdminNotifications();
        setPusherInitialized(false); 
      }
    };

    initializeAndSubscribe();

    return () => {
      if (pusherInitialized) { 
        console.log("AdminNotificationListener: Component unmounting or isAdmin/pusherInitialized changed, unsubscribing...");
        unsubscribeFromAdminNotifications();
        // setPusherInitialized(false); // Reset ở đây có thể gây subscribe lại không cần thiết nếu chỉ là re-render
      }
    };
  }, [isAdmin, pusherInitialized]); 

  return null; 
};

export default AdminNotificationListener;
