// src/components/admin/EditUserModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';

const EditUserModal = ({ show, onHide, user, onSave }) => {
    // State cho thông tin cơ bản
    const [hoTen, setHoTen] = useState('');
    const [msvc, setMsvc] = useState('');
    const [email, setEmail] = useState('');
    const [sdt, setSdt] = useState('');
    const [dob, setDob] = useState(''); // Thêm state cho ngày sinh

    // State cho mật khẩu mới (tùy chọn)
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Cập nhật state khi user prop thay đổi
    useEffect(() => {
        if (user) {
            setHoTen(user.hoTen || '');
            setMsvc(user.msvc || '');
            setEmail(user.email || '');
            setSdt(user.sdt || '');
            // Định dạng ngày sinh từ user prop (nếu có) sang YYYY-MM-DD
            setDob(user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
            // Reset password fields khi mở modal
            setNewPassword('');
            setNewPasswordConfirmation('');
            setError(null);

            setValidationErrors({});
        } else {
             setHoTen(''); setMsvc(''); setEmail(''); setSdt('');
             setNewPassword(''); setNewPasswordConfirmation('');
             setError(null); setValidationErrors({});
        }
    }, [user, show]); // Thêm show vào dependency để reset khi mở lại

    // --- Client-Side Validation ---
    const validateForm = () => {
        const errors = {};
        if (!hoTen.trim()) errors.hoTen = "Họ tên không được để trống.";
        if (!msvc.trim()) errors.msvc = "MSVC/Username không được để trống.";
        if (!email.trim()) errors.email = "Email không được để trống.";
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Email không hợp lệ.";

        // --- Validation cho mật khẩu mới (chỉ khi có nhập) ---
        if (newPassword) { // Chỉ validate nếu có nhập mật khẩu mới
            if (newPassword.length < 8) {
                errors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự.";
            }
            if (newPassword !== newPasswordConfirmation) {
                errors.newPasswordConfirmation = "Xác nhận mật khẩu mới không khớp.";
            }
        } else if (newPasswordConfirmation) {
            // Nếu chỉ nhập xác nhận mà không nhập mật khẩu mới
             errors.newPassword = "Vui lòng nhập mật khẩu mới.";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // --- Xử lý Lưu thay đổi ---
    const handleSaveChanges = async () => {
        setError(null);
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        const updatedUserData = {
            hoTen: hoTen.trim(),
            msvc: msvc.trim(),
            email: email.trim(),
            sdt: sdt.trim() || null,
            dob: dob || null, // Thêm dob vào dữ liệu gửi đi, gửi null nếu rỗng
        };

        // --- Chỉ thêm password vào data nếu có nhập mật khẩu mới ---
        if (newPassword) {
            updatedUserData.password = newPassword;
            updatedUserData.password_confirmation = newPasswordConfirmation;
        }

        try {
            await onSave(user.id, updatedUserData);
        } catch (saveError) {
            const errorMessage = saveError.response?.data?.message || saveError.message || "Lỗi không xác định khi lưu.";
            setError(errorMessage);
            if (saveError.response?.data?.errors) {
                const backendErrors = {};
                for (const field in saveError.response.data.errors) {
                    // Map lỗi backend vào state validationErrors
                    // Đổi tên key lỗi password từ backend nếu cần (ví dụ: 'password' -> 'newPassword')
                    const frontendField = field === 'password' ? 'newPassword' : field;
                    backendErrors[frontendField] = saveError.response.data.errors[field].join(' ');
                }
                setValidationErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
            <Modal.Header closeButton={!isSaving}>
                <Modal.Title>Chỉnh sửa thông tin người dùng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form noValidate>
                    {/* --- Thông tin cơ bản --- */}
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="editUserHoTen">
                                <Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" value={hoTen} onChange={(e) => setHoTen(e.target.value)} isInvalid={!!validationErrors.hoTen} disabled={isSaving} required autoFocus />
                                <Form.Control.Feedback type="invalid">{validationErrors.hoTen}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="editUserMsvc">
                                <Form.Label>MSVC/Username <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" value={msvc} onChange={(e) => setMsvc(e.target.value)} isInvalid={!!validationErrors.msvc} disabled={isSaving} required />
                                <Form.Control.Feedback type="invalid">{validationErrors.msvc}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                         <Col md={6}>
                            <Form.Group className="mb-3" controlId="editUserEmail">
                                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} isInvalid={!!validationErrors.email} disabled={isSaving} required />
                                <Form.Control.Feedback type="invalid">{validationErrors.email}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                             <Form.Group className="mb-3" controlId="editUserSdt">
                                <Form.Label>Số điện thoại</Form.Label>
                                <Form.Control type="text" placeholder="(Tùy chọn)" value={sdt} onChange={(e) => setSdt(e.target.value)} isInvalid={!!validationErrors.sdt} disabled={isSaving} />
                                <Form.Control.Feedback type="invalid">{validationErrors.sdt}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="editUserDob">
                                <Form.Label>Ngày sinh</Form.Label>
                                <Form.Control type="date" value={dob} onChange={(e) => setDob(e.target.value)} isInvalid={!!validationErrors.dob} disabled={isSaving} />
                                <Form.Control.Feedback type="invalid">{validationErrors.dob}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        {/* Có thể thêm cột khác ở đây nếu cần */}
                    </Row>

                    <hr />

                    {/* --- Đặt lại mật khẩu (Tùy chọn) --- */}
                    <h5 className="mb-3">Đặt lại mật khẩu (Tùy chọn)</h5>
                    <p className="text-muted small">Để trống nếu không muốn thay đổi mật khẩu.</p>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="editUserNewPassword">
                                <Form.Label>Mật khẩu mới</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    isInvalid={!!validationErrors.newPassword}
                                    disabled={isSaving}
                                    aria-describedby="editPasswordHelpBlock"
                                />
                                {validationErrors.newPassword ? (
                                    <Form.Control.Feedback type="invalid">{validationErrors.newPassword}</Form.Control.Feedback>
                                ) : (
                                    <Form.Text id="editPasswordHelpBlock" muted>Ít nhất 8 ký tự.</Form.Text>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="editUserNewPasswordConfirmation">
                                <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={newPasswordConfirmation}
                                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                    isInvalid={!!validationErrors.newPasswordConfirmation}
                                    disabled={isSaving}
                                    // Chỉ required nếu newPassword có giá trị
                                    required={!!newPassword}
                                />
                                <Form.Control.Feedback type="invalid">{validationErrors.newPasswordConfirmation}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                     {/* Thông tin không sửa được */}
                     <p className="text-muted small mt-3">
                        Trạng thái Super Admin và Quyền chi tiết được quản lý trong mục "Phân quyền".
                    </p>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isSaving}>
                    Hủy bỏ
                </Button>
                {/* Disable nút Lưu nếu thông tin cơ bản không hợp lệ */}
                <Button
                    variant="primary"
                    onClick={handleSaveChanges}
                    disabled={isSaving || !hoTen.trim() || !msvc.trim() || !email.trim() || (!!newPassword && newPassword !== newPasswordConfirmation)}
                >
                    {isSaving ? <><Spinner as="span" animation="border" size="sm" className="me-2"/> Đang lưu...</> : 'Lưu thay đổi'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditUserModal;
