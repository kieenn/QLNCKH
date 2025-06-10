// c:\Users\maing\OneDrive\Documents\GitHub\QLNCKH\FE\qlnckh\src\pages\auth\LoginPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Modal, Form, Button, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { requestPasswordReset, verifyOtp, updatePasswordAfterOtp } from '../../api/auth.js';
import { Eye, EyeSlash } from 'react-bootstrap-icons';

function LoginPage() {
    const [msvc, setMsvc] = useState('');
    const [password, setPassword] = useState('');
    const [loginType, setLoginType] = useState('lecturer');
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const { login, isLoading, error, isAuthenticated, effectiveRoles, clearError } = useAuth();
    const [showMainPassword, setShowMainPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect nếu đã đăng nhập (Giữ nguyên, logic này đã đúng)
    useEffect(() => {
        if (isAuthenticated) {
            const destination = effectiveRoles.includes('admin') ? '/admin' : '/lecturer/my-researches';
            const from = location.state?.from?.pathname || destination;
            console.log(`LoginPage: Already authenticated with effective roles [${effectiveRoles.join(', ')}]. Redirecting to: ${from}`);
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location.state, effectiveRoles]);

    // =================================================================
    // ======= PHẦN SỬA ĐỔI QUAN TRỌNG ĐỂ FIX LỖI HIỂN THỊ ========
    // =================================================================
    const prevLoginTypeRef = useRef(loginType);

    // Effect to clear error when loginType actually changes by user interaction
    useEffect(() => {
        if (prevLoginTypeRef.current !== loginType) {
            console.log(`LoginPage: loginType changed from ${prevLoginTypeRef.current} to ${loginType}. Clearing error.`);
            clearError();
        }
        prevLoginTypeRef.current = loginType; // Update ref for next render
    }, [loginType, clearError]); // Depends on loginType and stable clearError

    // The useEffect hook that previously cleared errors on component unmount has been removed.
    // This is to prevent React's Strict Mode (in development) from clearing the login error
    // prematurely during its mount/unmount/remount cycle for testing effect cleanup.
    // The error state in AuthContext will now persist until it's cleared by a change in loginType
    // on this page, a new login attempt (which clears previous errors), or a logout.


    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log(`LoginPage: Submitting login for type: ${loginType}, msvc: ${msvc}`);
        await login({ msvc, password }, loginType);
    };

    // --- Forgot Password Modal Component (Giữ nguyên, logic đã tốt) ---
    const ForgotPasswordModal = ({ show, handleClose }) => {
        const [step, setStep] = useState('email');
        const [email, setEmail] = useState('');
        const [otp, setOtp] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [passwordConfirmation, setPasswordConfirmation] = useState('');
        const [isProcessing, setIsProcessing] = useState(false);
        const [modalError, setModalError] = useState(null);
        const [modalSuccess, setModalSuccess] = useState(null);
        const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);

        useEffect(() => {
            if (!show) {
                const timer = setTimeout(() => {
                    setStep('email');
                    setEmail('');
                    setOtp('');
                    setNewPassword('');
                    setPasswordConfirmation('');
                    setIsProcessing(false);
                    setModalError(null);
                    setModalSuccess(null);
                    setShowNewPasswordModal(false);
                }, 200);
                return () => clearTimeout(timer);
            } else {
                 setStep('email');
                 setEmail('');
                 setOtp('');
                 setNewPassword('');
                 setPasswordConfirmation('');
                 setIsProcessing(false);
                 setModalError(null);
                 setModalSuccess(null);
                 setShowNewPasswordModal(false);
            }
        }, [show]);

        const handleEmailSubmit = async (e) => {
            e.preventDefault();
            setIsProcessing(true);
            setModalError(null);
            setModalSuccess(null);
            try {
                const response = await requestPasswordReset({ email });
                setModalSuccess(response.message || 'Mã OTP đã được gửi. Vui lòng kiểm tra email.');
                setStep('otp');
            } catch (err) {
                setModalError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
            } finally {
                setIsProcessing(false);
            }
        };

        const handleOtpSubmit = async (e) => {
            e.preventDefault();
            setIsProcessing(true);
            setModalError(null);
            setModalSuccess(null);
            try {
                const response = await verifyOtp({ email, otp });
                if (response.status === 'success') {
                    setStep('password');
                } else {
                    setModalError(response.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
                }
            } catch (err) {
                setModalError(err.response?.data?.message || err.message || 'Lỗi xác thực OTP.');
            } finally {
                setIsProcessing(false);
            }
        };

        const handlePasswordSubmit = async (e) => {
            e.preventDefault();
            if (newPassword !== passwordConfirmation) {
                setModalError('Mật khẩu xác nhận không khớp.');
                return;
            }
            setIsProcessing(true);
            setModalError(null);
            setModalSuccess(null);
            try {
                const response = await updatePasswordAfterOtp({ email, password: newPassword, password_confirmation: passwordConfirmation });
                setModalSuccess(response.message || 'Mật khẩu đã được đặt lại thành công!');
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

                    {step === 'email' && (
                        <Form onSubmit={handleEmailSubmit}>
                            <p>Nhập địa chỉ email liên kết với tài khoản của bạn. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.</p>
                            <Form.Group className="mb-3" controlId="forgotPasswordEmail">
                                <Form.Label>Địa chỉ Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Nhập email của bạn"
                                    value={email}
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

                    {step === 'otp' && (
                        <Form onSubmit={handleOtpSubmit}>
                            <p>Một mã OTP đã được gửi đến <strong>{email}</strong>. Vui lòng nhập mã vào ô bên dưới.</p>
                            <Form.Group className="mb-3" controlId="forgotPasswordOtp">
                                <Form.Label>Mã OTP</Form.Label>
                                <Form.Control
                                    type="text"
                                    inputMode="numeric"
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

                    {step === 'password' && !modalSuccess && (
                        <Form onSubmit={handlePasswordSubmit}>
                            <p>Nhập mật khẩu mới cho tài khoản với email <strong>{email}</strong>.</p>
                            <Form.Group className="mb-3" controlId="forgotPasswordNewPassword">
                                <Form.Label>Mật khẩu mới</Form.Label>
                                <Form.Control
                                    type={showNewPasswordModal ? "text" : "password"}
                                    placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    disabled={isProcessing}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="forgotPasswordConfirmPassword">
                                <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                                <Form.Control
                                    type={showNewPasswordModal ? "text" : "password"}
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    required
                                    minLength={8}
                                    disabled={isProcessing}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="showNewPasswordCheckboxModal">
                                <Form.Check
                                    type="checkbox"
                                    label="Hiển thị mật khẩu"
                                    checked={showNewPasswordModal}
                                    onChange={() => setShowNewPasswordModal(!showNewPasswordModal)}
                                    disabled={isProcessing}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit" disabled={isProcessing || newPassword !== passwordConfirmation || newPassword.length < 8}>
                                {isProcessing ? <Spinner as="span" animation="border" size="sm" /> : 'Đặt lại mật khẩu'}
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        );
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'lightblue' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <div className="row justify-content-center">
                    <div className="col-xl-10 col-lg-12 col-md-9">
                        <div className="card o-hidden border-0 shadow-lg">
                            <div className="card-body p-0">
                                <div className="row">
                                    <div className="col-lg-6 d-none d-lg-block">
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#f8f9fa' }}>
                                            <img src="/assets/images/SGU-LOGO.png" alt="SGU Logo" style={{ width: '80%', maxHeight: '400px', objectFit: 'contain' }} />
                                        </div>
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="p-5">
                                            <div className="text-center">
                                                <h1 className="h4 text-gray-900 mb-4" style={{ fontWeight: 'bolder' }}>
                                                    Đăng Nhập Hệ Thống QLNCKH
                                                </h1>
                                            </div>

                                            {error && (
                                                <div className="alert alert-danger text-center small p-2" role="alert">
                                                    {error}
                                                </div>
                                            )}

                                            <form className="user" onSubmit={handleSubmit}>
                                                <div className="form-group mb-3">
                                                    <label htmlFor="msvc" className="form-label">Tài khoản (MSVC/Username)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-user"
                                                        id="msvc"
                                                        name="msvc"
                                                        placeholder="Nhập tài khoản"
                                                        value={msvc}
                                                        onChange={(e) => setMsvc(e.target.value)}
                                                        required
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                                <div className="form-group mb-3">
                                                    <label htmlFor="password">Mật khẩu</label>
                                                    <InputGroup>
                                                        <Form.Control
                                                            type={showMainPassword ? "text" : "password"}
                                                            className="form-control-user"
                                                            id="password"
                                                            name="password"
                                                            placeholder="Nhập mật khẩu"
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            required
                                                            disabled={isLoading}
                                                        />
                                                        <Button
                                                            variant="outline-secondary"
                                                            onClick={() => setShowMainPassword(!showMainPassword)}
                                                            disabled={isLoading}
                                                            aria-label={showMainPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                                                        >
                                                            {showMainPassword ? <EyeSlash /> : <Eye />}
                                                        </Button>
                                                    </InputGroup>
                                                </div>
                                                <div className="form-group mb-4">
                                                    <label className="form-label d-block mb-2">Chọn vai trò:</label>
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
                                                <button type="submit" className="btn btn-primary btn-user btn-block w-100" disabled={isLoading}>
                                                    {isLoading ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : ''}
                                                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                                </button>
                                            </form>
                                            <hr />
                                            <div className="text-center">
                                                <Button
                                                    variant="link"
                                                    className="small p-0"
                                                    onClick={() => setShowForgotPasswordModal(true)}
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

                <ForgotPasswordModal
                    show={showForgotPasswordModal}
                    handleClose={() => setShowForgotPasswordModal(false)}
                />
            </div>
        </div>
    );
}

export default LoginPage;