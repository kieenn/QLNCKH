// src/App.js
import React from 'react';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter ở đây
import AppRouter from './router'; // Đảm bảo đường dẫn đến file router đúng
import { AuthProvider } from './contexts/AuthContext'; // Đảm bảo đường dẫn đến context đúng
import './assets/css/App.css'; // Đảm bảo đường dẫn đến CSS đúng

function App() {
  return (
    // Đặt BrowserRouter bao bọc AuthProvider và AppRouter
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
