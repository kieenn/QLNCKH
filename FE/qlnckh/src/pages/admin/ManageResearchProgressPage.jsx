// c:/Users/maing/OneDrive/Documents/KLTN/project/FE/qlnckh/src/pages/admin/ManageResearchProgressPage.jsx
import React, { useState, useEffect } from 'react';
import usePagination from '../../hooks/usePagination';
import {
    Container, Card, Table, Button, Spinner, Alert, Pagination, Row, Col, InputGroup, FormControl,
    Modal, Badge, Form, ButtonGroup, ListGroup // Thêm ButtonGroup
} from 'react-bootstrap';
import { FaEye, FaEdit, FaSearch, FaFilter, FaTasks, FaSyncAlt } from 'react-icons/fa';
import {
    getResearchProgressList, getAllLinhVuc, getAllTrangThaiDeTai, getAllTienDoMilestones, updateResearchProgress, getDonViList
} from '../../api/adminApi';
import { fetchCsrfToken } from '../../api/axiosConfig';
// eslint-disable-next-line no-unused-vars
import { useAuth } from '../../hooks/useAuth'; // Giữ lại nếu cần, ví dụ cho quyền

// --- Helper Functions ---
const getTrangThaiBadge = (statusName) => {
    const lowerStatus = statusName?.toLowerCase() || '';
    if (lowerStatus.includes('đang thực hiện')) return 'primary';
    if (lowerStatus.includes('hoàn thành') && !lowerStatus.includes('nghiệm thu')) return 'info';
    if (lowerStatus.includes('nghiệm thu')) return 'success';
    if (lowerStatus.includes('trễ') || lowerStatus.includes('quá hạn')) return 'danger';
    if (lowerStatus.includes('tạm dừng')) return 'warning';
    if (lowerStatus.includes('chờ duyệt') || lowerStatus.includes('đề xuất')) return 'secondary';
    if (lowerStatus.includes('đã duyệt')) return 'success';
    return 'dark';
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) { return 'Invalid Date'; }
};

// --- Component Modal Xem Chi Tiết ---
const ResearchProgressDetailsModal = ({ show, onHide, project }) => { // Đổi tên để rõ ràng hơn
    if (!project) return null;
    const chuNhiem = project.giang_vien_tham_gia?.find(gv => gv.pivot?.vai_tro_id === 1 || gv.is_chu_nhiem === true);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title as="h5">Chi tiết đề tài: {project.ten_de_tai || 'N/A'}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <h6 className="text-primary mb-3">I. THÔNG TIN CHUNG</h6>
                <Row>
                    <Col md={6}>
                        <dl className="row mb-0">
                            <dt className="col-sm-5">Mã đề tài:</dt><dd className="col-sm-7">{project.ma_de_tai || 'N/A'}</dd>
                            <dt className="col-sm-5">Chủ nhiệm:</dt><dd className="col-sm-7">{chuNhiem?.ho_ten || 'N/A'} ({chuNhiem?.msvc || 'N/A'})</dd>
                            <dt className="col-sm-5">Đơn vị chủ trì:</dt><dd className="col-sm-7">{project.chu_tri?.ten || 'N/A'}</dd>
                            <dt className="col-sm-5">Đơn vị chủ quản:</dt><dd className="col-sm-7">{project.chu_quan?.ten || 'N/A'}</dd>
                            <dt className="col-sm-5">Lĩnh vực:</dt><dd className="col-sm-7">{project.linh_vuc_nghien_cuu?.ten || 'N/A'}</dd>
                        </dl>
                    </Col>
                    <Col md={6}>
                        <dl className="row mb-0">
                            <dt className="col-sm-5">Cấp nhiệm vụ:</dt><dd className="col-sm-7">{project.cap_nhiem_vu?.ten || 'N/A'}</dd>
                            <dt className="col-sm-5">Loại hình NC:</dt><dd className="col-sm-7">{project.loai_hinh_nghien_cuu || 'N/A'}</dd>
                            <dt className="col-sm-5">Thời gian TH:</dt><dd className="col-sm-7">{project.thoi_gian_thuc_hien ? `${project.thoi_gian_thuc_hien} tháng` : 'N/A'}</dd>
                            <dt className="col-sm-5">Tổng kinh phí:</dt><dd className="col-sm-7">{project.tong_kinh_phi ? `${Number(project.tong_kinh_phi).toLocaleString('vi-VN')} VNĐ` : 'N/A'}</dd>
                            <dt className="col-sm-5">Trạng thái:</dt><dd className="col-sm-7"><Badge bg={getTrangThaiBadge(project.trang_thai?.ten_hien_thi)}>{project.trang_thai?.ten_hien_thi || 'N/A'}</Badge></dd>
                        </dl>
                    </Col>
                </Row>
                <hr className="my-3"/>
                <h6 className="text-primary mb-3">II. NỘI DUNG ĐỀ TÀI</h6>
                <div className="mb-2"><strong>Tên đề tài:</strong> {project.ten_de_tai || 'N/A'}</div>
                <div className="mb-2"><strong>Tổng quan vấn đề nghiên cứu:</strong> <div className="ps-3 text-muted">{project.tong_quan_van_de || 'N/A'}</div></div>
                <div className="mb-2"><strong>Tính cấp thiết:</strong> <div className="ps-3 text-muted">{project.tinh_cap_thiet || 'N/A'}</div></div>
                <div className="mb-2"><strong>Mục tiêu nghiên cứu:</strong> <div className="ps-3 text-muted">{project.muc_tieu_nghien_cuu || 'N/A'}</div></div>
                <div className="mb-2"><strong>Đối tượng nghiên cứu:</strong> <div className="ps-3 text-muted">{project.doi_tuong || 'N/A'}</div></div>
                <div className="mb-2"><strong>Phạm vi nghiên cứu:</strong> <div className="ps-3 text-muted">{project.pham_vi || 'N/A'}</div></div>
                <div className="mb-2"><strong>Nội dung và phương pháp nghiên cứu:</strong> <div className="ps-3 text-muted">{project.noi_dung_phuong_phap || 'N/A'}</div></div>
                {project.ghi_chu && <div className="mb-2"><strong>Ghi chú chung:</strong> <div className="ps-3 text-muted">{project.ghi_chu}</div></div>}

                <hr className="my-3"/>
                <h6 className="text-primary mb-3">III. THÔNG TIN QUẢN LÝ</h6>
                <Row>
                    <Col md={6}>
                        <dl className="row mb-0">
                            <dt className="col-sm-5">Thời gian đăng ký:</dt><dd className="col-sm-7">{formatDate(project.created_at)}</dd>
                            <dt className="col-sm-5">Thời gian nộp (DK):</dt><dd className="col-sm-7">{formatDate(project.thoi_gian_nop)}</dd>
                        </dl>
                    </Col>
                    <Col md={6}>
                        <dl className="row mb-0">
                            <dt className="col-sm-5">Thời gian xét duyệt:</dt><dd className="col-sm-7">{formatDate(project.thoi_gian_xet_duyet)}</dd>
                            <dt className="col-sm-5">Admin duyệt:</dt><dd className="col-sm-7">{project.admin?.ho_ten || 'N/A'}</dd>
                        </dl>
                    </Col>
                </Row>

                <hr className="my-3"/>
                <h6 className="text-primary mb-3">IV. THÀNH VIÊN THAM GIA</h6>
                {project.giang_vien_tham_gia && project.giang_vien_tham_gia.length > 0 ? (
                    <ListGroup variant="flush" className="mb-3">
                        {project.giang_vien_tham_gia.map(gv => (
                            <ListGroup.Item key={gv.id} className="d-flex justify-content-between align-items-start ps-0">
                                <div>
                                    <div className="fw-bold">{gv.ho_ten} ({gv.msvc})</div>
                                    <small className="text-muted">{gv.pivot?.ten_vai_tro || (gv.pivot?.vai_tro_id === 1 ? 'Chủ nhiệm' : 'Thành viên')}</small>
                                </div>
                                {gv.pivot?.can_edit && <Badge bg="info" pill>Có quyền sửa</Badge>}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                ) : <p className="text-muted">Không có thành viên nào được ghi nhận.</p>}

                <hr className="my-3"/>
                <h6 className="text-primary mb-3">V. LỊCH SỬ TIẾN ĐỘ</h6>
                {/* Thay project.progress_updates bằng project.tien_do */}
                {project.tien_do && project.tien_do.length > 0 ? ( 
                    <ListGroup variant="flush" className="border rounded">
                        {/* Sắp xếp theo thu_tu của mốc gốc, sau đó có thể theo created_at của pivot nếu cần */}
                        {[...project.tien_do].sort((a, b) => a.thu_tu - b.thu_tu || new Date(b.pivot.created_at) - new Date(a.pivot.created_at)).map(moc => ( 
                            <ListGroup.Item key={moc.pivot.id} className={moc.pivot.is_present ? 'list-group-item-info fw-bold' : ''}>
                                <span>{moc.ten_moc}</span> {moc.pivot.is_present && <Badge bg="primary" className="ms-2">Hiện tại</Badge>}
                                <br />
                                <small className="text-muted"><i>Mô tả mốc gốc:</i> {moc.mo_ta}</small>
                                {moc.pivot.mo_ta && <p className="mb-0 mt-1 fst-italic">Ghi chú cụ thể: {moc.pivot.mo_ta}</p>}
                                <small className="d-block text-muted">Thời gian ghi nhận: {formatDate(moc.pivot.created_at)}</small>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                ) : (
                    <p className="text-muted">Chưa có mốc tiến độ nào được ghi nhận.</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Đóng</Button>
            </Modal.Footer>
        </Modal>
    );
};


// --- Component Modal Cập Nhật Tiến Độ ---
const UpdateProgressModal = ({ show, onHide, project, tienDoOptions, onSubmitUpdate, isLoading: isSubmittingUpdate }) => {
    const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show && project) {
            // Tìm mốc hiện tại trong project.tien_do
            const currentMilestonePivot = project.tien_do?.find(m => m.pivot?.is_present === true);
            setSelectedMilestoneId(currentMilestonePivot?.id || ''); // ID của mốc tiến độ gốc (moc.id)
            setDescription(currentMilestonePivot?.pivot?.mo_ta || ''); // Mô tả của lần cập nhật đó
            setError(null);
        } else {
            setSelectedMilestoneId('');
            setDescription('');
            setError(null);
        }
    }, [show, project]);

    const handleSubmit = async () => {
        if (!project?.id) return; // Sử dụng project.id (ID của đề tài)
        if (!selectedMilestoneId) {
            setError("Vui lòng chọn một mốc tiến độ.");
            return;
        }
        setError(null);
        // Gọi hàm onSubmitUpdate được truyền từ component cha
        // Gửi ID của đề tài, ID của mốc tiến độ, và mô tả
        await onSubmitUpdate(project.id, selectedMilestoneId, description);
        // Việc đóng modal và refetch sẽ do onSubmitUpdate xử lý (nếu thành công)
    };

    if (!project) return null;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Cập nhật tiến độ</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <p><strong>Đề tài:</strong> {project.ten_de_tai || 'N/A'}</p>
                <p><strong>Mã ĐT:</strong> {project.ma_de_tai || project.id}</p>
                <hr />
                <Form>
                    <Form.Group className="mb-3" controlId="updateProgressMilestone">
                        <Form.Label>Chọn mốc tiến độ mới <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                            value={selectedMilestoneId}
                            onChange={(e) => setSelectedMilestoneId(e.target.value)}
                            disabled={isSubmittingUpdate}
                        >
                            <option value="">-- Chọn mốc tiến độ --</option>
                            {/* tienDoOptions là danh sách tất cả các mốc tiến độ gốc */}
                            {tienDoOptions.map(td => (
                                <option key={td.id} value={td.id}>{td.ten_moc}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="updateProgressDescription">
                        <Form.Label>Ghi chú / Mô tả chi tiết</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Mô tả những gì đã thực hiện được ở mốc này..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isSubmittingUpdate}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isSubmittingUpdate}>
                    Hủy
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={isSubmittingUpdate || !selectedMilestoneId}>
                    {isSubmittingUpdate ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Cập nhật'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// --- Component Trang Quản Lý Tiến Độ ---
const ManageResearchProgressPage = () => {
    // eslint-disable-next-line no-unused-vars
    const { user: currentUser } = useAuth();
    const {
        data: projects, loading: isLoading, error: fetchError,
        goToPage, refetch: refetchProjects, updateFilters, queryParams, paginationData
    } = usePagination(getResearchProgressList);

    // Filter States
    const [searchTerm, setSearchTerm] = useState(queryParams?.search_keyword || '');
    const [selectedLinhVuc, setSelectedLinhVuc] = useState(queryParams?.lvnc_id || '');
    const [selectedTrangThai, setSelectedTrangThai] = useState(queryParams?.trang_thai_id || '');
    const [selectedTienDoFilter, setSelectedTienDoFilter] = useState(queryParams?.tien_do_id || '');
    const [selectedChuTri, setSelectedChuTri] = useState(queryParams?.chu_tri_id || '');
    const [selectedChuQuan, setSelectedChuQuan] = useState(queryParams?.chu_quan_id || '');

    // Options States
    const [linhVucOptions, setLinhVucOptions] = useState([]);
    const [trangThaiOptions, setTrangThaiOptions] = useState([]);
    const [tienDoOptions, setTienDoOptions] = useState([]); // Danh sách tất cả các mốc tiến độ gốc
    const [donViOptions, setDonViOptions] = useState([]);
    const [isLoadingFilters, setIsLoadingFilters] = useState(false);

    // Action/Modal States
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [projectForDetails, setProjectForDetails] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [projectToUpdate, setProjectToUpdate] = useState(null);
    const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false); // State loading riêng cho việc submit modal

    useEffect(() => {
        const fetchFilterOptions = async () => {
            setIsLoadingFilters(true);
            try {
                const [lvRes, ttRes, tdRes, dvRes] = await Promise.all([
                    getAllLinhVuc(),
                    getAllTrangThaiDeTai(),
                    getAllTienDoMilestones(), // API này lấy tất cả các mốc tiến độ gốc
                    getDonViList()
                ]);
                setLinhVucOptions(lvRes.data || []);
                setTrangThaiOptions(ttRes.data || []);
                setDonViOptions(Array.isArray(dvRes) ? dvRes : (dvRes?.data || []));
                setTienDoOptions(tdRes.data || []); // Lưu danh sách tất cả mốc tiến độ gốc
            } catch (err) {
                console.error("Error fetching filter options:", err);
                setActionError("Lỗi tải dữ liệu cho bộ lọc.");
            } finally {
                setIsLoadingFilters(false);
            }
        };
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        const timerId = setTimeout(() => {
            if (typeof updateFilters === 'function') {
                updateFilters({
                    search_keyword: searchTerm.trim(),
                    lvnc_id: selectedLinhVuc,
                    trang_thai_id: selectedTrangThai,
                    tien_do_id: selectedTienDoFilter,
                    chu_tri_id: selectedChuTri,
                    chu_quan_id: selectedChuQuan,
                });
            }
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm, selectedLinhVuc, selectedTrangThai, selectedTienDoFilter, selectedChuTri, selectedChuQuan, updateFilters]);

    const renderPaginationItems = () => {
        if (!paginationData || paginationData.last_page <= 1) return null;
        const items = [];
        const { links } = paginationData;
        links.forEach((link, index) => {
            if (link.url === null) {
                items.push(<Pagination.Item key={`link-${index}`} disabled><span dangerouslySetInnerHTML={{ __html: link.label }} /></Pagination.Item>);
            } else if (link.active) {
                items.push(<Pagination.Item key={`link-${index}`} active>{link.label}</Pagination.Item>);
            } else {
                try {
                    const urlParams = new URLSearchParams(new URL(link.url).search);
                    const pageNum = urlParams.get('page');
                    items.push(<Pagination.Item key={`link-${index}`} onClick={() => goToPage(pageNum)} disabled={isLoading}><span dangerouslySetInnerHTML={{ __html: link.label }} /></Pagination.Item>);
                } catch (e) {
                    items.push(<Pagination.Item key={`link-${index}`} disabled><span dangerouslySetInnerHTML={{ __html: link.label }} /></Pagination.Item>);
                }
            }
        });
        return items;
    };

    const handleViewDetailsClick = (project) => {
        setProjectForDetails(project);
        setShowDetailsModal(true);
        setActionError(null);
        setActionSuccess(null);
    };

    const handleOpenUpdateModal = (project) => {
        setProjectToUpdate(project);
        setShowUpdateModal(true);
        setActionError(null);
        setActionSuccess(null);
    };

    const handleUpdateProgressSubmit = async (projectId, newMilestoneId, description) => {
        setIsSubmittingUpdate(true); // Bắt đầu loading cho modal
        setActionError(null);
        setActionSuccess(null);
        try {
            await fetchCsrfToken();
            // API updateResearchProgress cần ID của đề tài (project.id), không phải ma_de_tai
            const response = await updateResearchProgress(projectId, { tien_do_id: newMilestoneId || null, mo_ta: description });
            setActionSuccess(response.data?.message || `Cập nhật tiến độ cho đề tài ID ${projectId} thành công.`);
            setShowUpdateModal(false);
            refetchProjects();
        } catch (err) {
            console.error("Milestone update error:", err);
            setActionError(`Lỗi cập nhật tiến độ cho đề tài ID ${projectId}: ${err.response?.data?.message || err.message}`);
            // Không đóng modal nếu có lỗi để người dùng có thể thử lại hoặc sửa
        } finally {
            setIsSubmittingUpdate(false); // Kết thúc loading cho modal
        }
    };

    const getCurrentMilestoneName = (project) => {
        // API trả về `tien_do_da_cap_nhat` là mảng các mốc đã được admin cập nhật cho đề tài này
        if (!project?.tien_do || project.tien_do.length === 0) return 'Chưa cập nhật';
        const currentMilestoneData = project.tien_do.find(moc => moc.pivot?.is_present === true);
        // `currentMilestoneData.tien_do.ten_moc` nếu `tien_do` là object lồng nhau chứa thông tin mốc gốc
        // Hoặc `currentMilestoneData.ten_moc` nếu API trả về trực tiếp tên mốc
        return currentMilestoneData?.ten_moc || 'Chưa có tên';
    };


    return (
        <Container fluid className="manage-research-progress-page p-4">
            <Row className="mb-3 align-items-center">
                <Col> <h1 className="h3">Quản lý tiến độ Đề tài NCKH</h1> </Col>
            </Row>

            {actionError && <Alert variant="danger" onClose={() => setActionError(null)} dismissible>{actionError}</Alert>}
            {actionSuccess && <Alert variant="success" onClose={() => setActionSuccess(null)} dismissible>{actionSuccess}</Alert>}

            <Card className="mb-4 shadow-sm">
                <Card.Header><FaFilter className="me-1" /> Bộ lọc</Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        <Col>
                            <InputGroup>
                                <FormControl placeholder="Tìm tên, mã đề tài, chủ nhiệm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={isLoading}/>
                            </InputGroup>
                        </Col>
                    </Row>
                    <Row className="g-3">
                        <Col md>
                            <Form.Select value={selectedLinhVuc} onChange={(e) => setSelectedLinhVuc(e.target.value)} disabled={isLoadingFilters || isLoading}>
                                <option value="">-- Lĩnh vực --</option>
                                {linhVucOptions.map(lv => <option key={lv.id} value={lv.id}>{lv.ten}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md>
                            <Form.Select value={selectedTrangThai} onChange={(e) => setSelectedTrangThai(e.target.value)} disabled={isLoadingFilters || isLoading}>
                                <option value="">-- Trạng thái ĐT --</option>
                                {trangThaiOptions.map(tt => <option key={tt.id} value={tt.id}>{tt.ten_hien_thi}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md>
                            <Form.Select value={selectedTienDoFilter} onChange={(e) => setSelectedTienDoFilter(e.target.value)} disabled={isLoadingFilters || isLoading}>
                                <option value="">-- Mốc tiến độ hiện tại --</option>
                                {tienDoOptions.map(td => <option key={td.id} value={td.id}>{td.ten_moc}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md>
                            <Form.Select value={selectedChuTri} onChange={(e) => setSelectedChuTri(e.target.value)} disabled={isLoadingFilters || isLoading}>
                                <option value="">-- ĐV Chủ trì --</option>
                                {donViOptions.map(dv => <option key={`ct-${dv.id}`} value={dv.id}>{dv.ten}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md>
                            <Form.Select value={selectedChuQuan} onChange={(e) => setSelectedChuQuan(e.target.value)} disabled={isLoadingFilters || isLoading}>
                                <option value="">-- ĐV Chủ quản --</option>
                                {donViOptions.map(dv => <option key={`cq-${dv.id}`} value={dv.id}>{dv.ten}</option>)}
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow mb-4 border-0">
                <Card.Header className="py-3 bg-light text-primary d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <h6 className="m-0 fw-bold"><FaTasks className="me-2"/>Danh sách đề tài và tiến độ</h6>
                        <Button variant="link" size="sm" onClick={() => refetchProjects()} disabled={isLoading} className="ms-2 p-0" title="Tải lại danh sách">
                            <FaSyncAlt className={isLoading ? 'fa-spin' : ''} />
                        </Button>
                    </div>
                    {paginationData && <small className="text-muted">Hiển thị {paginationData.from}-{paginationData.to} trên tổng số {paginationData.total} đề tài</small>}
                </Card.Header>
                <Card.Body className="p-0">
                    {isLoading && !projects.length ? (
                        <div className="text-center p-5"><Spinner animation="border" variant="primary" /><p>Đang tải...</p></div>
                    ) : fetchError ? (
                        <Alert variant="danger" className="m-3">
                            Lỗi tải dữ liệu: {fetchError.message || (typeof fetchError === 'string' ? fetchError : 'Không thể kết nối')}
                        </Alert>
                    ) : !projects || projects.length === 0 ? (
                        <Alert variant="info" className="m-3">Không tìm thấy đề tài nào khớp với bộ lọc.</Alert>
                    ) : (
                        <Table striped bordered hover responsive="xl" className="align-middle mb-0">
                            <thead>
                                <tr>
                                    <th className="ps-3" style={{ width: '3%' }}>#</th>
                                    <th style={{ width: '20%' }}>Tên đề tài</th>
                                    <th style={{ width: '12%' }}>Chủ nhiệm</th>
                                    <th style={{ width: '10%' }}>Trạng thái ĐT</th>
                                    <th style={{ width: '15%' }} className="text-center">Tiến độ hiện tại</th>
                                    <th style={{ width: '15%' }} className="text-center pe-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project, index) => {
                                    if (!project || !project.id) { 
                                        console.warn(`Skipping invalid project data at index ${index}:`, project);
                                        return null;
                                    }
                                    const chuNhiem = project.giang_vien_tham_gia?.find(gv => gv.pivot?.vai_tro_id === 1 || gv.is_chu_nhiem === true);
                                    
                                    // --- ĐÂY LÀ LOGIC KIỂM TRA ĐIỀU KIỆN ---
                                    // Điều kiện 1: Trạng thái đề tài là "Đã hoàn thành" (ID = 5)
                                    const isCompleted = project.trang_thai_id === 3 || project.trang_thai?.id === 3;
                                    
                                    // Điều kiện 2: Có mốc tiến độ với ID = 7 đã được cập nhật cho đề tài này
                                    // Giả sử project.tien_do_da_cap_nhat là mảng các mốc đã cập nhật, 
                                    // mỗi mốc có 'tien_do_id' (ID của mốc tiến độ gốc) hoặc 'id' (cũng là ID của mốc tiến độ gốc)
                                    const hasMilestone7Updated = project.tien_do_da_cap_nhat?.some(
                                        td => td.tien_do_id === 7 || td.id === 7 
                                    );

                                    // Nút "Cập nhật" sẽ bị vô hiệu hóa nếu một trong hai điều kiện trên là đúng
                                    const disableUpdateButton = isCompleted || hasMilestone7Updated;
                                    
                                    const updateButtonTitle = disableUpdateButton
                                        ? (isCompleted ? "Đề tài đã hoàn thành" : "Đã đạt mốc không cho phép cập nhật")
                                        : "Cập nhật tiến độ";
                                    // --- KẾT THÚC LOGIC KIỂM TRA ---

                                    return (
                                        <tr key={project.id}> {/* Sử dụng project.id làm key */}
                                            <td className="ps-3">{paginationData ? (paginationData.from + index) : index + 1}</td>
                                            <td>
                                                <span
                                                    onClick={() => handleViewDetailsClick(project)}
                                                    style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
                                                    title="Xem chi tiết đề tài"
                                                >
                                                    {project.ten_de_tai || 'N/A'}
                                                </span>
                                                {project.ma_de_tai && <small className="d-block text-muted">Mã: {project.ma_de_tai}</small>}
                                            </td>
                                            <td>
                                                {chuNhiem?.ho_ten || 'N/A'}
                                                {chuNhiem?.msvc && <small className="d-block text-muted">MSVC: {chuNhiem.msvc}</small>}
                                            </td>
                                            <td className="text-center"><Badge bg={getTrangThaiBadge(project.trang_thai?.ten_hien_thi)}>{project.trang_thai?.ten_hien_thi || 'N/A'}</Badge></td>
                                            <td className="text-center">{getCurrentMilestoneName(project)}</td>
                                            <td className="text-center pe-3">
                                                <ButtonGroup>
                                                    <Button variant="outline-info" size="sm" onClick={() => handleViewDetailsClick(project)} title="Xem chi tiết"><FaEye /></Button>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleOpenUpdateModal(project)}
                                                        disabled={disableUpdateButton || isLoadingFilters} // Nút bị vô hiệu hóa ở đây
                                                        title={updateButtonTitle} // Title giải thích lý do
                                                    >
                                                        <FaEdit /> Cập nhật
                                                    </Button>
                                                </ButtonGroup>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>    
                        </Table>
                    )}
                    {!isLoading && paginationData && paginationData.last_page > 1 && (
                        <div className="d-flex justify-content-center mt-4 mb-3">
                            <Pagination>{renderPaginationItems()}</Pagination>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {projectForDetails && (
                <ResearchProgressDetailsModal
                    show={showDetailsModal}
                    onHide={() => { setShowDetailsModal(false); setProjectForDetails(null); }}
                    project={projectForDetails}
                />
            )}

            <UpdateProgressModal
                show={showUpdateModal}
                onHide={() => {setShowUpdateModal(false); setProjectToUpdate(null);}} // Reset projectToUpdate khi đóng
                project={projectToUpdate}
                tienDoOptions={tienDoOptions} // Truyền danh sách tất cả mốc tiến độ gốc
                onSubmitUpdate={handleUpdateProgressSubmit}
                isLoading={isSubmittingUpdate} // Sử dụng state loading riêng cho modal
            />

        </Container>
    );
};

export default ManageResearchProgressPage;
