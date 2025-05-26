// src/components/admin/AddUserModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, ListGroup, Row, Col } from 'react-bootstrap';
import apiClient from '../../api/axiosConfig';

const AddUserModal = ({ show, onHide, onSave }) => {
    // ... (Các state giữ nguyên) ...
    const [hoTen, setHoTen] = useState('');
    const [msvc, setMsvc] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isSuperAdminChecked, setIsSuperAdminChecked] = useState(false);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermissionCodes, setSelectedPermissionCodes] = useState(new Set());
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // --- useEffect (Giữ nguyên) ---
    useEffect(() => {
        // ... (code fetch permissions và reset form) ...
    }, [show]);

    // --- Client-Side Validation Logic ---
    // *** THÊM CONSOLE LOG VÀO ĐÂY ĐỂ XEM LỖI VALIDATION ***
    const validateForm = () => {
        console.log("AddUserModal: Running validateForm..."); // Log khi bắt đầu validate
        const errors = {};
        if (!hoTen.trim()) errors.hoTen = "Họ tên không được để trống.";
        if (!msvc.trim()) errors.msvc = "MSVC/Username không được để trống.";
        if (!email.trim()) errors.email = "Email không được để trống.";
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Email không hợp lệ.";
        if (!password) errors.password = "Mật khẩu không được để trống.";
        else if (password.length < 8) errors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
        if (!passwordConfirmation) errors.passwordConfirmation = "Vui lòng xác nhận mật khẩu.";
        else if (password !== passwordConfirmation) errors.passwordConfirmation = "Xác nhận mật khẩu không khớp.";

        setValidationErrors(errors);
        const isValid = Object.keys(errors).length === 0;
        console.log("AddUserModal: Validation errors:", errors); // Log các lỗi tìm thấy
        console.log("AddUserModal: Validation result:", isValid); // Log kết quả cuối cùng
        return isValid;
    };

    // --- Các hàm handle khác (Giữ nguyên) ---
    const handleCheckboxChange = (permissionCode) => { /* ... */ };
    const handleSuperAdminChange = (e) => { /* ... */ };

    // --- Handle Save Button Click ---
    // *** THÊM CONSOLE LOG VÀO ĐÂY ***
    const handleSaveChanges = async () => {
        console.log("AddUserModal: handleSaveChanges CALLED!"); // Log khi hàm được gọi
        setError(null);

        // Gọi validation và kiểm tra kết quả
        if (!validateForm()) {
             console.log("AddUserModal: Validation FAILED. Stopping save."); // Log nếu validation thất bại
             return; // Dừng lại nếu không hợp lệ
        }
        console.log("AddUserModal: Validation PASSED."); // Log nếu validation thành công

        setIsSaving(true);
        const userData = {
            hoTen: hoTen.trim(),
            msvc: msvc.trim(),
            email: email.trim(),
            password: password,
            password_confirmation: passwordConfirmation,
            is_superadmin: isSuperAdminChecked,
            permissions: isSuperAdminChecked ? [] : Array.from(selectedPermissionCodes)
        };
        console.log('AddUserModal: User data prepared:', userData); // Log dữ liệu chuẩn bị gửi

        try {
            console.log('AddUserModal: Calling onSave prop...'); // Log ngay trước khi gọi onSave
            await onSave(userData); // Gọi hàm handleAddNewUser từ ManageAccountsPage
            console.log('AddUserModal: onSave prop finished.'); // Log sau khi onSave hoàn thành (nếu không có lỗi)
            // Component cha (ManageAccountsPage) sẽ đóng modal nếu onSave thành công
        } catch (saveError) {
            console.error('AddUserModal: Error caught from onSave:', saveError); // Log lỗi từ onSave
            const errorMessage = saveError.response?.data?.message || saveError.message || "Lỗi không xác định khi lưu.";
            setError(errorMessage);
            if (saveError.response?.data?.errors) {
                const backendErrors = {};
                for (const field in saveError.response.data.errors) {
                    backendErrors[field] = saveError.response.data.errors[field].join(' ');
                }
                setValidationErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
            }
        } finally {
            setIsSaving(false);
        }
    };

    // --- JSX Return (Giữ nguyên) ---
    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
            <Modal.Header closeButton={!isSaving}>
                <Modal.Title>Thêm tài khoản mới</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form noValidate>
                    {/* ... (Các Form.Group cho input) ... */}
                     <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="addUserName">
                                <Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" placeholder="Nhập họ tên" value={hoTen} onChange={(e) => setHoTen(e.target.value)} isInvalid={!!validationErrors.hoTen} disabled={isSaving} required autoFocus />
                                <Form.Control.Feedback type="invalid">{validationErrors.hoTen}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                             <Form.Group className="mb-3" controlId="addUserMsvc">
                                <Form.Label>MSVC/Username <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" placeholder="Nhập MSVC hoặc username" value={msvc} onChange={(e) => setMsvc(e.target.value)} isInvalid={!!validationErrors.msvc} disabled={isSaving} required />
                                <Form.Control.Feedback type="invalid">{validationErrors.msvc}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3" controlId="addUserEmail">
                        <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="email" placeholder="Nhập địa chỉ email" value={email} onChange={(e) => setEmail(e.target.value)} isInvalid={!!validationErrors.email} disabled={isSaving} required />
                        <Form.Control.Feedback type="invalid">{validationErrors.email}</Form.Control.Feedback>
                    </Form.Group>
                     <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="addUserPassword">
                                <Form.Label>Mật khẩu <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="password" placeholder="Ít nhất 8 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} isInvalid={!!validationErrors.password} disabled={isSaving} required aria-describedby="passwordHelpBlock"/>
                                {validationErrors.password ? ( <Form.Control.Feedback type="invalid">{validationErrors.password}</Form.Control.Feedback> ) : ( <Form.Text id="passwordHelpBlock" muted>Ít nhất 8 ký tự.</Form.Text> )}
                            </Form.Group>
                        </Col>
                         <Col md={6}>
                            <Form.Group className="mb-3" controlId="addUserPasswordConfirmation">
                                <Form.Label>Xác nhận mật khẩu <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="password" placeholder="Nhập lại mật khẩu" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} isInvalid={!!validationErrors.passwordConfirmation} disabled={isSaving} required />
                                <Form.Control.Feedback type="invalid">{validationErrors.passwordConfirmation}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <hr />
                    <h5 className="mb-3">Phân quyền ban đầu</h5>
                    <Form.Group className="mb-3 border p-3 rounded bg-light">
                        <Form.Check type="switch" id="add-superadmin-switch" label={<strong>Đặt làm Super Admin</strong>} checked={isSuperAdminChecked} onChange={handleSuperAdminChange} disabled={isSaving} />
                        <Form.Text muted>Super Admin sẽ có toàn quyền truy cập.</Form.Text>
                    </Form.Group>
                    {!isSuperAdminChecked && (
                        <>
                            <h6 className="mt-4">Quyền chi tiết (nếu không phải Super Admin):</h6>
                            {isLoadingPermissions ? ( <div className="text-center"><Spinner animation="border" size="sm" /> Đang tải quyền...</div>
                            ) : availablePermissions.length > 0 ? (
                                <ListGroup variant="flush" style={{ maxHeight: '200px', overflowY: 'auto' }} className="border rounded">
                                    {availablePermissions.map((permission) => (
                                        <ListGroup.Item key={permission.ma_quyen} className="py-2">
                                            <Form.Check type="checkbox" id={`add-perm-${permission.ma_quyen}`} label={<><span className="fw-medium">{permission.ma_quyen}</span>{permission.mo_ta && <small className="d-block text-muted">{permission.mo_ta}</small>}</>} checked={selectedPermissionCodes.has(permission.ma_quyen)} onChange={() => handleCheckboxChange(permission.ma_quyen)} disabled={isSaving} />
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : ( <p className="text-muted">Không có quyền chi tiết nào được định nghĩa.</p> )}
                        </>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isSaving}>Hủy bỏ</Button>
                {/* Nút này gọi handleSaveChanges */}
                <Button variant="primary" onClick={handleSaveChanges} disabled={isSaving || isLoadingPermissions}>
                    {isSaving ? <><Spinner as="span" animation="border" size="sm" className="me-2"/> Đang lưu...</> : 'Thêm người dùng'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddUserModal;
