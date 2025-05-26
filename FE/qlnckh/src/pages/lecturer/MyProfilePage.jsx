import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Spinner, Alert, FormSelect } from 'react-bootstrap';
import { fetchCsrfToken } from '../../api/axiosConfig'; // Chỉ import fetchCsrfToken nếu cần trực tiếp
import { useAuth } from '../../hooks/useAuth';
import {
    updateMyProfile, getHocHamOptions, getHocViOptions, getDonViOptions
} from '../../api/lecturerApi'; // Import các hàm API cần thiết

const MyProfilePage = () => {
    const authData = useAuth();
    // QUAN TRỌNG: Kiểm tra console log để xác định tên hàm cập nhật user chính xác từ useAuth()
    // console.log('Auth Data from useAuth:', authData);
    // Giả sử hàm cập nhật user tên là 'updateUser'. Thay thế nếu tên khác.
    const { user: currentUser, updateUser } = authData;

    const [formData, setFormData] = useState({
        ho_ten: '',
        email: '',
        sdt: '',
        dob: '',
        password: '',
        password_confirmation: '',
        hoc_ham_id: '',
        hoc_vi_id: '',
    });
    const [options, setOptions] = useState({ hocHam: [], hocVi: [], donVi: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        const loadUserData = () => {
            if (currentUser && currentUser.id) {
                setFormData({
                    ho_ten: currentUser.ho_ten || '',
                    email: currentUser.email || '',
                    sdt: currentUser.sdt || '',
                    dob: currentUser.dob ? new Date(currentUser.dob).toISOString().split('T')[0] : '',
                    hoc_ham_id: currentUser.hoc_ham_id || currentUser.hoc_ham?.id || '',
                    hoc_vi_id: currentUser.hoc_vi_id || currentUser.hoc_vi?.id || '',
                    password: '',
                    password_confirmation: ''
                });
            }
        };

        const loadOptions = async () => {
            setIsLoadingOptions(true);
            try {
                const [hocHamRes, hocViRes, donViRes] = await Promise.all([
                    getHocHamOptions(),
                    getHocViOptions(),
                    getDonViOptions()
                ]);
                setOptions({
                    hocHam: hocHamRes.data || [],
                    hocVi: hocViRes.data || [],
                    donVi: donViRes.data || []
                });
            } catch (err) {
                console.error("Error loading options for profile:", err);
                setError("Không thể tải dữ liệu học hàm/học vị/đơn vị.");
                setSuccess(null); // Xóa thông báo thành công nếu tải options thất bại
            } finally {
                setIsLoadingOptions(false);
            }
        };

        loadUserData();
        loadOptions();
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
        setSuccess(null); setError(null);
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.ho_ten.trim()) errors.ho_ten = "Họ tên không được để trống.";
        if (!formData.email.trim()) errors.email = "Email không được để trống.";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email không hợp lệ.";

        if (formData.password) {
            if (formData.password.length < 8) errors.password = "Mật khẩu mới phải có ít nhất 8 ký tự.";
            if (formData.password !== formData.password_confirmation) errors.password_confirmation = "Xác nhận mật khẩu mới không khớp.";
        } else if (formData.password_confirmation && !formData.password) {
             errors.password = "Vui lòng nhập mật khẩu mới nếu muốn thay đổi.";
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); setSuccess(null);
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await fetchCsrfToken();
            const dataToSend = {
                ho_ten: formData.ho_ten,
                email: formData.email,
                sdt: formData.sdt || null,
                dob: formData.dob || null,
                hoc_ham_id: formData.hoc_ham_id || null,
                hoc_vi_id: formData.hoc_vi_id || null,
            };
            if (formData.password) {
                dataToSend.password = formData.password;
                dataToSend.password_confirmation = formData.password_confirmation;
            }

            const response = await updateMyProfile(dataToSend);
            setSuccess(response.data?.message || "Cập nhật thông tin thành công!");
            if (response.data?.user) {
                // Kiểm tra xem hàm updateUser có tồn tại và là một hàm không trước khi gọi
                if (typeof updateUser === 'function') {
                    updateUser(response.data.user); // Sử dụng tên hàm đúng để cập nhật context
                } else {
                    console.warn("Hàm updateUser (hoặc tên hàm đúng) không được định nghĩa trong useAuth. Không thể cập nhật context.");
                }
            }
            setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
        } catch (err) {
            let errorMessage = "Lỗi cập nhật thông tin.";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = `Đã xảy ra lỗi: ${err.message}`;
            }
            setError(errorMessage);
            if (err.response?.data?.errors) {
                setValidationErrors(prevErrors => ({ ...prevErrors, ...err.response.data.errors }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) {
        return <Container className="mt-5"><Alert variant="warning">Vui lòng đăng nhập để xem thông tin cá nhân.</Alert></Container>;
    }

    if ((isLoadingOptions || isLoading) && !formData.ho_ten && (!options.hocHam || !options.hocHam.length)) {
        return <Container className="p-4 text-center"><Spinner animation="border" variant="primary" /><p className="mt-2">Đang tải dữ liệu...</p></Container>;
    }

    return (
        <Container fluid className="my-profile-page p-4 bg-light">
            <h2 className="h3 mb-4 text-gray-800">Thông tin cá nhân</h2>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

            <Form onSubmit={handleSubmit} noValidate className="bg-white p-4 p-md-5 rounded shadow-sm">
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="profileHoTen">
                            <Form.Label>Họ Tên <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="text" name="ho_ten" value={formData.ho_ten} onChange={handleChange} required isInvalid={!!validationErrors.ho_ten} disabled={isLoading}/>
                            <Form.Control.Feedback type="invalid">{validationErrors.ho_ten}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="profileMsvc">
                            <Form.Label>MSVC</Form.Label>
                            <Form.Control type="text" value={currentUser.msvc || ''} readOnly disabled />
                            <Form.Text muted>Không thể thay đổi MSVC.</Form.Text>
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="profileEmail">
                            <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required isInvalid={!!validationErrors.email} disabled={isLoading}/>
                            <Form.Control.Feedback type="invalid">{validationErrors.email}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="profileSdt">
                            <Form.Label>Số điện thoại</Form.Label>
                            <Form.Control type="tel" name="sdt" value={formData.sdt || ''} onChange={handleChange} disabled={isLoading}/>
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="profileDob">
                            <Form.Label>Ngày sinh</Form.Label>
                            <Form.Control type="date" name="dob" value={formData.dob} onChange={handleChange} disabled={isLoading} isInvalid={!!validationErrors.dob}/>
                            <Form.Control.Feedback type="invalid">{validationErrors.dob}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="profileDonVi">
                            <Form.Label>Đơn vị</Form.Label>
                            <Form.Control
                                type="text"
                                value={
                                    currentUser.don_vi?.ten ||
                                    (options.donVi.find(dv => dv.id === currentUser.don_vi_id)?.ten || 'Chưa có thông tin')
                                }
                                readOnly
                                disabled
                            />
                            <Form.Text muted>Liên hệ quản trị viên để thay đổi.</Form.Text>
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="profileHocHam">
                            <Form.Label>Học hàm</Form.Label>
                            <FormSelect name="hoc_ham_id" value={formData.hoc_ham_id} onChange={handleChange} disabled={isLoadingOptions || isLoading}>
                                <option value="">-- Chọn học hàm --</option>
                                {options.hocHam.map(hh => <option key={hh.id} value={hh.id}>{hh.ten || hh.ten_hoc_ham}</option>)}
                            </FormSelect>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="profileHocVi">
                            <Form.Label>Học vị</Form.Label>
                            <FormSelect name="hoc_vi_id" value={formData.hoc_vi_id} onChange={handleChange} disabled={isLoadingOptions || isLoading}>
                                <option value="">-- Chọn học vị --</option>
                                {options.hocVi.map(hv => <option key={hv.id} value={hv.id}>{hv.ten || hv.ten_hoc_vi}</option>)}
                            </FormSelect>
                        </Form.Group>
                    </Col>
                </Row>
                <hr className="my-4"/>
                <h5 className="mb-3">Thay đổi mật khẩu</h5>
                <p className="text-muted small">Để trống các trường mật khẩu nếu bạn không muốn thay đổi.</p>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="profilePassword">
                            <Form.Label>Mật khẩu mới</Form.Label>
                            <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Ít nhất 8 ký tự" isInvalid={!!validationErrors.password} disabled={isLoading}/>
                            <Form.Control.Feedback type="invalid">{validationErrors.password}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="profilePasswordConfirmation">
                            <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                            <Form.Control type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} placeholder="Nhập lại mật khẩu mới" isInvalid={!!validationErrors.password_confirmation} disabled={isLoading || !formData.password}/>
                            <Form.Control.Feedback type="invalid">{validationErrors.password_confirmation}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>
                <div className="mt-4 d-flex justify-content-end">
                    <Button variant="primary" type="submit" disabled={isLoading || isLoadingOptions} size="lg">
                        {isLoading ? <><Spinner as="span" animation="border" size="sm" className="me-2"/> Đang lưu...</> : 'Lưu thay đổi'}
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default MyProfilePage;
