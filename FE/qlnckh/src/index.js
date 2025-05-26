import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './assets/css/App.css'; // Import CSS chung
import 'bootstrap/dist/css/bootstrap.min.css';
// Nếu bạn quyết định dùng Bootstrap JS (cần cài đặt 'bootstrap')
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // <--- THÊM DÒNG NÀY (NẾU CẦN JS)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
