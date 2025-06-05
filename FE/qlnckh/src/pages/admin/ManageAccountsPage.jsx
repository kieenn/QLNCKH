// c:/Users/maing/OneDrive/Documents/KLTN/project/FE/qlnckh/src/pages/admin/ManageAccountsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import usePagination from '../../hooks/usePagination'; // Đường dẫn tới hook
import {
    Container, Card, Table, Button, Spinner, Alert, Pagination, Row, Col, InputGroup, FormControl, // Thêm InputGroup, FormControl
    Modal, Badge, ButtonGroup, Form, ListGroup, Tooltip, OverlayTrigger, FormSelect
} from 'react-bootstrap'; // Import các component cần thiết, thêm FormSelect
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaSearch, FaSyncAlt } from 'react-icons/fa'; // Thêm icons cho đẹp (cần cài react-icons)
import apiClient, { fetchCsrfToken } from '../../api/axiosConfig'; // Import API client
import { useAuth } from '../../hooks/useAuth'; // Import hook xác thực

// Nếu chưa cài react-icons: npm install react-icons

// --- Component Modal Phân Quyền ---
const PermissionsModal = ({ show, onHide, user, onSave }) => {
    const { user: currentUser } = useAuth();
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermissionCodes, setSelectedPermissionCodes] = useState(new Set());
    const [isSuperAdminChecked, setIsSuperAdminChecked] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (show && user && user.id) {
            const loadData = async () => {
                setIsLoadingData(true);
                setError(null);
                setAvailablePermissions([]);
                setSelectedPermissionCodes(new Set());
                setIsSuperAdminChecked(user.is_superadmin || false);

                try {
                    const allPermsPromise = apiClient.get('/api/admin/permissions');
                    const userPermsPromise = apiClient.get(`/api/admin/users/${user.id}/permissions`);

                    const [allPermsResponse, userPermsResponse] = await Promise.all([allPermsPromise, userPermsPromise]);

                    const allPermissionsData = allPermsResponse.data || [];
                    if (!Array.isArray(allPermissionsData)) {
                        throw new Error("Dữ liệu danh sách quyền không hợp lệ từ API.");
                    }
                    setAvailablePermissions(allPermissionsData);

                    const userPermissionsData = userPermsResponse.data || [];
                    if (!Array.isArray(userPermissionsData)) {
                        setSelectedPermissionCodes(new Set());
                    } else {
                        const currentUserPermCodes = userPermissionsData
                            .map(p => p.ma_quyen)
                            .filter(code => typeof code === 'string' && code);
                        setSelectedPermissionCodes(new Set(currentUserPermCodes));
                    }

                } catch (err) {
                    console.error("PermissionsModal: Error loading data:", err.response?.data || err.message);
                    setError(err.response?.data?.message || "Không thể tải dữ liệu phân quyền. Vui lòng thử lại.");
                    setAvailablePermissions([]);
                    setSelectedPermissionCodes(new Set());
                } finally {
                    setIsLoadingData(false);
                }
            };
            loadData();
        } else {
            // Reset state khi modal ẩn hoặc user không hợp lệ
            if (!show) {
                 const timer = setTimeout(() => { // Delay reset để tránh lỗi khi đang transition
                    setAvailablePermissions([]);
                    setSelectedPermissionCodes(new Set());
                    setIsSuperAdminChecked(false);
                    setError(null);
                    setIsLoadingData(false);
                 }, 200);
                 return () => clearTimeout(timer);
            } else if (show && (!user || !user.id)) {
                 console.error("PermissionsModal: Invalid or missing user prop:", user);
                 setError("Dữ liệu người dùng không hợp lệ để phân quyền.");
                 setIsLoadingData(false);
                 setAvailablePermissions([]);
                 setSelectedPermissionCodes(new Set());
            }
        }
    }, [show, user]);

    const handleCheckboxChange = (permissionCode) => {
        setSelectedPermissionCodes(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(permissionCode)) newSelected.delete(permissionCode);
            else newSelected.add(permissionCode);
            return newSelected;
        });
    };

    const handleSuperAdminChange = (e) => {
        const checked = e.target.checked;
        setIsSuperAdminChecked(checked);
        // Nếu cấp super admin, bỏ chọn tất cả quyền chi tiết
        if (checked) setSelectedPermissionCodes(new Set());
    };

    const handleSaveChanges = async () => {
        if (!user || !user.id) {
             setError("Không thể lưu, thiếu thông tin người dùng.");
             return;
        }
        setIsSaving(true);
        setError(null); // Reset lỗi trước khi lưu
        try {
            // Gọi hàm onSave được truyền từ component cha
            await onSave(user.id, {
                permissions: isSuperAdminChecked ? [] : Array.from(selectedPermissionCodes),
                is_superadmin: isSuperAdminChecked
            });
            // Không cần đóng modal ở đây, component cha sẽ xử lý
        } catch (saveError) {
            // Hiển thị lỗi trong modal
            setError(saveError.message || "Lỗi không xác định khi lưu.");
        } finally {
            setIsSaving(false);
        }
    };

    // Kiểm tra xem user đang phân quyền có phải là user đang đăng nhập không
    const isCurrentUser = currentUser && user && currentUser.id === user.id;

    return (
        // backdrop="static" ngăn đóng modal khi click ra ngoài
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
            <Modal.Header closeButton={!isSaving}>
                <Modal.Title>Phân quyền cho: {user?.ho_ten || user?.msvc || 'N/A'}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {/* Hiển thị lỗi nếu có */}
                {error && <Alert variant="danger">{error}</Alert>}
                {/* Hiển thị spinner khi đang tải dữ liệu */}
                {isLoadingData ? (
                    <div className="text-center p-4"><Spinner animation="border" variant="primary" /><p className="mt-2">Đang tải dữ liệu...</p></div>
                ) : (
                    <>
                        {/* Switch Super Admin */}
                        <Form.Group className="mb-3 border p-3 rounded bg-light">
                            <Form.Check
                                type="switch"
                                id={`superadmin-switch-${user?.id}`}
                                label={<strong>Cấp quyền Super Admin</strong>}
                                checked={isSuperAdminChecked}
                                onChange={handleSuperAdminChange}
                                disabled={isSaving || isCurrentUser} // Vô hiệu hóa nếu đang lưu hoặc là user hiện tại
                                title={isCurrentUser ? "Không thể tự thay đổi trạng thái Super Admin" : ""}
                            />
                            <Form.Text muted>Super Admin có toàn quyền truy cập hệ thống.</Form.Text>
                        </Form.Group>

                        {/* Danh sách quyền chi tiết */}
                        <h5 className="mt-4">Quyền chi tiết:</h5>
                        {availablePermissions.length > 0 ? (
                            <ListGroup variant="flush" style={{ maxHeight: '250px', overflowY: 'auto' }} className="border rounded">
                                {availablePermissions.map((permission) => {
                                    // Bỏ qua nếu dữ liệu permission không hợp lệ
                                    if (!permission || typeof permission.ma_quyen !== 'string') return null;
                                    // Vô hiệu hóa checkbox nếu đang lưu hoặc đã cấp super admin
                                    const isDisabled = isSaving || isSuperAdminChecked;
                                    // Kiểm tra xem quyền này có được chọn không (và không phải super admin)
                                    const isChecked = !isSuperAdminChecked && selectedPermissionCodes.has(permission.ma_quyen);
                                    return (
                                        <ListGroup.Item key={permission.ma_quyen} className="py-2">
                                            <Form.Check
                                                type="checkbox"
                                                id={`perm-${permission.ma_quyen}`}
                                                label={
                                                    <>
                                                        <span className="fw-medium">{permission.ma_quyen}</span>
                                                        {/* Hiển thị mô tả nếu có */}
                                                        {permission.mo_ta && <small className="d-block text-muted">{permission.mo_ta}</small>}
                                                    </>
                                                }
                                                checked={isChecked}
                                                onChange={() => handleCheckboxChange(permission.ma_quyen)}
                                                disabled={isDisabled}
                                            />
                                        </ListGroup.Item>
                                    );
                                })}
                            </ListGroup>
                        ) : (
                            // Thông báo nếu không có quyền nào
                            <p className="text-muted">Không có quyền chi tiết nào được định nghĩa hoặc không thể tải.</p>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                {/* Nút Hủy */}
                <Button variant="secondary" onClick={onHide} disabled={isSaving}>Hủy bỏ</Button>
                {/* Nút Lưu */}
                <Button variant="primary" onClick={handleSaveChanges} disabled={isLoadingData || isSaving}>
                    {isSaving ? <><Spinner as="span" animation="border" size="sm" className="me-2"/> Đang lưu...</> : 'Lưu thay đổi'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// --- Component Modal Thêm ---
const AddUserModal = ({ show, onHide, onSave }) => {
    // --- State cho form ---
    const [formData, setFormData] = useState({
        ho_ten: '',
        msvc: '',
        email: '',
        sdt: '',
        password: '',
        password_confirmation: '',
        is_superadmin: false,
        permissions: [], // Mảng chứa các ma_quyen được chọn
        // Thêm state cho các ID khóa ngoại
        hoc_ham_id: '',
        hoc_vi_id: '',
        dob: '', // Thêm ngày sinh
        don_vi_id: ''
    });
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [isLoadingPerms, setIsLoadingPerms] = useState(false);
    // State mới để lưu danh sách và trạng thái loading
    const [options, setOptions] = useState({ hocHam: [], hocVi: [], donVi: [] });
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({}); // State cho lỗi validation

    // Load danh sách quyền và options khi modal mở
    useEffect(() => {
        if (show) {
            setIsLoadingPerms(true);
            setIsLoadingOptions(true);
            setError(null); // Reset lỗi khi mở
            setValidationErrors({}); // Reset lỗi validation

            const fetchPermissions = apiClient.get('/api/admin/permissions');
            // Gọi API lấy các options
            const fetchHocHam = apiClient.get('/api/admin/hoc-ham');
            const fetchHocVi = apiClient.get('/api/admin/hoc-vi');
            const fetchDonVi = apiClient.get('/api/admin/don-vi');

            Promise.all([fetchPermissions, fetchHocHam, fetchHocVi, fetchDonVi])
                .then(([permsRes, hocHamRes, hocViRes, donViRes]) => {
                    setAvailablePermissions(permsRes.data || []);
                    setOptions({
                        hocHam: hocHamRes.data || [],
                        hocVi: hocViRes.data || [],
                        donVi: donViRes.data || []
                    });
                })
                .catch(err => setError("Không thể tải dữ liệu cần thiết (quyền, học hàm,...)."))
                .finally(() => {
                    setIsLoadingPerms(false);
                    setIsLoadingOptions(false);
                });

            // Reset form khi mở modal
            setFormData({
                ho_ten: '', msvc: '', email: '', sdt: '', password: '', password_confirmation: '', is_superadmin: false, permissions: [], hoc_ham_id: '', hoc_vi_id: '', don_vi_id: '', dob: ''
            });
        }
    }, [show]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newState = { ...prev };
            if (name === 'is_superadmin') {
                newState.is_superadmin = checked;
                newState.permissions = checked ? [] : prev.permissions;
            } else if (type === 'checkbox' && name === 'permissions') {
                const permCode = value;
                const newPermissions = new Set(prev.permissions);
                if (checked) {
                    newPermissions.add(permCode);
                } else {
                    newPermissions.delete(permCode);
                }
                newState.permissions = Array.from(newPermissions);
            } else {
                newState[name] = value;
            }
            return newState;
        });
        // Xóa lỗi validation khi người dùng nhập
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // --- Client-Side Validation ---
    const validateAddForm = () => {
        const errors = {};
        if (!formData.ho_ten.trim()) errors.ho_ten = "Họ tên không được để trống.";
        if (!formData.msvc.trim()) errors.msvc = "MSVC không được để trống.";
        if (!formData.email.trim()) errors.email = "Email không được để trống.";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email không hợp lệ.";
        if (!formData.password) errors.password = "Mật khẩu không được để trống.";
        else if (formData.password.length < 8) errors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
        if (formData.password !== formData.password_confirmation) errors.password_confirmation = "Xác nhận mật khẩu không khớp.";

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        setError(null); // Reset lỗi chung
        if (!validateAddForm()) {
            return; // Dừng nếu validation lỗi
        }

        setIsSaving(true);
        try {
            // Truyền dữ liệu form đã được chuẩn hóa (đặc biệt là permissions)
            await onSave({
                ...formData,
                permissions: formData.is_superadmin ? [] : formData.permissions,
                // Đảm bảo gửi null nếu không chọn
                hoc_ham_id: formData.hoc_ham_id || null,
                hoc_vi_id: formData.hoc_vi_id || null,
                don_vi_id: formData.don_vi_id || null,
                dob: formData.dob || null, // Gửi null nếu rỗng
            });
            onHide(); // Đóng modal nếu thành công
        } catch (err) {
            // Xử lý lỗi từ backend (ví dụ: lỗi validation từ server)
            const errorMessage = err.response?.data?.message || err.message || "Lỗi không xác định khi lưu.";
            setError(errorMessage);
            if (err.response?.data?.errors) {
                // Map lỗi validation từ backend vào state validationErrors
                const backendErrors = {};
                for (const field in err.response.data.errors) {
                    backendErrors[field] = err.response.data.errors[field].join(' ');
                }
                setValidationErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} backdrop="static" size="lg">
            <Modal.Header closeButton> <Modal.Title>Thêm tài khoản mới</Modal.Title> </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form noValidate>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="addHoTen">
                                <Form.Label>Họ Tên <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="ho_ten" value={formData.ho_ten} onChange={handleChange} required isInvalid={!!validationErrors.ho_ten} disabled={isSaving}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.ho_ten}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="addMsvc">
                                <Form.Label>MSVC <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="msvc" value={formData.msvc} onChange={handleChange} required isInvalid={!!validationErrors.msvc} disabled={isSaving}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.msvc}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="addEmail">
                                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required isInvalid={!!validationErrors.email} disabled={isSaving}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.email}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                         <Col md={6}>
                            <Form.Group className="mb-3" controlId="addSdt">
                                <Form.Label>Số điện thoại</Form.Label>
                                <Form.Control type="tel" name="sdt" value={formData.sdt} onChange={handleChange} disabled={isSaving}/>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                             <Form.Group className="mb-3" controlId="addDob">
                                <Form.Label>Ngày sinh</Form.Label>
                                <Form.Control type="date" name="dob" value={formData.dob} onChange={handleChange} disabled={isSaving} isInvalid={!!validationErrors.dob}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.dob}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                             {/* Có thể thêm trường khác ở đây nếu cần */}
                        </Col>
                    </Row>
                     <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="addPassword">
                                <Form.Label>Mật khẩu <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required isInvalid={!!validationErrors.password} disabled={isSaving}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.password}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                             <Form.Group className="mb-3" controlId="addPasswordConfirmation">
                                <Form.Label>Xác nhận mật khẩu <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} required isInvalid={!!validationErrors.password_confirmation} disabled={isSaving}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.password_confirmation}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3" controlId="addHocHam">
                                <Form.Label>Học hàm</Form.Label>
                                <Form.Select name="hoc_ham_id" value={formData.hoc_ham_id} onChange={handleChange} disabled={isLoadingOptions || isSaving}>
                                    <option value="">-- Chọn học hàm --</option>
                                    {options.hocHam.map(hh => <option key={hh.id} value={hh.id}>{hh.ten || hh.ten_hoc_ham}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3" controlId="addHocVi">
                                <Form.Label>Học vị</Form.Label>
                                <Form.Select name="hoc_vi_id" value={formData.hoc_vi_id} onChange={handleChange} disabled={isLoadingOptions || isSaving}>
                                    <option value="">-- Chọn học vị --</option>
                                    {options.hocVi.map(hv => <option key={hv.id} value={hv.id}>{hv.ten || hv.ten_hoc_vi}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3" controlId="addDonVi">
                                <Form.Label>Đơn vị</Form.Label>
                                <Form.Select name="don_vi_id" value={formData.don_vi_id} onChange={handleChange} disabled={isLoadingOptions || isSaving}>
                                    <option value="">-- Chọn đơn vị --</option>
                                    {options.donVi.map(dv => <option key={dv.id} value={dv.id}>{dv.ten}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                     <hr />
                     <Form.Group className="mb-3">
                        <Form.Check
                            type="switch"
                            id="addIsSuperAdmin"
                            label={<strong>Cấp quyền Super Admin</strong>}
                            name="is_superadmin"
                            checked={formData.is_superadmin}
                            onChange={handleChange}
                            disabled={isSaving}
                        />
                    </Form.Group>
                    {!formData.is_superadmin && (
                        <Form.Group>
                            <Form.Label>Quyền chi tiết:</Form.Label>
                            {isLoadingPerms ? <Spinner size="sm"/> : (
                                <div style={{ maxHeight: '150px', overflowY: 'auto' }} className="border rounded p-2">
                                    {availablePermissions.map(perm => (
                                        <Form.Check
                                            key={perm.ma_quyen}
                                            type="checkbox"
                                            id={`add-perm-${perm.ma_quyen}`}
                                            label={`${perm.ma_quyen} (${perm.mo_ta || '...'})`}
                                            name="permissions"
                                            value={perm.ma_quyen}
                                            checked={formData.permissions.includes(perm.ma_quyen)}
                                            onChange={handleChange}
                                            disabled={isSaving}
                                        />
                                    ))}
                                </div>
                            )}
                        </Form.Group>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isSaving}>Hủy</Button>
                <Button variant="primary" onClick={handleSave} disabled={isSaving || isLoadingPerms || isLoadingOptions}>
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// --- Component Modal Sửa ---
const EditUserModal = ({ show, onHide, user, onSave }) => {
    // --- State cho form ---
    const [formData, setFormData] = useState({ ho_ten: '', email: '', sdt: '', dob: '', password: '', password_confirmation: '', hoc_ham_id: '', hoc_vi_id: '', don_vi_id: '' });
    // State mới để lưu danh sách và trạng thái loading
    const [options, setOptions] = useState({ hocHam: [], hocVi: [], donVi: [] });
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({}); // Thêm state cho lỗi validation

     // Load data user vào form khi modal mở hoặc user thay đổi
     useEffect(() => {
        if (user) {
            setFormData({
                // Load các giá trị từ user prop
                ho_ten: user.ho_ten || '',
                email: user.email || '',
                sdt: user.sdt || '',
                // Định dạng lại ngày sinh từ API (nếu cần) về YYYY-MM-DD
                // Giả sử API trả về 'YYYY-MM-DD' hoặc có thể parse được bằng new Date()
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                // Load các ID hiện tại của user
                hoc_ham_id: user.hoc_ham_id || '',
                hoc_vi_id: user.hoc_vi_id || '',
                don_vi_id: user.don_vi_id || '',
                password: '', // Luôn reset password fields khi mở modal
                password_confirmation: ''
            });
            setError(null); // Reset lỗi khi mở modal
            setValidationErrors({}); // Reset lỗi validation

            // Load các options
            setIsLoadingOptions(true);
            const fetchHocHam = apiClient.get('/api/admin/hoc-ham');
            const fetchHocVi = apiClient.get('/api/admin/hoc-vi');
            const fetchDonVi = apiClient.get('/api/admin/don-vi');

            Promise.all([fetchHocHam, fetchHocVi, fetchDonVi])
                .then(([hocHamRes, hocViRes, donViRes]) => {
                    setOptions({ hocHam: hocHamRes.data || [], hocVi: hocViRes.data || [], donVi: donViRes.data || [] });
                })
                .catch(err => setError("Không thể tải danh sách học hàm/học vị/đơn vị."))
                .finally(() => setIsLoadingOptions(false));
        }
    }, [user, show]); // Thêm show vào dependency để reset khi mở lại

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Xóa lỗi validation khi người dùng bắt đầu nhập lại
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // --- Client-Side Validation ---
    const validateForm = () => {
        const errors = {};
        if (!formData.ho_ten.trim()) errors.ho_ten = "Họ tên không được để trống.";
        if (!formData.email.trim()) errors.email = "Email không được để trống.";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email không hợp lệ.";

        // --- Validation cho mật khẩu mới (chỉ khi có nhập) ---
        if (formData.password) { // Chỉ validate nếu có nhập mật khẩu mới
            if (formData.password.length < 8) {
                errors.password = "Mật khẩu mới phải có ít nhất 8 ký tự.";
            }
            if (formData.password !== formData.password_confirmation) {
                errors.password_confirmation = "Xác nhận mật khẩu mới không khớp.";
            }
        } else if (formData.password_confirmation) {
            // Nếu chỉ nhập xác nhận mà không nhập mật khẩu mới
             errors.password = "Vui lòng nhập mật khẩu mới.";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };


    const handleSave = async () => {
        setError(null); // Reset lỗi chung
        if (!validateForm()) {
            return; // Dừng nếu validation lỗi
        }

        setIsSaving(true);
        try {
            // Chỉ gửi các trường được phép sửa đổi
            const dataToSend = {
                ho_ten: formData.ho_ten,
                email: formData.email,
                sdt: formData.sdt || null, // Gửi null nếu rỗng
                dob: formData.dob || null, // Gửi null nếu rỗng
                hoc_ham_id: formData.hoc_ham_id || null,
                hoc_vi_id: formData.hoc_vi_id || null,
                don_vi_id: formData.don_vi_id || null,
            };
            // Chỉ gửi password nếu người dùng đã nhập và validation đã pass
            if (formData.password) {
                dataToSend.password = formData.password;
                dataToSend.password_confirmation = formData.password_confirmation;
            }
            await onSave(user.id, dataToSend);
            onHide(); // Đóng modal nếu thành công
        } catch (err) {
             // Xử lý lỗi từ backend (ví dụ: lỗi validation từ server)
            const errorMessage = err.response?.data?.message || err.message || "Lỗi không xác định khi cập nhật.";
            setError(errorMessage);
            if (err.response?.data?.errors) {
                // Map lỗi validation từ backend vào state validationErrors
                const backendErrors = {};
                for (const field in err.response.data.errors) {
                    // Đổi tên key lỗi password từ backend nếu cần
                    const frontendField = field === 'password' ? 'password' : field; // Giả sử key lỗi password là 'password'
                    backendErrors[frontendField] = err.response.data.errors[field].join(' ');
                }
                setValidationErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} backdrop="static" size="lg">
            <Modal.Header closeButton> <Modal.Title>Sửa thông tin: {user?.ho_ten}</Modal.Title> </Modal.Header>
            <Modal.Body>
                 {error && <Alert variant="danger">{error}</Alert>}
                <Form noValidate> {/* Thêm noValidate để tắt validation mặc định của trình duyệt */}
                     <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="editHoTen">
                                <Form.Label>Họ Tên <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="ho_ten" value={formData.ho_ten} onChange={handleChange} required isInvalid={!!validationErrors.ho_ten} disabled={isSaving}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.ho_ten}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="editEmail">
                                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required isInvalid={!!validationErrors.email} disabled={isSaving}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.email}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                     <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="editSdt">
                                <Form.Label>Số điện thoại</Form.Label>
                                <Form.Control type="tel" name="sdt" value={formData.sdt} onChange={handleChange} disabled={isSaving}/>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            {/* Thêm trường ngày sinh */}
                            <Form.Group className="mb-3" controlId="editDob">
                                <Form.Label>Ngày sinh</Form.Label>
                                <Form.Control type="date" name="dob" value={formData.dob} onChange={handleChange} disabled={isSaving} isInvalid={!!validationErrors.dob}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.dob}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3" controlId="editHocHam">
                                <Form.Label>Học hàm</Form.Label>
                                <Form.Select name="hoc_ham_id" value={formData.hoc_ham_id} onChange={handleChange} disabled={isLoadingOptions || isSaving}>
                                    <option value="">-- Chọn học hàm --</option>
                                    {options.hocHam.map(hh => <option key={hh.id} value={hh.id}>{hh.ten || hh.ten_hoc_ham}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3" controlId="editHocVi">
                                <Form.Label>Học vị</Form.Label>
                                <Form.Select name="hoc_vi_id" value={formData.hoc_vi_id} onChange={handleChange} disabled={isLoadingOptions || isSaving}>
                                    <option value="">-- Chọn học vị --</option>
                                    {options.hocVi.map(hv => <option key={hv.id} value={hv.id}>{hv.ten || hv.ten_hoc_vi}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3" controlId="editDonVi">
                                <Form.Label>Đơn vị</Form.Label>
                                <Form.Select name="don_vi_id" value={formData.don_vi_id} onChange={handleChange} disabled={isLoadingOptions || isSaving}>
                                    <option value="">-- Chọn đơn vị --</option>
                                    {options.donVi.map(dv => <option key={dv.id} value={dv.id}>{dv.ten}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <hr />
                    <p className="text-muted small">Để trống nếu không muốn đổi mật khẩu.</p>
                     <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="editPassword">
                                <Form.Label>Mật khẩu mới</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                                    isInvalid={!!validationErrors.password}
                                    disabled={isSaving}
                                />
                                 <Form.Control.Feedback type="invalid">{validationErrors.password}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                             <Form.Group className="mb-3" controlId="editPasswordConfirmation">
                                <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password_confirmation"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    placeholder="Nhập lại mật khẩu mới"
                                    isInvalid={!!validationErrors.password_confirmation}
                                    disabled={isSaving || !formData.password /* Vô hiệu hóa nếu chưa nhập mk mới */}
                                />
                                 <Form.Control.Feedback type="invalid">{validationErrors.password_confirmation}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isSaving}>Hủy</Button>
                <Button variant="primary" onClick={handleSave} disabled={isSaving || isLoadingOptions}>
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// --- Component Trang Quản Lý Tài Khoản ---
const ManageAccountsPage = () => {
    const { user: currentUser } = useAuth(); // Lấy thông tin user đang đăng nhập

    // Sử dụng hook pagination
    const {
        data: users, // Đổi tên data thành users cho rõ nghĩa
        loading: isLoadingUsers, // Đổi tên loading từ hook
        error: fetchUsersError, // Đổi tên error từ hook
        currentPage,
        paginationData,
        goToPage, // Hàm để chuyển trang từ hook
        refetch: refetchUsers, // Hàm để tải lại dữ liệu trang hiện tại
        updateFilters, // Hàm để cập nhật bộ lọc
        queryParams // Các tham số lọc hiện tại
    } = usePagination('/api/admin/users'); // Truyền URL

    // Thêm log để kiểm tra giá trị ban đầu của updateFilters
    useEffect(() => {
        console.log('Initial value of updateFilters:', updateFilters);
    }, [updateFilters]);


     // State cho bộ lọc
    const [searchTerm, setSearchTerm] = useState(queryParams?.search || ''); // Sử dụng optional chaining (?.)
    const [selectedDonVi, setSelectedDonVi] = useState(queryParams?.don_vi_id || ''); // Sử dụng optional chaining (?.)
     // State cho các modal và thông báo lỗi/thành công của actions
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
     const [showEditModal, setShowEditModal] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

     // State cho danh sách đơn vị (để lọc)
    const [donViOptions, setDonViOptions] = useState([]);
    const [isLoadingDonVi, setIsLoadingDonVi] = useState(false);

    // Lấy danh sách đơn vị khi component mount
    useEffect(() => {
        setIsLoadingDonVi(true);
        apiClient.get('/api/admin/don-vi')
            .then(response => {
                setDonViOptions(response.data || []);
            })
            .catch(err => {
                console.error("Lỗi tải danh sách đơn vị:", err);
                // Có thể set lỗi ở đây nếu cần
            })
            .finally(() => setIsLoadingDonVi(false));
    }, []);

    // Hàm tạo các mục phân trang cho react-bootstrap Pagination
    const renderPaginationItems = () => {
        if (!paginationData) return null;

        const items = [];
        const { current_page, last_page } = paginationData;

        // Nút về trang đầu (nếu không phải trang 1)
        if (current_page > 1) {
            items.push(<Pagination.First key="first" onClick={() => goToPage(1)} disabled={isLoadingUsers} />);
            items.push(<Pagination.Prev key="prev" onClick={() => goToPage(current_page - 1)} disabled={isLoadingUsers} />);
        }

        // Logic hiển thị các trang cụ thể (có thể làm phức tạp hơn nếu muốn)
        // Ví dụ đơn giản: chỉ hiển thị trang hiện tại
        items.push(
            <Pagination.Item key={current_page} active>
                {current_page}
            </Pagination.Item>
        );

        // Nút tới trang cuối (nếu không phải trang cuối)
        if (current_page < last_page) {
            items.push(<Pagination.Next key="next" onClick={() => goToPage(current_page + 1)} disabled={isLoadingUsers} />);
            items.push(<Pagination.Last key="last" onClick={() => goToPage(last_page)} disabled={isLoadingUsers} />);
        }

        return items;
    };

    // useEffect for debouncing: schedules the call to handleFilterChange
    useEffect(() => {
        // Định nghĩa hàm xử lý bộ lọc bên trong useEffect
        const handleFilterChange = () => {
            // Kiểm tra xem updateFilters đã là một hàm chưa khi timeout chạy
            if (typeof updateFilters === 'function') {
                console.log("Debounce timeout: Calling updateFilters with:", { search: searchTerm.trim(), don_vi_id: selectedDonVi });
                updateFilters({
                    search: searchTerm.trim(),
                    don_vi_id: selectedDonVi
                });
            } else {
                console.error("Debounce timeout: updateFilters is not a function!");
            }
        };
        const timerId = setTimeout(handleFilterChange, 500); // Giảm thời gian debounce xuống 500ms
        return () => clearTimeout(timerId); // Cleanup timer
    }, [searchTerm, selectedDonVi, updateFilters]); // Thêm updateFilters vào dependencies của useEffect này

    // --- Handlers for Modals ---
    const handleAddUserClick = () => {
        console.log("ManageAccountsPage: Opening Add User Modal");
        setShowAddModal(true);
        setActionError(null); // Reset lỗi action
        setActionSuccess(null);
    };

    const handleAddNewUser = async (newUserData) => {
        // Không cần reset lỗi ở đây vì modal sẽ tự xử lý
        console.log("ManageAccountsPage: Attempting to add new user:", newUserData);
        try {
            await fetchCsrfToken(); // Đảm bảo có CSRF token nếu dùng session
            const response = await apiClient.post('/api/admin/users/add', newUserData); // Sử dụng endpoint chuẩn RESTful
            console.log("ManageAccountsPage: Add user response:", response.data);
            if (response.data && response.data.id) {
                setActionSuccess(`Đã thêm người dùng "${response.data.ho_ten}" thành công.`);
                setShowAddModal(false);
                refetchUsers(); // Tải lại trang hiện tại
            } else {
                 throw new Error("Dữ liệu trả về sau khi thêm người dùng không hợp lệ.");
            }
        } catch (err) {
            console.error("ManageAccountsPage: Error adding new user:", err.response?.data || err.message);
            // Ném lỗi để modal hiển thị
            throw err; // Ném lại lỗi gốc để modal xử lý
        }
    };

    const handleEditClick = (user) => {
        console.log("ManageAccountsPage: Opening Edit User Modal for:", user);
        if (!user || !user.id) {
            console.error("Invalid user object passed to handleEditClick:", user);
            setActionError("Không thể sửa, thiếu thông tin người dùng.");
            return;
        }
        setUserToEdit({ ...user }); // Tạo bản sao để tránh sửa trực tiếp state
        setShowEditModal(true);
        setActionError(null);
        setActionSuccess(null);
    };

    const handleUpdateUser = async (userId, updatedUserData) => {
        // Không cần reset lỗi ở đây vì modal sẽ tự xử lý
        console.log(`ManageAccountsPage: Attempting to update user ${userId}:`, updatedUserData);
        try {
            await fetchCsrfToken();
            // Sử dụng PUT hoặc PATCH tùy thuộc vào API backend của bạn
            const response = await apiClient.put(`/api/admin/users/${userId}`, updatedUserData); // Sử dụng endpoint chuẩn RESTful
            console.log("ManageAccountsPage: Update user response:", response.data);
             if (response.data && response.data.id) {
                setActionSuccess(`Đã cập nhật thông tin người dùng thành công.`);
                setShowEditModal(false);
                setUserToEdit(null); // Reset user đang sửa
                refetchUsers(); // Tải lại trang hiện tại

            } else {
                 throw new Error("Dữ liệu trả về sau khi cập nhật không hợp lệ.");
            }
        } catch (err) {
            console.error(`ManageAccountsPage: Error updating user ${userId}:`, err.response?.data || err.message);
            // Ném lỗi để modal hiển thị
            throw err; // Ném lại lỗi gốc để modal xử lý
        }
    };

    const handleManagePermissionsClick = (user) => {
        console.log("ManageAccountsPage: Opening Permissions Modal for:", user);
        if (!user || !user.id) {
            console.error("Invalid user object passed to handleManagePermissionsClick:", user);
            setActionError("Không thể phân quyền, thiếu thông tin người dùng.");
            return;
        }
        // Không cho phép tự phân quyền
        if (currentUser && currentUser.id === user.id) {
            setActionError("Bạn không thể tự phân quyền cho chính mình qua giao diện này.");
            return;
        }
        setSelectedUserForPermissions(user);
        setShowPermissionsModal(true);
        setActionError(null);
        setActionSuccess(null);
    };

    const handleSavePermissions = async (userId, dataToSave) => {
        // Không cần reset lỗi ở đây vì modal sẽ tự xử lý
        console.log(`ManageAccountsPage: Attempting to save permissions for user ${userId}:`, dataToSave);
        try {
            await fetchCsrfToken();
            const response = await apiClient.put(`/api/admin/users/${userId}/sync-permissions`, dataToSave); // Endpoint chuẩn
            console.log("ManageAccountsPage: Save permissions response:", response.data);
            setActionSuccess(response.data?.message || `Đã cập nhật quyền thành công.`);
            setShowPermissionsModal(false);
            setSelectedUserForPermissions(null); // Reset user đang chọn
            refetchUsers(); // Tải lại trang hiện tại để cập nhật trạng thái (nếu cần)

        } catch (err) {
            console.error(`ManageAccountsPage: Error saving permissions for user ${userId}:`, err.response?.data || err.message);
            // Ném lỗi để modal hiển thị
            throw err; // Ném lại lỗi gốc để modal xử lý
        }
    };

    const handleDeleteClick = (user) => {
        console.log("ManageAccountsPage: Opening Delete Confirm Modal for:", user);
        if (!user || !user.id) {
            console.error("Invalid user object passed to handleDeleteClick:", user);
            setActionError("Không thể xóa, thiếu thông tin người dùng.");
            return;
        }
        // Không cho phép tự xóa
        if (currentUser && currentUser.id === user.id) {
            setActionError("Bạn không thể xóa tài khoản của chính mình.");
            return;
        }
        setUserToDelete(user);
        setShowDeleteConfirm(true);
        setActionSuccess(null);
        setActionError(null);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete || !userToDelete.id) return;
        console.log(`ManageAccountsPage: Attempting to delete user ${userToDelete.id}`);
        try {
            await fetchCsrfToken();
            await apiClient.delete(`/api/admin/users/${userToDelete.id}`); // Endpoint chuẩn
            console.log(`ManageAccountsPage: User ${userToDelete.id} deleted successfully.`);
            setActionSuccess(`Đã xóa người dùng ${userToDelete.ho_ten || userToDelete.msvc} thành công.`);
            refetchUsers(); // Tải lại trang hiện tại
        } catch (err) {
            console.error(`ManageAccountsPage: Error deleting user ${userToDelete.id}:`, err.response?.data || err.message);
            setActionError(`Lỗi khi xóa người dùng: ${err.response?.data?.message || err.message}`);
        } finally {
            setShowDeleteConfirm(false);
            setUserToDelete(null);
        }
    };

    // Hàm render tooltip cho các nút action
    const renderTooltip = (props, text) => (
        <Tooltip id={`tooltip-${text.toLowerCase().replace(/\s+/g, '-')}`} {...props}>
            {text}
        </Tooltip>
    );

    // --- JSX Render ---
    return (
        <Container fluid className="manage-accounts-page p-4">
             <Row className="mb-3 align-items-center">
                <Col> <h1 className="h3">Quản lý tài khoản</h1> </Col>
             </Row>

            {/* Hiển thị lỗi hoặc thành công của các action */}
            {actionError && <Alert variant="danger" onClose={() => setActionError(null)} dismissible>{actionError}</Alert>}
            {actionSuccess && <Alert variant="success" onClose={() => setActionSuccess(null)} dismissible>{actionSuccess}</Alert>}

            {/* --- Thanh Tìm kiếm và Lọc --- */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                <FormControl
                                    placeholder="Tìm theo tên, msvc, email..."
                                    aria-label="Tìm kiếm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {/* Nút tìm kiếm thủ công nếu không muốn debounce */}
                                {/* <Button variant="outline-secondary" onClick={handleFilterChange} id="button-search">
                                    <FaSearch />
                                </Button> */}
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <Form.Select
                                aria-label="Lọc theo đơn vị"
                                value={selectedDonVi}
                                onChange={(e) => setSelectedDonVi(e.target.value)}
                                disabled={isLoadingDonVi}
                            >
                                <option value="">-- Tất cả đơn vị --</option>
                                {donViOptions.map(dv => <option key={dv.id} value={dv.id}>{dv.ten}</option>)}
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow mb-4 border-0">
                <Card.Header className="py-3 bg-light text-primary d-flex justify-content-between align-items-center"> {/* Thay đổi bg-primary text-white thành bg-light text-primary */}
                    <div className="d-flex align-items-center">
                        <h6 className="m-0 fw-bold">Danh sách người dùng</h6>
                        {/* Nút Tải lại */}
                        <Button variant="link" size="sm" onClick={() => refetchUsers()} disabled={isLoadingUsers} className="ms-2 p-0" title="Tải lại danh sách">
                            <FaSyncAlt className={isLoadingUsers ? 'fa-spin' : ''} />
                        </Button>
                    </div>
                    {/* Nút thêm tài khoản */}
                    <Button variant="primary" size="sm" onClick={handleAddUserClick}> {/* Thay đổi variant="light" thành variant="primary" */}
                        <FaPlus className="me-1" /> Thêm tài khoản
                    </Button>
                </Card.Header>
                <Card.Body className="p-0">
                    {/* Logic hiển thị bảng hoặc thông báo */}
                    {isLoadingUsers ? (
                        <div className="text-center p-5"><Spinner animation="border" variant="primary" /><p>Đang tải...</p></div>
                    ) : fetchUsersError ? (
                        <Alert variant="warning" className="m-3">
                            Lỗi tải danh sách người dùng: {fetchUsersError.message || 'Không thể kết nối tới máy chủ'}
                        </Alert>
                    ) : users.length === 0 ? (
                        <Alert variant="info" className="m-3">Không tìm thấy người dùng nào khớp.</Alert> // Thông báo khi không có kết quả
                    ) : (
                        // Hiển thị bảng khi có dữ liệu
                        <Table striped bordered hover responsive="sm" className="shadow-sm align-middle mb-0">
                            <thead>
                                <tr>{/* Sửa lỗi hydration: Xóa khoảng trắng/dòng mới */}
                                    <th className="ps-3" style={{ width: '5%' }}>#</th>
                                    <th style={{ width: '10%' }}>MSVC</th>
                                    <th style={{ width: '20%' }}>Họ Tên</th>
                                    <th style={{ width: '15%' }}>Số điện thoại</th> {/* Thêm cột SĐT */}
                                    <th style={{ width: '15%' }}>Đơn vị</th>
                                    <th style={{ width: '20%' }}>Email</th>
                                    <th style={{ width: '7%' }} className="text-center">Trạng thái</th>
                                    <th style={{ width: '15%' }} className="text-center pe-3">Hành động</th>{/* Sửa lỗi hydration: Xóa khoảng trắng/dòng mới */}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    user && user.id ? (
                                        <tr key={user.id}>
                                            {/* Tính index dựa trên trang hiện tại và số item/trang */}
                                            <td className="ps-3">{paginationData ? (paginationData.from + index) : index + 1}</td>
                                            <td>{user.msvc || 'N/A'}</td>
                                            <td>{user.ho_ten || 'N/A'}</td>
                                            <td>{user.sdt || '-'}</td>           {/* Hiển thị SĐT */}
                                            <td>{user.don_vi?.ten || '-'}</td>       {/* Hiển thị tên đơn vị */}
                                            <td>{user.email || 'N/A'}</td>
                                            <td className="text-center">
                                                {user.is_superadmin ? ( <Badge bg="danger" pill>Super Admin</Badge> ) : ( <Badge bg="success" pill>Giảng viên</Badge> )}
                                            </td>
                                            <td className="text-center pe-3">
                                                <ButtonGroup size="sm">
                                                    {/* Nút Sửa */}
                                                    <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Sửa thông tin')}>
                                                        <Button variant="link" className="text-info p-1" onClick={() => handleEditClick(user)}> <FaEdit size={16}/> </Button>
                                                    </OverlayTrigger>
                                                    {/* Nút Phân Quyền */}
                                                    <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Phân quyền')}>
                                                        {/* Dùng span để tooltip hoạt động khi button bị disabled */}
                                                        <span className={currentUser && currentUser.id === user.id ? 'd-inline-block' : ''} tabIndex={0}>
                                                            <Button
                                                                variant="link"
                                                                className="text-primary p-1"
                                                                onClick={() => handleManagePermissionsClick(user)}
                                                                disabled={currentUser && currentUser.id === user.id} // Vô hiệu hóa nếu là user hiện tại
                                                                style={currentUser && currentUser.id === user.id ? { pointerEvents: 'none' } : {}} // Ngăn click khi disabled
                                                            >
                                                                <FaUserShield size={16}/>
                                                            </Button>
                                                        </span>
                                                    </OverlayTrigger>
                                                    {/* Nút Xóa */}
                                                    <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Xóa người dùng')}>
                                                         {/* Dùng span để tooltip hoạt động khi button bị disabled */}
                                                         <span className={currentUser && currentUser.id === user.id ? 'd-inline-block' : ''} tabIndex={0}>
                                                            <Button
                                                                variant="link"
                                                                className="text-danger p-1"
                                                                onClick={() => handleDeleteClick(user)}
                                                                disabled={currentUser && currentUser.id === user.id} // Vô hiệu hóa nếu là user hiện tại
                                                                style={currentUser && currentUser.id === user.id ? { pointerEvents: 'none' } : {}} // Ngăn click khi disabled
                                                            >
                                                                <FaTrash size={16}/>
                                                            </Button>
                                                        </span>
                                                    </OverlayTrigger>
                                                </ButtonGroup>
                                            </td>
                                        </tr>
                                    ) : (
                                        // Render một thông báo lỗi hoặc null nếu user không hợp lệ
                                        <tr key={`invalid-user-${index}`}><td colSpan={8} className="text-danger text-center small p-2">Lỗi: Dữ liệu người dùng không hợp lệ ở hàng {index + 1}</td></tr>
                                    )
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {/* Hiển thị phân trang */}
                    {!isLoadingUsers && !fetchUsersError && paginationData && paginationData.last_page > 1 && (
                        <div className="d-flex justify-content-center mt-4 mb-3">
                            <Pagination>{renderPaginationItems()}</Pagination>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* --- Render các Modals --- */}

            {/* Modal Xác nhận Xóa */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
                 <Modal.Header closeButton> <Modal.Title>Xác nhận Xóa</Modal.Title> </Modal.Header>
                 <Modal.Body>Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.ho_ten || userToDelete?.msvc}</strong>? Hành động này không thể hoàn tác.</Modal.Body>
                 <Modal.Footer> <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Hủy bỏ</Button> <Button variant="danger" onClick={confirmDeleteUser}>Xác nhận Xóa</Button> </Modal.Footer>
            </Modal>

            {/* Modal Phân Quyền */}
            {selectedUserForPermissions && (
                <PermissionsModal
                    show={showPermissionsModal}
                    onHide={() => { setShowPermissionsModal(false); setSelectedUserForPermissions(null); }} // Reset user khi đóng
                    user={selectedUserForPermissions}
                    onSave={handleSavePermissions} // Truyền hàm xử lý lưu từ trang cha
                />
            )}

            {/* Modal Sửa Thông Tin */}
            {userToEdit && (
                <EditUserModal
                    show={showEditModal}
                    onHide={() => { setShowEditModal(false); setUserToEdit(null); }} // Reset user khi đóng
                    user={userToEdit}
                    onSave={handleUpdateUser} // Truyền hàm xử lý lưu từ trang cha
                />
            )}

            {/* Modal Thêm Mới */}
            <AddUserModal
                show={showAddModal}
                onHide={() => setShowAddModal(false)}
                onSave={handleAddNewUser} // Truyền hàm xử lý lưu từ trang cha
            />

        </Container>
    );
};

export default ManageAccountsPage;
