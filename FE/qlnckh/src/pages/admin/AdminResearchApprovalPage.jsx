import React, { useState, useEffect } from 'react';
import usePagination from '../../hooks/usePagination';
import {
    Container, Card, Table, Button, Spinner, Alert, Pagination, Row, Col, InputGroup, FormControl, Badge, Modal, Form, ButtonGroup
} from 'react-bootstrap';
import { FaEye, FaEdit, FaFilter, FaTasks } from 'react-icons/fa';
import { getPendingProposalsForAdmin, submitAdminReview, getAllVaiTro } from '../../api/adminApi';
import { useAuth } from '../../hooks/useAuth';

// Helper functions
const getTrangThaiBadge = (statusName) => {
    const lowerStatus = statusName?.toLowerCase() || '';
    if (lowerStatus.includes('đang thực hiện')) return 'primary';
    if (lowerStatus.includes('hoàn thành') && !lowerStatus.includes('nghiệm thu')) return 'info';
    if (lowerStatus.includes('nghiệm thu')) return 'success';
    if (lowerStatus.includes('trễ') || lowerStatus.includes('quá hạn')) return 'danger';
    if (lowerStatus.includes('tạm dừng')) return 'warning';
    if (lowerStatus.includes('chờ duyệt') || lowerStatus.includes('đề xuất')) return 'secondary';
    if (lowerStatus.includes('từ chối') || lowerStatus.includes('yêu cầu chỉnh sửa')) return 'dark';
    if (lowerStatus.includes('đã duyệt')) return 'success';
    return 'light';
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('vi-VN'); } catch (e) { return 'Invalid Date'; }
};

// Modal xem chi tiết
const AdminResearchDetailsModal = ({ show, onHide, project }) => {
    // ESLint Fix: Hooks called before conditional return
    const [vaiTroList, setVaiTroList] = useState([]);
    const [isLoadingVaiTro, setIsLoadingVaiTro] = useState(false);

    useEffect(() => {
        const fetchVaiTro = async () => {
            if (show && project) { // Chỉ fetch khi modal được hiển thị và có project
                setIsLoadingVaiTro(true);
                try {
                    const response = await getAllVaiTro();
                    setVaiTroList(response.data || []);
                } catch (error) {
                    console.error("Lỗi khi tải danh sách vai trò:", error);
                    setVaiTroList([]);
                } finally {
                    setIsLoadingVaiTro(false);
                }
            }
        };
        fetchVaiTro();
    }, [show, project]); // Dependency là show và project

    if (!project) {
        return null;
    }
    const chuNhiem = project.msvc_gvdk_user;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton><Modal.Title>Chi tiết Đề tài: {project.ten_de_tai || 'N/A'}</Modal.Title></Modal.Header>
            <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <Row className="mb-3">
                    <Col md={6}><p><strong>Mã đề tài (hệ thống):</strong> {project.id}</p></Col>
                    <Col md={6}><p><strong>Mã đề tài (QLKH):</strong> {project.ma_de_tai || 'Chưa cấp'}</p></Col>
                </Row>
                <p><strong>Tên đề tài:</strong> {project.ten_de_tai || 'N/A'}</p>
                <Row className="mb-3">
                    <Col md={6}><p><strong>Người đăng ký (Chủ nhiệm):</strong> {chuNhiem?.ho_ten || 'N/A'}</p></Col>
                    <Col md={6}><p><strong>MSVC:</strong> {chuNhiem?.msvc || 'N/A'}</p></Col>
                </Row>
                 <Row className="mb-3">
                    <Col md={6}><p><strong>Lĩnh vực:</strong> {project.linh_vuc_nghien_cuu?.ten || 'N/A'}</p></Col>
                    <Col md={6}><p><strong>Cấp nhiệm vụ:</strong> {project.cap_nhiem_vu?.ten || 'N/A'}</p></Col>
                </Row>
                <Row className="mb-3">
                    <Col md={6}><p><strong>Trạng thái hiện tại:</strong>  {project.trang_thai?.ten_hien_thi || (project.trang_thai_id === 1 ? 'Chờ duyệt' : 'N/A')}</p></Col>
                    <Col md={6}><p><strong>Ngày đề xuất:</strong> {formatDate(project.created_at)}</p></Col>
                </Row>
                <Row className="mb-3">
                    <Col md={6}><p><strong>Thời gian BĐ dự kiến:</strong> {formatDate(project.ngay_bat_dau_dukien)}</p></Col>
                    <Col md={6}><p><strong>Thời gian KT dự kiến:</strong> {formatDate(project.ngay_ket_thuc_dukien)}</p></Col>
                </Row>
                <Row className="mb-3">
                    <Col md={6}><p><strong>Thời gian thực hiện dự kiến:</strong> {project.thoi_gian_thuc_hien || 'N/A'} tháng</p></Col>
                    <Col md={6}><p><strong>Loại hình nghiên cứu:</strong> {project.loai_hinh_nghien_cuu || 'N/A'}</p></Col>
                </Row>
                <p><strong>Tổng kinh phí đề xuất:</strong> {project.tong_kinh_phi ? Number(project.tong_kinh_phi).toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}</p>
                <Row className="mb-3">
                    <Col md={6}><p><strong>Đơn vị chủ quản:</strong> {project.chu_quan?.ten || 'N/A'}</p></Col>
                    <Col md={6}><p><strong>Đơn vị chủ trì:</strong> {project.chu_tri?.ten || 'N/A'}</p></Col>
                </Row>
                
                <hr/>
                <h5 className="mt-3">Nội dung chi tiết đề xuất</h5>
                <div className="mt-2 p-3 bg-light rounded">
                    <p><strong>Tổng quan vấn đề:</strong><br/> {project.tong_quan_van_de || 'N/A'}</p>
                    <p><strong>Tính cấp thiết:</strong><br/> {project.tinh_cap_thiet || 'N/A'}</p>
                    <p><strong>Mục tiêu nghiên cứu:</strong><br/> {project.muc_tieu_nghien_cuu || 'N/A'}</p>
                    <p><strong>Đối tượng nghiên cứu:</strong><br/> {project.doi_tuong || 'N/A'}</p>
                    <p><strong>Phạm vi nghiên cứu:</strong><br/> {project.pham_vi || 'N/A'}</p>
                    <p><strong>Nội dung và phương pháp:</strong><br/> {project.noi_dung_phuong_phap || 'N/A'}</p>
                    <p><strong>Ghi chú đề xuất (nếu có):</strong><br/> {project.ghi_chu || 'N/A'}</p>
                </div>

                {project.giang_vien_tham_gia && project.giang_vien_tham_gia.length > 0 && (
                    <>
                        <hr />
                        <h5 className="mt-3">Thành viên tham gia:</h5>
                        <Table striped bordered hover size="sm" className="mt-2">
                            <thead>
                                <tr>
                                    <th>Họ tên</th>
                                    <th>MSVC</th>
                                    <th>Vai trò</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingVaiTro ? (
                                    <tr><td colSpan="3" className="text-center"><Spinner size="sm" /> Đang tải vai trò...</td></tr>
                                ) : (
                                    project.giang_vien_tham_gia.map(gv => {
                                        const vaiTro = vaiTroList.find(vt => vt.id === gv.pivot?.vai_tro_id);
                                        return (
                                            <tr key={gv.id}>
                                                <td>{gv.ho_ten}</td>
                                                <td>{gv.msvc}</td>
                                                <td>{vaiTro?.ten_vai_tro || `ID: ${gv.pivot?.vai_tro_id}`}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </>
                )}
                 {project.tien_do && project.tien_do.length > 0 && (
                    <>
                        <hr />
                        <h5 className="mt-3">Tiến độ dự kiến (nếu có):</h5>
                         <Table striped bordered size="sm" className="mt-2">
                            <thead><tr><th>Mốc tiến độ</th><th>Mô tả</th></tr></thead>
                            <tbody>
                                {project.tien_do.map(td => (
                                    <tr key={td.id}>
                                        <td>{td.ten_moc || 'N/A'}</td>
                                        <td>{td.mo_ta || td.pivot?.pivot_mo_ta || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={onHide}>Đóng</Button></Modal.Footer>
        </Modal>
    );
};

const AdminReviewModal = ({ show, onHide, proposal, onSubmitReview }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [comment, setComment] = useState('');
    const [maDeTaiInput, setMaDeTaiInput] = useState(''); // State mới cho mã đề tài

    useEffect(() => {
        if (proposal) {
            console.log("AdminReviewModal: useEffect triggered, proposal ID:", proposal.id);
            setError(null);
            setComment(''); // Reset comment khi mở modal mới
            setMaDeTaiInput(proposal.ma_de_tai || ''); // Lấy mã đề tài hiện tại nếu có
        }
    }, [proposal]);

    const handleDecision = async (decisionType) => {
        console.log("AdminReviewModal: handleSubmit called. Proposal ID:", proposal?.id, "Decision:", decisionType);
        if (!proposal) return;

        if (decisionType === 'approve' && !maDeTaiInput.trim()) {
            setError("Vui lòng nhập Mã đề tài để duyệt.");
            return;
        }
        if (decisionType === 'reject' && !comment.trim()) { // Lý do vẫn bắt buộc khi từ chối
            setError("Vui lòng nhập lý do từ chối.");
            return;
        }

        console.log("AdminReviewModal: Setting isSubmitting to true");
        setIsSubmitting(true);
        setError(null);

        let reviewData = {};
        if (decisionType === 'approve') {
            reviewData = {
                trang_thai_id: 2, // Đã duyệt
                ma_de_tai: maDeTaiInput.trim(), // Gửi mã đề tài
                ghi_chu_xet_duyet: comment.trim() || null, // Gửi null nếu comment rỗng
            };
        } else if (decisionType === 'reject') {
            reviewData = {
                trang_thai_id: 4, // Từ chối (ID 4)
                // Không gửi ma_de_tai khi từ chối
                ly_do_tu_choi: comment.trim(),
            };
        }

        try {
            console.log("AdminReviewModal: Calling onSubmitReview prop with data:", reviewData);
            await onSubmitReview(proposal.id, reviewData);
            console.log("AdminReviewModal: onSubmitReview successful");
            onHide();
        } catch (err) {
            console.error("AdminReviewModal: Error during onSubmitReview", err);
            setError(err.response?.data?.message || "Lỗi khi gửi quyết định.");
        } finally {
            console.log("AdminReviewModal: handleSubmit finally block, setting isSubmitting to false");
            setIsSubmitting(false);
        }
    };
    if (!proposal) return null;

    return (
        <Modal show={show} onHide={onHide} size="md" centered>
            <Modal.Header closeButton>
                <Modal.Title>Xét duyệt Đề tài</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <p><strong>Tên đề tài:</strong> {proposal.ten_de_tai || 'N/A'}</p>
                <p><strong>Chủ nhiệm:</strong> {proposal.msvc_gvdk_user?.ho_ten || 'N/A'}</p>
                <Form.Group className="mt-3">
                    <Form.Label>Mã đề tài (nếu duyệt) <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="text" value={maDeTaiInput} onChange={(e) => setMaDeTaiInput(e.target.value)} placeholder="Nhập mã đề tài sẽ cấp" disabled={isSubmitting}/>
                </Form.Group>
                <Form.Group className="mt-3">
                    <Form.Label>Nhận xét / Lý do từ chối (bắt buộc nếu từ chối):</Form.Label>
                    <Form.Control as="textarea" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} disabled={isSubmitting} />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>Hủy</Button>
                <Button variant="danger" onClick={() => handleDecision('reject')} disabled={isSubmitting}>
                    {isSubmitting ? <Spinner as="span" size="sm" /> : 'Từ chối'}
                </Button>
                <Button variant="success" onClick={() => handleDecision('approve')} disabled={isSubmitting}>
                    {isSubmitting ? <Spinner as="span" size="sm" /> : 'Duyệt đề tài'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

const AdminResearchApprovalPage = () => {
    // eslint-disable-next-line no-unused-vars
    const { user: currentUser } = useAuth(); // Nếu cần dùng thông tin admin
    const {
        data: proposals, loading: isLoading, error: fetchError,
        goToPage, refetch: refetchProposals, updateFilters, queryParams, paginationData
    } = usePagination(getPendingProposalsForAdmin, { per_page: 10 });

    const [searchTerm, setSearchTerm] = useState(queryParams?.search_keyword || '');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedProposalForDetails, setSelectedProposalForDetails] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedProposalForReview, setSelectedProposalForReview] = useState(null);
    const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const timerId = setTimeout(() => {
            if (typeof updateFilters === 'function') {
                updateFilters({ search_keyword: searchTerm.trim(), trang_thai_id_filter: 1 });
            }
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm, updateFilters]);

    const handleViewDetails = (proposal) => { setSelectedProposalForDetails(proposal); setShowDetailsModal(true); };
    const handleOpenReviewModal = (proposal) => { 
        console.log("AdminResearchApprovalPage: Opening review modal for proposal ID:", proposal.id);
        setSelectedProposalForReview(proposal); 
        setShowReviewModal(true); 
        setActionMessage({type:'', text:''}); 
    };

    const handleSubmitReview = async (proposalId, reviewData) => {
        console.log(`AdminResearchApprovalPage: handleSubmitReview called for proposal ID: ${proposalId}`, reviewData);
        try {
            console.log("AdminResearchApprovalPage: Calling submitAdminReview API...");
            await submitAdminReview(proposalId, reviewData);
            console.log("AdminResearchApprovalPage: submitAdminReview API successful.");
            setActionMessage({ type: 'success', text: 'Quyết định đã được lưu thành công!' });
            console.log("AdminResearchApprovalPage: Calling refetchProposals...");
            refetchProposals();
        } catch (err) {
            console.error("AdminResearchApprovalPage: Error during submitAdminReview API call", err);
            setActionMessage({ type: 'danger', text: err.response?.data?.message || 'Lỗi khi lưu quyết định.' });
            throw err;
        }
    };

    const renderPaginationItems = () => {
        if (!paginationData || paginationData.last_page <= 1) return null;
        const items = []; const { links } = paginationData;
        links.forEach((link, index) => {
            if (link.url === null) items.push(<Pagination.Item key={`link-${index}`} disabled><span dangerouslySetInnerHTML={{ __html: link.label }} /></Pagination.Item>);
            else if (link.active) items.push(<Pagination.Item key={`link-${index}`} active>{link.label}</Pagination.Item>);
            else {
                try {
                    const pageNum = new URLSearchParams(new URL(link.url).search).get('page');
                    items.push(<Pagination.Item key={`link-${index}`} onClick={() => goToPage(pageNum)} disabled={isLoading}><span dangerouslySetInnerHTML={{ __html: link.label }} /></Pagination.Item>);
                } catch (e) { items.push(<Pagination.Item key={`link-${index}`} disabled><span dangerouslySetInnerHTML={{ __html: link.label }} /></Pagination.Item>); }
            }
        });
        return items;
    };

    return (
        <Container fluid className="admin-approval-page p-4">
            <Row className="mb-3 align-items-center">
                <Col> <h1 className="h3">Xét duyệt Đề tài Nghiên cứu</h1> </Col>
            </Row>
            {actionMessage.text && <Alert variant={actionMessage.type} onClose={() => setActionMessage({ type: '', text: '' })} dismissible>{actionMessage.text}</Alert>}
            <Card className="mb-4 shadow-sm">
                <Card.Header><FaFilter className="me-1" /> Bộ lọc</Card.Header>
                <Card.Body>
                    <Row className="g-3">
                        <Col ><InputGroup><FormControl placeholder="Tìm tên đề tài,..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={isLoading}/></InputGroup></Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="shadow mb-4 border-0">
                <Card.Header className="py-3 bg-light text-primary d-flex justify-content-between align-items-center">
                    <h6 className="m-0 fw-bold"><FaTasks className="me-2"/>Danh sách đề tài chờ duyệt</h6>
                    {paginationData && <small className="text-muted">Hiển thị {paginationData.from}-{paginationData.to} / {paginationData.total}</small>}
                </Card.Header>
                <Card.Body className="p-0">
                    {isLoading && !proposals.length ? (<div className="text-center p-5"><Spinner animation="border" /><p>Đang tải...</p></div>)
                    : fetchError ? (<Alert variant="danger" className="m-3">Lỗi: {fetchError.message || 'Không thể kết nối'}</Alert>)
                    : !proposals || proposals.length === 0 ? (<Alert variant="info" className="m-3">Không có đề tài nào đang chờ duyệt.</Alert>)
                    : (<Table striped bordered hover responsive="lg" className="align-middle mb-0">
                        <thead><tr>
                            <th className="ps-3" style={{width: '5%'}}>#</th>
                            <th style={{width: '30%'}}>Tên đề tài</th>
                            <th style={{width: '20%'}}>Người đăng ký (Chủ nhiệm)</th>
                            <th style={{width: '15%'}}>Lĩnh vực</th>
                            <th style={{width: '15%'}} className="text-center">Ngày đề xuất</th>
                            <th style={{width: '15%'}} className="text-center pe-3">Hành động</th>
                        </tr></thead>
                        <tbody>{proposals.map((p, idx) => (
                            <tr key={p.id}>
                                <td className="ps-3">{paginationData.from + idx}</td>
                                <td>{p.ten_de_tai || 'N/A'}</td>
                                <td>{p.msvc_gvdk_user?.ho_ten || 'N/A'} <small className="d-block text-muted">{p.msvc_gvdk_user?.msvc || ''}</small></td>
                                <td>{p.linh_vuc_nghien_cuu?.ten || 'N/A'}</td>
                                <td className="text-center">{formatDate(p.created_at)}</td>
                                <td className="text-center pe-3">
                                    <ButtonGroup aria-label="Hành động">
                                        <Button variant="outline-info" size="sm" onClick={() => handleViewDetails(p)} title="Xem chi tiết"><FaEye /></Button>
                                        <Button variant="outline-primary" size="sm" onClick={() => handleOpenReviewModal(p)} title="Xét duyệt">
                                            <FaEdit /> Xét duyệt
                                        </Button>
                                    </ButtonGroup>
                                </td>
                            </tr>))}
                        </tbody></Table>
                    )}
                    {!isLoading && paginationData && paginationData.last_page > 1 && (<div className="d-flex justify-content-center mt-4 mb-3"><Pagination>{renderPaginationItems()}</Pagination></div>)}
                </Card.Body>
            </Card>

            {selectedProposalForDetails && <AdminResearchDetailsModal show={showDetailsModal} onHide={() => { setShowDetailsModal(false); setSelectedProposalForDetails(null); }} project={selectedProposalForDetails} />}
            {selectedProposalForReview && <AdminReviewModal
                show={showReviewModal}
                onHide={() => { setShowReviewModal(false); setSelectedProposalForReview(null); }}
                proposal={selectedProposalForReview}
                onSubmitReview={handleSubmitReview}
            />}
        </Container>
    );
};
export default AdminResearchApprovalPage;
