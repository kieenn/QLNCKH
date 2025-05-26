import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient, { fetchCsrfToken } from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Lưu trữ toàn bộ object user từ API
    const [effectiveRoles, setEffectiveRoles] = useState([]); // Vai trò hiệu lực dựa trên loginType
    const [permissions, setPermissions] = useState([]); // Lưu mảng các mã quyền ['ma_quyen_1', ...]
    const [currentLoginType, setCurrentLoginType] = useState(localStorage.getItem('loginType') || null); // Lưu loginType đã chọn
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Hàm kiểm tra trạng thái đăng nhập (quan trọng)
    const checkAuthStatus = useCallback(async () => {
        const storedLoginType = localStorage.getItem('loginType');
        console.log("AuthContext: Checking authentication status...");
        try {
            const response = await apiClient.get('/api/user'); // API này cần trả về user + is_superadmin + permission_codes
            if (response.data) {
                const userData = response.data;
                console.log("AuthContext: User authenticated", userData);
                setUser(userData); // Lưu toàn bộ user data

                // Lấy danh sách mã quyền từ response backend (giả sử key là 'permission_codes')
                const userPermCodes = userData.permission_codes || [];
                setPermissions(userPermCodes);

                // Xác định vai trò hiệu lực dựa trên storedLoginType và is_superadmin
                let rolesForSession = [];
                if (storedLoginType === 'admin') {
                    // Cho phép vào session admin nếu là superadmin HOẶC có ít nhất một quyền admin (permission_codes không rỗng)
                    if (userData.is_superadmin || (userPermCodes && userPermCodes.length > 0)) {
                        rolesForSession = ['admin'];
                        // Superadmin cũng có thể có vai trò lecturer nếu hệ thống cho phép
                        if (userData.is_superadmin) {
                            // rolesForSession.push('lecturer'); // Bỏ comment nếu superadmin cũng có thể là lecturer
                        }
                    } else {
                        // Không phải superadmin và không có quyền admin nào
                        console.warn("AuthContext: User tried admin session without superadmin rights or any admin permissions.");
                        throw new Error("Insufficient permissions for admin session.");
                    }
                } else if (storedLoginType === 'lecturer') {
                    // Dù user có là is_superadmin, nếu họ chọn login là lecturer, vai trò chỉ là lecturer
                    rolesForSession = ['lecturer'];
                } else {
                    // Không có loginType hợp lệ, hoặc user không có quyền cho loginType đó
                    console.warn("AuthContext: No valid storedLoginType or insufficient rights.");
                    throw new Error("No valid session type.");
                }
                setEffectiveRoles(rolesForSession);
                setCurrentLoginType(storedLoginType); // Cập nhật currentLoginType từ localStorage

                setIsAuthenticated(true);
            } else {
                 console.log("AuthContext: No user data received, treating as unauthenticated.");
                 setUser(null);
                 setEffectiveRoles([]);
                 setPermissions([]);
                 setCurrentLoginType(null);
                 setIsAuthenticated(false);
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                 console.log("AuthContext: User is not authenticated (401).");
            } else {
                 console.error("AuthContext: Error checking auth status:", err);
            }
             setUser(null);
             setEffectiveRoles([]);
             setPermissions([]);
             setCurrentLoginType(null);
             localStorage.removeItem('loginType'); // Xóa loginType nếu có lỗi
             setIsAuthenticated(false);
        } finally {
            // Chỉ set isLoading false sau lần check đầu tiên
            if (isLoading) {
                setIsLoading(false);
            }
        }
    }, [isLoading]); // Phụ thuộc vào isLoading để chỉ chạy một lần logic set isLoading = false

    useEffect(() => {
        checkAuthStatus();
    }, []); // Chỉ chạy 1 lần khi mount

    // Hàm đăng nhập
    const login = async (credentials, loginType) => {
        console.log(`AuthContext: Attempting login for type: ${loginType}`);
        setIsLoading(true);
        setError(null);
        try {
            await fetchCsrfToken();
            console.log("AuthContext: CSRF token fetched before login.");

            let loginEndpoint = '';
            if (loginType === 'admin') {
                loginEndpoint = '/api/admin/login';
            } else if (loginType === 'lecturer') {
                loginEndpoint = '/api/lecturer/login'; // API đăng nhập của giảng viên
            } else {
                setError('Loại đăng nhập không hợp lệ.');
                setIsLoading(false);
                return; // Dừng thực thi nếu loginType không hợp lệ
            }

            // Không cần gửi loginType lên backend nếu backend không xử lý
            const response = await apiClient.post(loginEndpoint, {
                msvc: credentials.msvc, // Backend cần kiểm tra cả msvc/email
                password: credentials.password,
            });

            if (response.data) {
                // Sau khi login thành công, lưu loginType đã chọn
                localStorage.setItem('loginType', loginType);
                setCurrentLoginType(loginType); // Cập nhật state
                console.log("AuthContext: Login successful");
                // Quan trọng: Gọi lại checkAuthStatus để lấy user, is_superadmin và permissions mới nhất
                // checkAuthStatus sẽ sử dụng loginType vừa lưu để xác định effectiveRoles
                await checkAuthStatus();
            } else {
                setError("Đăng nhập thành công nhưng không nhận được dữ liệu người dùng.");
                setIsAuthenticated(false);
            }

        } catch (err) {
            console.error("AuthContext: Login failed", err.response);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Sai tài khoản hoặc mật khẩu.';
            setError(errorMessage);
            setUser(null);
            setEffectiveRoles([]);
            setCurrentLoginType(null); localStorage.removeItem('loginType');
            setPermissions([]);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm đăng xuất
    const logout = async () => {
        console.log("AuthContext: Logging out...");
        setIsLoading(true);
        setError(null);
        try {
            // await fetchCsrfToken(); // Nếu backend yêu cầu CSRF cho logout
            await apiClient.post('/api/logout');
            console.log("AuthContext: Logout successful on backend.");
        } catch (err) {
            console.error("AuthContext: Logout failed on backend", err.response);
        } finally {
            // Luôn xóa thông tin ở frontend
            setUser(null);
            setEffectiveRoles([]);
            setCurrentLoginType(null); localStorage.removeItem('loginType');
            setPermissions([]); // Xóa permissions
            setIsAuthenticated(false);
            setIsLoading(false);
            console.log("AuthContext: Cleared frontend auth state.");
            navigate('/login', { replace: true });
        }
    };

    // Hàm kiểm tra quyền (quan trọng)
    const hasPermission = useCallback((permissionCode) => {
        // Super Admin luôn có mọi quyền
        if (user?.is_superadmin) {
            return true;
        }
        // Kiểm tra xem mã quyền có trong mảng permissions không
        // Đảm bảo permissionCode truyền vào là string và khớp với ma_quyen trong DB
        return permissions.includes(permissionCode);
    }, [user, permissions]); // Phụ thuộc user (để check is_superadmin) và mảng permissions

    const clearError = () => { setError(null); };

    // Cung cấp giá trị context
    const value = {
        user,           // Object user đầy đủ (có is_superadmin)
        effectiveRoles, // Vai trò hiệu lực cho phiên đăng nhập hiện tại
        currentLoginType, // Loại đăng nhập người dùng đã chọn
        permissions,    // Mảng các mã quyền ['ma_quyen_1', ...]
        hasPermission,  // Hàm kiểm tra quyền cụ thể
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        checkAuthStatus,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
