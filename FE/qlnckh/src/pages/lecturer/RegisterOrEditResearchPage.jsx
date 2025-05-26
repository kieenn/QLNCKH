import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Form, Button, Row, Col, Spinner, Alert, InputGroup, FormSelect, Table, FormControl
} from 'react-bootstrap';
import { FaTrash, FaSearch } from 'react-icons/fa';
import { fetchCsrfToken } from '../../api/axiosConfig'; // Chỉ import fetchCsrfToken
import { useAuth } from '../../hooks/useAuth';
import {
    getAllLinhVuc, getAllCapNhiemVu,
    getResearchDetailsForEdit, createResearchProposal, updateResearchProposal, getDonViOptions, // Thêm getDonViOptions
    getVaiTroThanhVienList, findLecturerByMSVC
} from '../../api/lecturerApi';

const RegisterOrEditResearchPage = () => {
    const { user: currentUser } = useAuth();
    const { maDeTaiForEdit } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!maDeTaiForEdit;

    const initialFormData = {
        ten_de_tai: '',
        ma_de_tai_custom: '',
        linh_vuc_id: '',
        cap_nhiem_vu_id: '',
        thoi_gian_bat_dau_du_kien: '',
        thoi_gian_ket_thuc_du_kien: '',
        muc_tieu_nghien_cuu: '',
        noi_dung_phuong_phap: '',
        san_pham_du_kien: '',
        tong_kinh_phi_du_tru: '', // Sẽ được cập nhật tự động, dùng để hiển thị dự trù
        tong_kinh_phi_de_xuat: '', // Người dùng nhập
        ghi_chu_de_xuat: '',
        thanh_vien_tham_gia: [],
        loai_hinh_nghien_cuu: '',
        thoi_gian_thuc_hien: '',
        tong_quan_van_de: '',
        tinh_cap_thiet: '',
        doi_tuong: '',
        pham_vi: '',
        chu_quan_id: '', // Thêm đơn vị chủ quản
        chu_tri_id: '',  // Thêm đơn vị chủ trì
    };
    const [formData, setFormData] = useState(initialFormData);
    const [options, setOptions] = useState({ linhVuc: [], capNhiemVu: [], vaiTroThanhVien: [], donVi: [] }); // Thêm donVi
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const [msvcToAdd, setMsvcToAdd] = useState('');
    const [isFindingMember, setIsFindingMember] = useState(false);
    const [findMemberError, setFindMemberError] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingOptions(true); setIsLoading(true);
            try {
                const [lvRes, cnvRes, vtRes, dvRes] = await Promise.all([ // Thêm dvRes
                    getAllLinhVuc(),
                    getAllCapNhiemVu(),
                    getVaiTroThanhVienList(),
                    getDonViOptions() // Gọi API lấy danh sách đơn vị
                ]);
                setOptions(prev => ({
                    ...prev,
                    linhVuc: lvRes.data || [],
                    capNhiemVu: cnvRes.data || [], // API này cần trả về du_tru_kinh_phi
                    vaiTroThanhVien: vtRes.data || [],
                    donVi: dvRes.data || [] // Lưu danh sách đơn vị
                }));

                if (isEditMode) {
                    if (!currentUser?.id) {
                        // Nếu ở chế độ sửa mà currentUser chưa có, đợi useEffect chạy lại khi currentUser được cập nhật.
                        // setIsLoading(true) đã được gọi ở trên.
                        return;
                    }
                    const researchDetails = await getResearchDetailsForEdit(maDeTaiForEdit);
                    const data = researchDetails.data;
                    setFormData({
                        ten_de_tai: data.ten_de_tai || '',
                        ma_de_tai_custom: data.ma_de_tai_custom || '',
                        linh_vuc_id: data.linh_vuc_id || data.linh_vuc_nghien_cuu?.id || '',
                        cap_nhiem_vu_id: data.cnv_id || data.cap_nhiem_vu?.id || '', // Sử dụng cnv_id nếu có, hoặc data.cap_nhiem_vu.id
                        thoi_gian_bat_dau_du_kien: data.ngay_bat_dau_dukien ? new Date(data.ngay_bat_dau_dukien).toISOString().split('T')[0] : '',
                        thoi_gian_ket_thuc_du_kien: data.ngay_ket_thuc_dukien ? new Date(data.ngay_ket_thuc_dukien).toISOString().split('T')[0] : '',
                        muc_tieu_nghien_cuu: data.muc_tieu_nghien_cuu || '',
                        noi_dung_phuong_phap: data.noi_dung_phuong_phap || '',
                        san_pham_du_kien: data.san_pham_du_kien || '',
                        // Khi sửa, tong_kinh_phi_du_tru sẽ được tính lại dựa trên cap_nhiem_vu_id đã chọn
                        tong_kinh_phi_du_tru: '', // Sẽ được tính lại khi cap_nhiem_vu_id được set
                        tong_kinh_phi_de_xuat: data.tong_kinh_phi || '', // Giả sử tong_kinh_phi từ API là kinh phí đã được duyệt/đề xuất trước đó
                        ghi_chu_de_xuat: data.ghi_chu || '',
                        loai_hinh_nghien_cuu: data.loai_hinh_nghien_cuu || '',
                        thoi_gian_thuc_hien: data.thoi_gian_thuc_hien || '',
                        tong_quan_van_de: data.tong_quan_van_de || '',
                        tinh_cap_thiet: data.tinh_cap_thiet || '',
                        doi_tuong: data.doi_tuong || '',
                        pham_vi: data.pham_vi || '',
                        chu_quan_id: data.chu_quan_id || data.don_vi_chu_quan?.id || '', // Giả sử backend trả về don_vi_chu_quan object
                        chu_tri_id: data.chu_tri_id || data.don_vi_chu_tri?.id || '',   // Giả sử backend trả về don_vi_chu_tri object
                        thanh_vien_tham_gia: data.giang_vien_tham_gia
                            ?.filter(gv => gv.msvc !== currentUser.msvc) // Lọc bỏ chủ nhiệm (người dùng hiện tại)
                            .map(gv => ({
                                giang_vien_id: gv.msvc, // Sử dụng msvc làm giang_vien_id để nhất quán với logic thêm thành viên
                                ho_ten: gv.ho_ten,
                                msvc: gv.msvc,
                                vai_tro_id: gv.pivot?.vai_tro_id || '',
                                can_edit: gv.pivot?.can_edit || false,
                                // is_chu_nhiem sẽ luôn là false cho các thành viên còn lại
                            })) || [],
                    });

                    // Sau khi setFormData, nếu có cap_nhiem_vu_id, tính lại tong_kinh_phi_du_tru
                    if (data.cnv_id || data.cap_nhiem_vu?.id) {
                        const capId = data.cnv_id || data.cap_nhiem_vu?.id;
                        const selectedCap = (cnvRes.data || []).find(cnv => cnv.id === parseInt(capId, 10));
                        if (selectedCap && selectedCap.hasOwnProperty('kinh_phi')) { // Đổi 'du_tru_kinh_phi' thành 'kinh_phi'
                            setFormData(prev => ({ ...prev, tong_kinh_phi_du_tru: selectedCap.kinh_phi.toString() }));
                        }
                    }
                    
                } else {
                    setFormData(initialFormData);
                }
            } catch (err) {
                console.error("Error loading data for research form:", err);
                setError(err.response?.data?.message || "Không thể tải dữ liệu ban đầu cho form.");
            } finally {
                setIsLoadingOptions(false);
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [isEditMode, maDeTaiForEdit, currentUser]); // Thêm currentUser vào dependencies

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }

        // Nếu thay đổi Cấp nhiệm vụ, cập nhật Tổng kinh phí dự kiến
        if (name === 'cap_nhiem_vu_id' && value) {
            const selectedCapNhiemVu = options.capNhiemVu.find(cnv => cnv.id === parseInt(value, 10));
            if (selectedCapNhiemVu && selectedCapNhiemVu.hasOwnProperty('kinh_phi')) { // Đổi 'du_tru_kinh_phi' thành 'kinh_phi'
                setFormData(prev => ({ ...prev, tong_kinh_phi_du_tru: selectedCapNhiemVu.kinh_phi.toString() }));
            } else {
                setFormData(prev => ({ ...prev, tong_kinh_phi_du_tru: '' })); // Reset nếu không có
            }
        }
        setSuccess(null); setError(null);
    };

    const handleFindAndAddMember = async () => {
        if (!msvcToAdd.trim()) {
            setFindMemberError("Vui lòng nhập MSVC.");
            return;
        }
        if (msvcToAdd.trim().toLowerCase() === currentUser.msvc.toLowerCase()) {
            setFindMemberError("Không thể thêm chính mình làm thành viên (bạn đã là chủ nhiệm).");
            return;
        }
        if (formData.thanh_vien_tham_gia.some(m =>
            m.msvc && typeof m.msvc === 'string' && m.msvc.toLowerCase() === msvcToAdd.trim().toLowerCase()
        )) {
            setFindMemberError("Giảng viên này đã có trong danh sách.");
            return;
        }

        setIsFindingMember(true);
        setFindMemberError(null);
        try {
            const response = await findLecturerByMSVC(msvcToAdd.trim());
            let lecturer = null;
            if (Array.isArray(response.data) && response.data.length > 0) {
                lecturer = response.data[0];
            } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                lecturer = response.data;
            }

            if (lecturer && lecturer.msvc && lecturer.ho_ten) {
                const defaultVaiTro = options.vaiTroThanhVien.find(vt => vt.ten_vai_tro?.toLowerCase().includes('thành viên'));
                setFormData(prev => ({
                    ...prev,
                    thanh_vien_tham_gia: [
                        ...prev.thanh_vien_tham_gia,
                        {
                            giang_vien_id: lecturer.msvc,
                            ho_ten: lecturer.ho_ten,
                            msvc: lecturer.msvc,
                            vai_tro_id: defaultVaiTro?.id || '',
                            can_edit: false,
                            is_chu_nhiem: false
                        }
                    ]
                }));
                setMsvcToAdd('');
            } else {
                setFindMemberError("Không tìm thấy giảng viên với MSVC này hoặc dữ liệu trả về không hợp lệ.");
            }
        } catch (err) {
            setFindMemberError(err.response?.data?.message || "Lỗi khi tìm giảng viên. Vui lòng thử lại.");
        } finally {
            setIsFindingMember(false);
        }
    };

    const removeMember = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            thanh_vien_tham_gia: prev.thanh_vien_tham_gia.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.ten_de_tai.trim()) errors.ten_de_tai = "Tên đề tài không được trống.";
        if (!formData.linh_vuc_id) errors.linh_vuc_id = "Vui lòng chọn lĩnh vực nghiên cứu.";
        if (!formData.cap_nhiem_vu_id) errors.cap_nhiem_vu_id = "Vui lòng chọn cấp nhiệm vụ.";
        if (!formData.thoi_gian_bat_dau_du_kien) errors.thoi_gian_bat_dau_du_kien = "Vui lòng chọn ngày bắt đầu dự kiến.";
        if (!formData.thoi_gian_ket_thuc_du_kien) errors.thoi_gian_ket_thuc_du_kien = "Vui lòng chọn ngày kết thúc dự kiến.";
        else if (formData.thoi_gian_bat_dau_du_kien && new Date(formData.thoi_gian_ket_thuc_du_kien) <= new Date(formData.thoi_gian_bat_dau_du_kien)) {
            errors.thoi_gian_ket_thuc_du_kien = "Ngày kết thúc dự kiến phải sau ngày bắt đầu dự kiến.";
        }
        if (!formData.chu_tri_id) errors.chu_tri_id = "Vui lòng chọn đơn vị chủ trì."; // Ví dụ: Đơn vị chủ trì là bắt buộc
        
        if (!formData.muc_tieu_nghien_cuu.trim()) errors.muc_tieu_nghien_cuu = "Mục tiêu nghiên cứu không được trống.";        
        if (formData.tong_kinh_phi_de_xuat && (isNaN(parseFloat(formData.tong_kinh_phi_de_xuat)) || parseFloat(formData.tong_kinh_phi_de_xuat) < 0)) {
            errors.tong_kinh_phi_de_xuat = "Tổng kinh phí đề xuất phải là một số không âm.";
        }
        if (formData.thoi_gian_thuc_hien && (isNaN(parseInt(formData.thoi_gian_thuc_hien, 10)) || parseInt(formData.thoi_gian_thuc_hien, 10) <= 0)) {
            errors.thoi_gian_thuc_hien = "Thời gian thực hiện dự kiến phải là số nguyên dương (tính bằng tháng).";
        }
        if (formData.thanh_vien_tham_gia.some(tv => {
            const vaiTroObj = options.vaiTroThanhVien.find(vt => vt.id === parseInt(tv.vai_tro_id, 10));
            return vaiTroObj?.ten_vai_tro?.toLowerCase().includes('chủ nhiệm');
        })) {
            errors.thanh_vien_tham_gia = "Chỉ có thể có một chủ nhiệm đề tài (là bạn). Các thành viên khác không thể có vai trò chủ nhiệm.";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); setSuccess(null);
        if (!validateForm()) {
            return;
        }
        setIsLoading(true);
        try {
            await fetchCsrfToken();
            const payload = {
                ...formData,
                thanh_vien_tham_gia: formData.thanh_vien_tham_gia.map(tv => ({
                    giang_vien_id: tv.giang_vien_id,
                    vai_tro_id: tv.vai_tro_id ? parseInt(tv.vai_tro_id, 10) : null,
                    can_edit: tv.can_edit
                })),
                // Gửi giá trị tong_kinh_phi_de_xuat mà người dùng nhập
                tong_kinh_phi: formData.tong_kinh_phi_de_xuat ? parseFloat(formData.tong_kinh_phi_de_xuat) : null,
                thoi_gian_thuc_hien: formData.thoi_gian_thuc_hien ? parseInt(formData.thoi_gian_thuc_hien, 10) : null,
                chu_quan_id: formData.chu_quan_id ? parseInt(formData.chu_quan_id, 10) : null,
                chu_tri_id: formData.chu_tri_id ? parseInt(formData.chu_tri_id, 10) : null,
            };
            const response = isEditMode
                ? await updateResearchProposal(maDeTaiForEdit, payload)
                : await createResearchProposal(payload);
            setSuccess(response.data?.message || (isEditMode ? "Cập nhật đề tài thành công!" : "Đăng ký đề tài thành công! Chờ duyệt."));
            setTimeout(() => navigate('/lecturer/'), 2000);
        } catch (err) {
            const msg = err.response?.data?.message || (isEditMode ? "Lỗi khi cập nhật đề tài." : "Lỗi khi đăng ký đề tài.");
            setError(msg);
            if (err.response?.data?.errors) {
                setValidationErrors(prev => ({ ...prev, ...err.response.data.errors }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    if ((isLoading && isEditMode && !formData.ten_de_tai) || (isLoadingOptions && !isEditMode && !options.linhVuc.length)) {
        return <Container className="p-4 text-center"><Spinner animation="border" variant="primary" /><p className="mt-2">Đang tải dữ liệu...</p></Container>;
    }

    return (
        <Container fluid className="register-research-page p-4 bg-light">
            <h2 className="h3 mb-4 text-gray-800">{isEditMode ? 'Chỉnh sửa Đề tài Nghiên cứu' : 'Đăng ký Đề tài Nghiên cứu mới'}</h2>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

            <Form onSubmit={handleSubmit} noValidate className="bg-white p-4 p-md-5 rounded shadow-sm">
                <h5 className="text-primary mb-4">I. Thông tin chung về đề tài</h5>
                <Row>
                    <Col md={8}>
                        <Form.Group className="mb-3" controlId="tenDeTai">
                            <Form.Label>Tên đề tài <span className="text-danger">*</span></Form.Label>
                            <Form.Control as="textarea" rows={2} name="ten_de_tai" value={formData.ten_de_tai} onChange={handleChange} required isInvalid={!!validationErrors.ten_de_tai} disabled={isLoading}/>
                            <Form.Control.Feedback type="invalid">{validationErrors.ten_de_tai}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3" controlId="maDeTaiCustom">
                            <Form.Label>Mã đề tài (cán bộ quản lý)</Form.Label>
                            <Form.Control type="text" name="ma_de_tai_custom" value={formData.ma_de_tai_custom} onChange={handleChange} disabled/> {/*={isEditMode || isLoading} */}
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="linhVuc">
                            <Form.Label>Lĩnh vực <span className="text-danger">*</span></Form.Label>
                            <FormSelect name="linh_vuc_id" value={formData.linh_vuc_id} onChange={handleChange} required isInvalid={!!validationErrors.linh_vuc_id} disabled={isLoadingOptions || isLoading}>
                                <option value="">-- Chọn lĩnh vực --</option>
                                {options.linhVuc.map(lv => <option key={lv.id} value={lv.id}>{lv.ten}</option>)}
                            </FormSelect>
                            <Form.Control.Feedback type="invalid">{validationErrors.linh_vuc_id}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="capNhiemVu">
                            <Form.Label>Cấp nhiệm vụ <span className="text-danger">*</span></Form.Label>
                            <FormSelect name="cap_nhiem_vu_id" value={formData.cap_nhiem_vu_id} onChange={handleChange} required isInvalid={!!validationErrors.cap_nhiem_vu_id} disabled={isLoadingOptions || isLoading}>
                                <option value="">-- Chọn cấp nhiệm vụ --</option>
                                {options.capNhiemVu.map(cnv => <option key={cnv.id} value={cnv.id}>{cnv.ten}</option>)}
                            </FormSelect>
                            <Form.Control.Feedback type="invalid">{validationErrors.cap_nhiem_vu_id}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="donViChuQuan">
                            <Form.Label>Đơn vị chủ quản</Form.Label>
                            <FormSelect name="chu_quan_id" value={formData.chu_quan_id} onChange={handleChange} isInvalid={!!validationErrors.chu_quan_id} disabled={isLoadingOptions || isLoading}>
                                <option value="">-- Chọn đơn vị chủ quản --</option>
                                {options.donVi.map(dv => <option key={dv.id} value={dv.id}>{dv.ten}</option>)} {/* Giả sử trường tên là ten_don_vi */}
                            </FormSelect>
                            <Form.Control.Feedback type="invalid">{validationErrors.chu_quan_id}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="donViChuTri">
                            <Form.Label>Đơn vị chủ trì <span className="text-danger">*</span></Form.Label>
                            <FormSelect name="chu_tri_id" value={formData.chu_tri_id} onChange={handleChange} required isInvalid={!!validationErrors.chu_tri_id} disabled={isLoadingOptions || isLoading}>
                                <option value="">-- Chọn đơn vị chủ trì --</option>
                                {options.donVi.map(dv => <option key={dv.id} value={dv.id}>{dv.ten}</option>)} {/* Giả sử trường tên là ten_don_vi */}
                            </FormSelect>
                            <Form.Control.Feedback type="invalid">{validationErrors.chu_tri_id}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>


                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3" controlId="loaiHinhNghienCuu">
                            <Form.Label>Loại hình nghiên cứu</Form.Label>
                            <FormSelect name="loai_hinh_nghien_cuu" value={formData.loai_hinh_nghien_cuu} onChange={handleChange} disabled={isLoading}>
                                <option value="">-- Chọn loại hình --</option>
                                <option value="Cơ bản">Cơ bản</option>
                                <option value="Ứng dụng">Ứng dụng</option>
                                <option value="Triển khai">Triển khai</option>
                            </FormSelect>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3" controlId="thoiGianThucHien">
                            <Form.Label>Thời gian thực hiện (tháng)</Form.Label>
                            <Form.Control type="number" name="thoi_gian_thuc_hien" value={formData.thoi_gian_thuc_hien} onChange={handleChange} disabled={isLoading} isInvalid={!!validationErrors.thoi_gian_thuc_hien} placeholder="VD: 12"/>
                            <Form.Control.Feedback type="invalid">{validationErrors.thoi_gian_thuc_hien}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3" controlId="tongKinhPhiDuTru">
                            <Form.Label>Dự trù kinh phí (VNĐ)</Form.Label>
                            <Form.Control
                                type="text"
                                name="tong_kinh_phi_du_tru"
                                value={formData.tong_kinh_phi_du_tru ? Number(formData.tong_kinh_phi_du_tru).toLocaleString('vi-VN') : ''}
                                readOnly
                                disabled
                                placeholder="Tự động theo cấp nhiệm vụ"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3" controlId="tongKinhPhiDeXuat">
                            <Form.Label>Tổng kinh phí đề xuất (VNĐ)</Form.Label>
                            <Form.Control 
                                type="number" name="tong_kinh_phi_de_xuat" value={formData.tong_kinh_phi_de_xuat} onChange={handleChange} 
                                placeholder="Nhập số tiền" isInvalid={!!validationErrors.tong_kinh_phi_de_xuat} disabled={isLoading}/>
                            <Form.Control.Feedback type="invalid">{validationErrors.tong_kinh_phi_de_xuat}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="thoiGianBatDau">
                            <Form.Label>Ngày BĐ dự kiến <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="date" name="thoi_gian_bat_dau_du_kien" value={formData.thoi_gian_bat_dau_du_kien} onChange={handleChange} required isInvalid={!!validationErrors.thoi_gian_bat_dau_du_kien} disabled={isLoading}/>
                            <Form.Control.Feedback type="invalid">{validationErrors.thoi_gian_bat_dau_du_kien}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="thoiGianKetThuc">
                            <Form.Label>Ngày KT dự kiến <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="date" name="thoi_gian_ket_thuc_du_kien" value={formData.thoi_gian_ket_thuc_du_kien} onChange={handleChange} required isInvalid={!!validationErrors.thoi_gian_ket_thuc_du_kien} disabled={isLoading}/>
                            <Form.Control.Feedback type="invalid">{validationErrors.thoi_gian_ket_thuc_du_kien}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>

                <hr className="my-4"/>
                <h5 className="text-primary mb-4">II. Nội dung chi tiết đề tài</h5>
                <Form.Group className="mb-3" controlId="tongQuanVanDe">
                    <Form.Label>Tổng quan vấn đề nghiên cứu</Form.Label>
                    <Form.Control as="textarea" rows={3} name="tong_quan_van_de" value={formData.tong_quan_van_de} onChange={handleChange} disabled={isLoading}/>
                </Form.Group>
                <Form.Group className="mb-3" controlId="tinhCapThiet">
                    <Form.Label>Tính cấp thiết</Form.Label>
                    <Form.Control as="textarea" rows={3} name="tinh_cap_thiet" value={formData.tinh_cap_thiet} onChange={handleChange} disabled={isLoading}/>
                </Form.Group>
                <Form.Group className="mb-3" controlId="mucTieuNghienCuu">
                    <Form.Label>Mục tiêu nghiên cứu <span className="text-danger">*</span></Form.Label>
                    <Form.Control as="textarea" rows={3} name="muc_tieu_nghien_cuu" value={formData.muc_tieu_nghien_cuu} onChange={handleChange} required isInvalid={!!validationErrors.muc_tieu_nghien_cuu} disabled={isLoading}/>
                    <Form.Control.Feedback type="invalid">{validationErrors.muc_tieu_nghien_cuu}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="doiTuongNghienCuu">
                    <Form.Label>Đối tượng nghiên cứu</Form.Label>
                    <Form.Control as="textarea" rows={2} name="doi_tuong" value={formData.doi_tuong} onChange={handleChange} disabled={isLoading}/>
                </Form.Group>
                <Form.Group className="mb-3" controlId="phamViNghienCuu">
                    <Form.Label>Phạm vi nghiên cứu</Form.Label>
                    <Form.Control as="textarea" rows={2} name="pham_vi" value={formData.pham_vi} onChange={handleChange} disabled={isLoading}/>
                </Form.Group>
                <Form.Group className="mb-3" controlId="noiDungPhuongPhap">
                    <Form.Label>Nội dung và phương pháp nghiên cứu</Form.Label>
                    <Form.Control as="textarea" rows={5} name="noi_dung_phuong_phap" value={formData.noi_dung_phuong_phap} onChange={handleChange} disabled={isLoading}/>
                </Form.Group>
                {/* <Form.Group className="mb-3" controlId="sanPhamDuKien">
                    <Form.Label>Sản phẩm dự kiến</Form.Label>
                    <Form.Control as="textarea" rows={3} name="san_pham_du_kien" value={formData.san_pham_du_kien} onChange={handleChange} disabled={isLoading}/>
                </Form.Group> */}
                <Form.Group className="mb-3" controlId="ghiChuDeXuat">
                    <Form.Label>Ghi chú thêm (nếu có)</Form.Label>
                    <Form.Control as="textarea" rows={2} name="ghi_chu_de_xuat" value={formData.ghi_chu_de_xuat} onChange={handleChange} disabled={isLoading}/>
                </Form.Group>

                <hr className="my-4"/>
                <h5 className="text-primary mb-3">III. Thành viên tham gia</h5>
                <p className="text-muted small">Chủ nhiệm đề tài: <strong>{currentUser.ho_ten} ({currentUser.msvc})</strong>.</p>
                <Form.Group as={Row} className="mb-3 align-items-end" controlId="addMemberGroup">
                    <Col>
                        <Form.Label>Thêm thành viên bằng MSVC</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Nhập MSVC giảng viên"
                            value={msvcToAdd}
                            onChange={(e) => { setMsvcToAdd(e.target.value); setFindMemberError(null); }}
                            disabled={isFindingMember || isLoading}
                        />
                    </Col>
                    <Col md="auto" className="mt-2 mt-md-0"> {/* Thêm class để căn chỉnh trên mobile */}
                        <Button variant="info" onClick={handleFindAndAddMember} disabled={isFindingMember || isLoading || !msvcToAdd.trim()} className="w-100">
                            {isFindingMember ? <Spinner as="span" size="sm" className="me-1"/> : <FaSearch className="me-1"/>} Tìm & Thêm
                        </Button>
                    </Col>
                    {findMemberError && <Col xs={12} className="mt-2"><Form.Text className="text-danger">{findMemberError}</Form.Text></Col>}
                </Form.Group>

                {formData.thanh_vien_tham_gia.length > 0 && (
                    <Table striped bordered hover responsive className="mt-3">
                        <thead>
                            <tr>
                                <th>MSVC</th>
                                <th>Họ Tên</th>
                                <th>Vai trò <span className="text-danger">*</span></th>
                                <th className="text-center">Quyền sửa đổi</th>
                                <th className="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.thanh_vien_tham_gia.map((mem, idx) => (
                                <tr key={mem.giang_vien_id || `new-member-${idx}`}>
                                    <td>{mem.msvc}</td>
                                    <td>{mem.ho_ten}</td>
                                    <td>
                                        <Form.Select
                                            name={`thanh_vien_tham_gia[${idx}].vai_tro_id`}
                                            value={mem.vai_tro_id}
                                            onChange={(e) => {
                                                const newMembers = [...formData.thanh_vien_tham_gia];
                                                newMembers[idx].vai_tro_id = e.target.value ? parseInt(e.target.value, 10) : '';
                                                setFormData(prev => ({ ...prev, thanh_vien_tham_gia: newMembers }));
                                            }}
                                            disabled={isLoading || mem.is_chu_nhiem}
                                            isInvalid={!!validationErrors.thanh_vien_tham_gia && !mem.vai_tro_id}
                                        >
                                            <option value="">-- Chọn vai trò --</option>
                                            {options.vaiTroThanhVien
                                                .filter(vt => !vt.ten_vai_tro?.toLowerCase().includes('chủ nhiệm'))
                                                .map(vt => (
                                                    <option key={vt.id} value={vt.id}>{vt.ten_vai_tro}</option>
                                                ))}
                                        </Form.Select>
                                    </td>
                                    <td className="text-center">
                                        <Form.Check
                                            type="switch"
                                            id={`can_edit_switch_${idx}`}
                                            checked={mem.can_edit}
                                            onChange={(e) => {
                                                const newMembers = [...formData.thanh_vien_tham_gia];
                                                newMembers[idx].can_edit = e.target.checked;
                                                setFormData(prev => ({ ...prev, thanh_vien_tham_gia: newMembers }));
                                            }}
                                            disabled={isLoading || mem.is_chu_nhiem}
                                        />
                                    </td>
                                    <td className="text-center">
                                        <Button variant="outline-danger" size="sm" onClick={() => removeMember(idx)} disabled={isLoading || mem.is_chu_nhiem} title="Xóa thành viên">
                                            <FaTrash />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
                {validationErrors.thanh_vien_tham_gia && <Form.Text className="text-danger d-block mt-2">{validationErrors.thanh_vien_tham_gia}</Form.Text>}


                <div className="mt-5 d-flex justify-content-end">
                    <Button variant="secondary" onClick={() => navigate('/lecturer/my-researches')} className="me-3" disabled={isLoading} size="lg">
                        Hủy bỏ
                    </Button>
                    <Button variant="primary" type="submit" disabled={isLoading || isLoadingOptions} size="lg">
                        {isLoading ? <><Spinner as="span" animation="border" size="sm" className="me-2"/> Đang xử lý...</> : (isEditMode ? 'Lưu thay đổi' : 'Gửi đăng ký')}
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default RegisterOrEditResearchPage;
