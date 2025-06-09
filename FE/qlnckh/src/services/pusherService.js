// c:\Users\maing\OneDrive\Documents\KLTN\project\FE\qlnckh\src\services\pusherService.js
import Pusher from 'pusher-js';
import apiClient from '../api/axiosConfig'; // Sử dụng apiClient đã cấu hình từ axiosConfig.js

let pusherClient = null;

// Admin Channel
let adminChannel = null;
let currentAdminNotificationCallback = () => {}; // Callback cho AdminNotificationListener
let isAdminEventsBound = false; 

// Lecturer Channel
let lecturerChannel = null;
let currentLecturerNotificationCallback = () => {}; // Callback cho LecturerNotificationListener
let isLecturerEventsBound = false;

console.log("Pusher Service: Loading...");

// Sử dụng process.env cho Create React App
const PUSHER_APP_KEY = process.env.REACT_APP_PUSHER_APP_KEY;
const PUSHER_APP_CLUSTER = process.env.REACT_APP_PUSHER_APP_CLUSTER;

export const initPusher = () => {
  if (!PUSHER_APP_KEY || !PUSHER_APP_CLUSTER) {
    console.error("Pusher Service: Pusher App Key hoặc Cluster chưa được cấu hình ở frontend (kiểm tra file .env REACT_APP_PUSHER_APP_KEY và REACT_APP_PUSHER_APP_CLUSTER).");
    return null;
  }

  // Nếu pusherClient đã tồn tại và đang kết nối hoặc đã kết nối
  if (pusherClient && (pusherClient.connection.state === 'connected' || pusherClient.connection.state === 'connecting')) {
    console.log("Pusher Service: Pusher client đã được khởi tạo và đang hoạt động. State:", pusherClient.connection.state);
    return pusherClient;
  }
  
  // Nếu có client cũ nhưng không ở trạng thái connected/connecting (ví dụ: 'disconnected', 'failed', 'unavailable')
  // Ngắt kết nối nó hoàn toàn trước khi tạo mới để tránh rò rỉ hoặc subscription kép.
  if (pusherClient) {
    console.warn("Pusher Service: Previous Pusher client instance exists with state:", pusherClient.connection.state, ". Disconnecting it before creating a new one.");
    pusherClient.disconnect(); // Ngắt kết nối instance cũ. Các channel và binding của nó sẽ tự động bị hủy khi disconnect.
    
    // Reset các biến global liên quan đến channel vì chúng thuộc về instance cũ.
    // Điều này quan trọng để đảm bảo các hàm subscribeTo...Notifications sẽ hoạt động đúng với client mới.
    adminChannel = null;
    isAdminEventsBound = false;
    currentAdminNotificationCallback = () => {};

    lecturerChannel = null;
    isLecturerEventsBound = false;
    currentLecturerNotificationCallback = () => {};
  }

  console.log("Pusher Service: Đang khởi tạo Pusher client MỚI với Key:", PUSHER_APP_KEY, "Cluster:", PUSHER_APP_CLUSTER);
  pusherClient = new Pusher(PUSHER_APP_KEY, {
    cluster: PUSHER_APP_CLUSTER,
    authEndpoint: '/broadcasting/auth', // Endpoint này phải khớp với backend Laravel
    authorizer: (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          console.log(`Pusher Service: Đang xác thực cho kênh: ${channel.name}, socketId: ${socketId}`);
          apiClient.post('/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name
          })
          .then(response => {
            console.log("Pusher Service: Xác thực Pusher thành công cho kênh:", channel.name);
            callback(null, response.data);
          })
          .catch(error => {
            console.error(`Pusher Service: Lỗi xác thực Pusher cho kênh ${channel.name}:`, error.response?.data || error.message, "Status:", error.response?.status);
            callback(new Error(`Pusher Service: Lỗi xác thực cho kênh ${channel.name}. Status: ${error.response?.status}`), { auth: "" });
          });
        }
      };
    }
  });

  pusherClient.connection.bind('connected', () => {
    console.log('Pusher Service: Pusher đã kết nối!');
  });

  pusherClient.connection.bind('error', (err) => {
    console.error('Pusher Service: Lỗi kết nối Pusher:', err);
    if (err.error?.data?.code === 4001 || err.error?.data?.code === 4004) {
        console.error('Pusher Service: App key không hợp lệ, không tồn tại hoặc cluster sai. Kiểm tra cấu hình PUSHER_APP_KEY và PUSHER_APP_CLUSTER.');
    }
  });
  
  pusherClient.connection.bind('disconnected', () => {
    console.log('Pusher Service: Pusher đã ngắt kết nối.');
  });

  return pusherClient;
};

export const disconnectPusher = () => {
  if (pusherClient) {
    console.log('Pusher Service: Attempting to disconnect Pusher.');
    unsubscribeFromAdminNotifications(); // Hủy đăng ký kênh admin nếu có
    unsubscribeFromLecturerNotifications(); // Hủy đăng ký kênh giảng viên nếu có

    pusherClient.disconnect();
    // Không nên set pusherClient = null ngay lập tức nếu có thể init lại
    // Chỉ reset các channel và flags
    adminChannel = null;
    isAdminEventsBound = false;
    lecturerChannel = null;
    isLecturerEventsBound = false;
    console.log('Pusher Service: Pusher đã ngắt kết nối và các kênh đã được dọn dẹp.');
  } else {
    console.log('Pusher Service: Pusher client chưa được khởi tạo, không cần ngắt kết nối.');
  }
};

// --- Admin Notifications ---
export const subscribeToAdminNotifications = (onNotificationCallback) => {
  if (!pusherClient) {
    console.error("Pusher Service (Admin): Pusher chưa được khởi tạo. Gọi initPusher() trước.");
    return null;
  }

  const channelName = 'private-admin-notifications'; // Backend định nghĩa là 'admin-notifications'
  const researchSubmittedEvent = 'research.topic.submitted';
  const articleSubmittedEvent = 'bai-bao.submitted';

  currentAdminNotificationCallback = onNotificationCallback || (() => {});

  if (!adminChannel || adminChannel.name !== channelName) {
    if (adminChannel) {
        adminChannel.unbind_all(); // Đảm bảo gỡ bỏ tất cả bindings cũ trên kênh admin cũ
        pusherClient.unsubscribe(adminChannel.name);
        console.log(`Pusher Service (Admin): Đã hủy đăng ký kênh admin cũ: ${adminChannel.name}`);
        isAdminEventsBound = false;
    }
    console.log(`Pusher Service (Admin): Đang đăng ký kênh admin: ${channelName}`);
    adminChannel = pusherClient.subscribe(channelName);
    isAdminEventsBound = false;
  } else {
    console.log(`Pusher Service (Admin): Kênh admin ${channelName} đã được đăng ký trước đó.`);
  }

  if (adminChannel && !isAdminEventsBound) {
    console.log(`Pusher Service (Admin): Đang bind các sự kiện trên kênh admin ${channelName}.`);
    const bindEvent = (eventName) => {
      adminChannel.bind(eventName, (data) => {
        console.log(`Pusher Service (Admin): Nhận được sự kiện '${eventName}':`, data);
        currentAdminNotificationCallback({ eventType: eventName, payload: data });
      });
      console.log(`Pusher Service (Admin): Đã bind sự kiện '${eventName}'.`);
    };
    bindEvent(researchSubmittedEvent);
    bindEvent(articleSubmittedEvent);
    isAdminEventsBound = true;
  }

  adminChannel.bind('pusher:subscription_succeeded', () => {
    console.log(`Pusher Service (Admin): Đã đăng ký thành công kênh: ${channelName}`);
  });
  adminChannel.bind('pusher:subscription_error', (status) => {
    console.error(`Pusher Service (Admin): Lỗi đăng ký kênh ${channelName}. Status:`, status);
  });

  return adminChannel;
};

export const unsubscribeFromAdminNotifications = () => {
  if (adminChannel && pusherClient) {
    const channelName = adminChannel.name;
    adminChannel.unbind_all(); // Gỡ bỏ tất cả bindings trước khi hủy đăng ký
    pusherClient.unsubscribe(channelName);
    isAdminEventsBound = false;
    adminChannel = null;
    currentAdminNotificationCallback = () => {};
    console.log(`Pusher Service (Admin): Đã hủy đăng ký kênh ${channelName}`);
  }
};

// --- Lecturer Notifications ---
export const subscribeToLecturerNotifications = (lecturerMsvc, onNotificationCallback) => {
  if (!pusherClient) {
    console.error("Pusher Service (Lecturer): Pusher chưa được khởi tạo. Gọi initPusher() trước.");
    return null;
  }
  if (!lecturerMsvc) {
    console.error("Pusher Service (Lecturer): Lecturer MSVC is required.");
    return null;
  }

  const channelName = `private-lecturer-notifications.${lecturerMsvc}`; // SỬA Ở ĐÂY: Dùng dấu chấm
  const articleApprovedEvent = 'baibao.approved';
  const articleRejectedEvent = 'baibao.rejected';
  const topicApprovedEvent = 'detai.approved';
  const topicRejectedEvent = 'detai.rejected';

  currentLecturerNotificationCallback = onNotificationCallback || (() => {});

  if (!lecturerChannel || lecturerChannel.name !== channelName) {
    if (lecturerChannel) {
        lecturerChannel.unbind_all(); // Đảm bảo gỡ bỏ tất cả bindings cũ trên kênh giảng viên cũ
        pusherClient.unsubscribe(lecturerChannel.name);
        console.log(`Pusher Service (Lecturer): Đã hủy đăng ký kênh giảng viên cũ: ${lecturerChannel.name}`);
        isLecturerEventsBound = false;
    }
    console.log(`Pusher Service (Lecturer): Đang đăng ký kênh giảng viên: ${channelName} cho MSVC: ${lecturerMsvc}`);
    lecturerChannel = pusherClient.subscribe(channelName);
    isLecturerEventsBound = false;
  } else {
    console.log(`Pusher Service (Lecturer): Kênh giảng viên ${channelName} đã được đăng ký trước đó.`);
  }

  if (lecturerChannel && !isLecturerEventsBound) {
    console.log(`Pusher Service (Lecturer): Đang bind các sự kiện trên kênh giảng viên ${channelName}.`);
    const bindEvent = (eventName) => {
      lecturerChannel.bind(eventName, (data) => {
        console.log(`Pusher Service (Lecturer): Nhận được sự kiện '${eventName}':`, data);
        currentLecturerNotificationCallback({ eventType: eventName, payload: data });
      });
      console.log(`Pusher Service (Lecturer): Đã bind sự kiện '${eventName}'.`);
    };
    bindEvent(articleApprovedEvent);
    bindEvent(articleRejectedEvent);
    bindEvent(topicApprovedEvent);
    bindEvent(topicRejectedEvent);
    isLecturerEventsBound = true;
  }

  lecturerChannel.bind('pusher:subscription_succeeded', () => {
    console.log(`Pusher Service (Lecturer): Đã đăng ký thành công kênh: ${channelName}`);
  });
  lecturerChannel.bind('pusher:subscription_error', (status) => {
    console.error(`Pusher Service (Lecturer): Lỗi đăng ký kênh ${channelName}. Status:`, status);
  });

  return lecturerChannel;
};

export const unsubscribeFromLecturerNotifications = () => {
  if (lecturerChannel && pusherClient) {
    const channelName = lecturerChannel.name;
    lecturerChannel.unbind_all(); // Gỡ bỏ tất cả bindings trước khi hủy đăng ký
    pusherClient.unsubscribe(channelName);
    isLecturerEventsBound = false;
    lecturerChannel = null;
    currentLecturerNotificationCallback = () => {};
    console.log(`Pusher Service (Lecturer): Đã hủy đăng ký kênh ${channelName}`);
  }
};