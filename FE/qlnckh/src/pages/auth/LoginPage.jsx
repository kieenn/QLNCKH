// c:/Users/maing/OneDrive/Documents/KLTN/project/FE/qlnckh/src/pages/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // !! Đảm bảo đường dẫn đúng
// Thêm Modal, Form, Button, Spinner, Alert từ react-bootstrap
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
// Import các hàm API mới từ auth.js
import { requestPasswordReset, verifyOtp, updatePasswordAfterOtp } from '../../api/auth.js';

function LoginPage() {
    const [msvc, setMsvc] = useState('');
    const [password, setPassword] = useState('');
    const [loginType, setLoginType] = useState('lecturer'); // Default 'lecturer'
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false); // State cho modal
    const { login, isLoading, error, isAuthenticated, effectiveRoles, clearError } = useAuth(); // Sử dụng effectiveRoles
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect nếu đã đăng nhập
    useEffect(() => {
        if (isAuthenticated) {
            // Điều hướng dựa trên vai trò hiệu lực
            // Nếu effectiveRoles chứa 'admin', đến trang admin,
            // ngược lại (là giảng viên) đến trang "Đề tài của tôi".
            const destination = effectiveRoles.includes('admin') ? '/admin' : '/lecturer/my-researches';
            const from = location.state?.from?.pathname || destination;
            console.log(`LoginPage: Already authenticated with effective roles [${effectiveRoles.join(', ')}]. Redirecting to: ${from}`);
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location.state, effectiveRoles]); // Thêm effectiveRoles vào dependencies

    // Xóa lỗi khi thay đổi role hoặc component unmount
    useEffect(() => {
        clearError(); // Xóa khi component mount hoặc loginType thay đổi
        return () => {
            clearError(); // Xóa khi component unmount
        };
    }, [loginType, clearError]);


    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log(`LoginPage: Submitting login for type: ${loginType}, msvc: ${msvc}`);
        // Gọi hàm login từ AuthContext
        await login({ msvc, password }, loginType);
        // Việc điều hướng được xử lý bởi useEffect ở trên
    };

    // --- Forgot Password Modal Component (Multi-step) ---
    const ForgotPasswordModal = ({ show, handleClose }) => {
        const [step, setStep] = useState('email'); // 'email', 'otp', 'password'
        const [email, setEmail] = useState('');
        const [otp, setOtp] = useState('');
        const [password, setPassword] = useState('');
        const [passwordConfirmation, setPasswordConfirmation] = useState('');
        const [isProcessing, setIsProcessing] = useState(false); // Trạng thái xử lý chung
        const [modalError, setModalError] = useState(null);
        const [modalSuccess, setModalSuccess] = useState(null);

        // Reset state khi modal đóng/mở
        useEffect(() => {
            if (!show) {
                // Delay reset để tránh lỗi khi transition
                const timer = setTimeout(() => {
                    setStep('email');
                    setEmail('');
                    setOtp('');
                    setPassword('');
                    setPasswordConfirmation('');
                    setIsProcessing(false);
                    setModalError(null);
                    setModalSuccess(null);
                }, 200);
                return () => clearTimeout(timer);
            } else {
                 // Reset khi mở
                 setStep('email');
                 setEmail('');
                 setOtp('');
                 setPassword('');
                 setPasswordConfirmation('');
                 setIsProcessing(false);
                 setModalError(null);
                 setModalSuccess(null);
            }
        }, [show]);

        // Xử lý gửi email OTP
        const handleEmailSubmit = async (e) => {
            e.preventDefault();
            setIsProcessing(true);
            setModalError(null);
            setModalSuccess(null);
            try {
                const response = await requestPasswordReset({ email });
                setModalSuccess(response.message || 'Mã OTP đã được gửi. Vui lòng kiểm tra email.');
                setStep('otp'); // Chuyển sang bước nhập OTP
            } catch (err) {
                setModalError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
            } finally {
                setIsProcessing(false);
            }
        };

        // Xử lý xác thực OTP
        const handleOtpSubmit = async (e) => {
            e.preventDefault();
            setIsProcessing(true);
            setModalError(null);
            setModalSuccess(null); // Xóa thông báo thành công cũ
            try {
                const response = await verifyOtp({ email, otp });
                // Kiểm tra trường 'status' trả về từ backend
                if (response.status === 'success') {
                    // Không đặt modalSuccess ở đây nữa, chỉ chuyển bước
                    setStep('password'); // Chỉ chuyển bước nếu status là 'success'
                } else {
                    setModalError(response.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
                }
            } catch (err) {
                setModalError(err.response?.data?.message || err.message || 'Lỗi xác thực OTP.');
            } finally {
                setIsProcessing(false);
            }
        };

        // Xử lý đặt mật khẩu mới
        const handlePasswordSubmit = async (e) => {
            e.preventDefault();
            if (password !== passwordConfirmation) {
                setModalError('Mật khẩu xác nhận không khớp.');
                return;
            }
            setIsProcessing(true);
            setModalError(null);
            setModalSuccess(null); // Xóa thông báo thành công cũ
            try {
                const response = await updatePasswordAfterOtp({ email, password, password_confirmation: passwordConfirmation });
                setModalSuccess(response.message || 'Mật khẩu đã được đặt lại thành công!');
                // Có thể đóng modal sau vài giây hoặc để người dùng tự đóng
                setTimeout(handleClose, 3000);
            } catch (err) {
                setModalError(err.response?.data?.message || err.message || 'Lỗi đặt lại mật khẩu.');
            } finally {
                setIsProcessing(false);
            }
        };

        return (
            <Modal show={show} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {step === 'email' && 'Quên Mật Khẩu'}
                        {step === 'otp' && 'Xác thực OTP'}
                        {step === 'password' && 'Đặt Mật Khẩu Mới'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalError && <Alert variant="danger">{modalError}</Alert>}
                    {modalSuccess && <Alert variant="success">{modalSuccess}</Alert>}

                    {/* Bước 1: Nhập Email */}
                    {step === 'email' && (
                        <Form onSubmit={handleEmailSubmit}>
                            <p>Nhập địa chỉ email liên kết với tài khoản của bạn. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.</p>
                            <Form.Group className="mb-3" controlId="forgotPasswordEmail">
                                <Form.Label>Địa chỉ Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Nhập email của bạn"
                                    value={email} // Giữ lại email để hiển thị
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isProcessing}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit" disabled={isProcessing} className="w-100">
                                {isProcessing ? <Spinner as="span" animation="border" size="sm" /> : 'Gửi mã OTP'}
                            </Button>
                        </Form>
                    )}

                    {/* Bước 2: Nhập OTP */}
                    {step === 'otp' && (
                        <Form onSubmit={handleOtpSubmit}>
                            <p>Một mã OTP đã được gửi đến <strong>{email}</strong>. Vui lòng nhập mã vào ô bên dưới.</p>
                            <Form.Group className="mb-3" controlId="forgotPasswordOtp">
                                <Form.Label>Mã OTP</Form.Label>
                                <Form.Control
                                    type="text"
                                    inputMode="numeric" // Gợi ý bàn phím số trên mobile
                                    placeholder="Nhập mã OTP (6 chữ số)"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                    disabled={isProcessing}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit" disabled={isProcessing} className="w-100">
                                {isProcessing ? <Spinner as="span" animation="border" size="sm" /> : 'Xác thực OTP'}
                            </Button>
                            <Button variant="link" size="sm" onClick={() => setStep('email')} disabled={isProcessing} className="mt-2">
                                Gửi lại mã?
                            </Button>
                        </Form>
                    )}

                    {/* Bước 3: Nhập Mật khẩu mới */}
                    {step === 'password' && !modalSuccess && ( // Ẩn form khi đã thành công hoàn toàn
                        <Form onSubmit={handlePasswordSubmit}>
                            <p>Nhập mật khẩu mới cho tài khoản với email <strong>{email}</strong>.</p>
                            <Form.Group className="mb-3" controlId="forgotPasswordNewPassword">
                                <Form.Label>Mật khẩu mới</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    disabled={isProcessing}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="forgotPasswordConfirmPassword">
                                <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    required
                                    minLength={8}
                                    disabled={isProcessing}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit" disabled={isProcessing} className="w-100">
                                {isProcessing ? <Spinner as="span" animation="border" size="sm" /> : 'Đặt lại mật khẩu'}
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        );
    };

    // --- JSX ---
    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'lightblue' }}> {/* Căn giữa form */}
            <div className="container" style={{ maxWidth: '1000px' }}> {/* Giới hạn chiều rộng */}
                <div className="row justify-content-center">
                    <div className="col-xl-10 col-lg-12 col-md-9">
                        <div className="card o-hidden border-0 shadow-lg"> {/* Bỏ my-5 nếu đã căn giữa bằng flexbox */}
                            <div className="card-body p-0">
                                <div className="row">
                                    {/* Image Column */}
                                    <div className="col-lg-6 d-none d-lg-block">
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#f8f9fa' }}>
                                            {/* Đường dẫn /assets/... sẽ trỏ vào thư mục public */}
                                            <img src="/assets/images/SGU-LOGO.png" alt="SGU Logo" style={{ width: '80%', maxHeight: '400px', objectFit: 'contain' }} />
                                        </div>
                                    </div>
                                    {/* Form Column */}
                                    <div className="col-lg-6">
                                        <div className="p-5">
                                            <div className="text-center">
                                                <h1 className="h4 text-gray-900 mb-4" style={{ fontWeight: 'bolder' }}> {/* Giảm margin */}
                                                    Đăng Nhập Hệ Thống QLNCKH
                                                </h1>
                                            </div>

                                            {/* Display Login Error */}
                                            {error && (
                                                <div className="alert alert-danger text-center small p-2" role="alert"> {/* Thu nhỏ alert */}
                                                    {error}
                                                </div>
                                            )}

                                            <form className="user" onSubmit={handleSubmit}>
                                                {/* MSVC Input */}
                                                <div className="form-group mb-3"> {/* Giảm margin */}
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-user" // Bỏ mb-4
                                                        id="msvc"
                                                        name="msvc"
                                                        placeholder="Tài khoản (MSVC/Username)" // Rõ hơn
                                                        value={msvc}
                                                        onChange={(e) => setMsvc(e.target.value)}
                                                        required
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                                {/* Password Input */}
                                                <div className="form-group mb-3"> {/* Giảm margin */}
                                                    <input
                                                        type="password"
                                                        className="form-control form-control-user" // Bỏ mb-4
                                                        id="password"
                                                        name="password"
                                                        placeholder="Mật khẩu"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                                {/* Role Selection */}
                                                <div className="form-group mb-4"> {/* Tăng nhẹ margin dưới */}
                                                    <label className="form-label d-block mb-2">Chọn vai trò:</label> {/* Thêm label */}
                                                    {/* Admin Role - Sử dụng Bootstrap 5 classes nếu có */}
                                                    <div className="form-check form-check-inline">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="role"
                                                            id="admin-role"
                                                            value="admin"
                                                            checked={loginType === 'admin'}
                                                            onChange={() => setLoginType('admin')}
                                                            disabled={isLoading}
                                                        />
                                                        <label className="form-check-label" htmlFor="admin-role">Quản trị viên</label>
                                                    </div>
                                                    {/* Lecturer Role */}
                                                    <div className="form-check form-check-inline">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="role"
                                                            id="lecturer-role"
                                                            value="lecturer"
                                                            checked={loginType === 'lecturer'}
                                                            onChange={() => setLoginType('lecturer')}
                                                            disabled={isLoading}
                                                        />
                                                        <label className="form-check-label" htmlFor="lecturer-role">Giảng viên</label>
                                                    </div>
                                                </div>
                                                {/* Submit Button */}
                                                <button type="submit" className="btn btn-primary btn-user btn-block w-100" disabled={isLoading}>
                                                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                                </button>
                                            </form>
                                            <hr />
                                            {/* Forgot Password link */}
                                            <div className="text-center">
                                                <Button
                                                    variant="link"
                                                    className="small p-0" // Style như link
                                                    onClick={() => setShowForgotPasswordModal(true)} // Mở modal
                                                    disabled={isLoading}
                                                >
                                                    Quên mật khẩu?
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Render Forgot Password Modal */}
                <ForgotPasswordModal
                    show={showForgotPasswordModal}
                    handleClose={() => setShowForgotPasswordModal(false)}
                />
            </div>
        </div>
    );
}

export default LoginPage;
