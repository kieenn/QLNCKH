import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import usePagination from '../../hooks/usePagination';
import {
    Container, Card, Table, Button, Spinner, Alert, Pagination, Row, Col, InputGroup, FormControl, Badge, Modal, FormSelect
} from 'react-bootstrap';
import { FaPlus, FaEye, FaEdit, FaFilter, FaTasks, FaNewspaper } from 'react-icons/fa'; // Thêm FaNewspaper
import { getMyResearchList, getAllLinhVuc, getAllTrangThaiDeTaiForLecturer } from '../../api/lecturerApi';
import { useAuth } from '../../hooks/useAuth';

// Các helper functions này bạn nên đưa vào một file utils, ví dụ: src/utils/helpers.js
const getTrangThaiBadge = (statusName) => {
    const lowerStatus = statusName?.toLowerCase() || '';
    if (lowerStatus.includes('đang thực hiện')) return 'primary';
    if (lowerStatus.includes('hoàn thành') && !lowerStatus.includes('nghiệm thu')) return 'info';
    if (lowerStatus.includes('nghiệm thu')) return 'success';
    if (lowerStatus.includes('trễ') || lowerStatus.includes('quá hạn')) return 'danger';
    if (lowerStatus.includes('tạm dừng')) return 'warning';
    if (lowerStatus.includes('chờ duyệt') || lowerStatus.includes('đề xuất')) return 'secondary';
    if (lowerStatus.includes('từ chối') || lowerStatus.includes('yêu cầu chỉnh sửa')) return 'dark';
    return 'light';
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('vi-VN'); } catch (e) { return 'Invalid Date'; }
};

// Modal xem chi tiết (tương tự ResearchDetailsModal của admin, bạn có thể tùy chỉnh)
const LecturerResearchDetailsModal = ({ show, onHide, project }) => {
    if (!project) return null;
    const chuNhiem = project.giang_vien_tham_gia?.find(gv => gv.pivot?.vai_tro_id === 1);
    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton><Modal.Title>Chi tiết: {project.ten_de_tai || 'N/A'}</Modal.Title></Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <p><strong>Mã đề tài:</strong> {project.ma_de_tai || 'N/A'}</p>
                <p><strong>Tên đề tài:</strong> {project.ten_de_tai || 'N/A'}</p>
                <p><strong>Chủ nhiệm:</strong> {chuNhiem?.ho_ten || 'N/A'} ({chuNhiem?.msvc || 'N/A'})</p>
                <p><strong>Lĩnh vực:</strong> {project.linh_vuc_nghien_cuu?.ten || 'N/A'}</p>
                <p><strong>Cấp nhiệm vụ:</strong> {project.cap_nhiem_vu?.ten || 'N/A'}</p>
                <p><strong>Trạng thái:</strong> <Badge bg={getTrangThaiBadge(project.trang_thai?.ten_hien_thi)}>{project.trang_thai?.ten_hien_thi || 'N/A'}</Badge></p>
                <p><strong>Thời gian BĐ dự kiến:</strong> {formatDate(project.ngay_bat_dau_dukien)}</p>
                <p><strong>Thời gian KT dự kiến:</strong> {formatDate(project.ngay_ket_thuc_dukien)}</p>
                {project.thoi_gian_duyet && <p><strong>Thời gian duyệt:</strong> {formatDate(project.thoi_gian_duyet)}</p>}
                {project.ly_do_tu_choi && <p className="text-danger"><strong>Lý do từ chối/Yêu cầu chỉnh sửa:</strong> {project.ly_do_tu_choi}</p>}
                <hr />
                <h5>Thành viên tham gia:</h5>
                {project.giang_vien_tham_gia && project.giang_vien_tham_gia.length > 0 ? (
                    <ul>{project.giang_vien_tham_gia.map(gv => (<li key={gv.id}>{gv.ho_ten} ({gv.msvc}) - {gv.pivot?.vai_tro_id === 1 ? 'Chủ nhiệm' : 'Thành viên'}</li>))}</ul>
                ) : <p>Không có thành viên.</p>}
                <hr />
                <h5>Tiến độ đề tài:</h5>
                {project.tien_do && project.tien_do.length > 0 ? (
                    <Table striped bordered size="sm" className="mt-2">
                        <thead><tr><th>Mốc tiến độ</th><th>Mô tả (Đề tài)</th><th>Trạng thái</th><th>Cập nhật lúc</th></tr></thead>
                        <tbody>
                            {project.tien_do.map(td => (
                                <tr key={td.id}>
                                    <td>{td.ten_moc || 'N/A'} <small className="d-block text-muted">{td.tien_do_description || ''}</small></td>
                                    <td>{td.pivot?.mo_ta || 'Chưa cập nhật'}</td>
                                    <td>{td.pivot?.is_present ? 'Hiện tai':''}</td>
                                    <td>{td.pivot?.created_at ? formatDate(td.pivot.created_at) : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : <p>Chưa có thông tin tiến độ.</p>}
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={onHide}>Đóng</Button></Modal.Footer>
        </Modal>
    );
};

const MyResearchPage = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const {
        data: researches, loading: isLoading, error: fetchError, currentPage, paginationData,
        goToPage, refetch: refetchResearches, updateFilters, queryParams
    } = usePagination(getMyResearchList, { lecturer_id: currentUser?.id }); // Luôn gửi ID giảng viên

    const [searchTerm, setSearchTerm] = useState(queryParams?.search_keyword || '');
    const [selectedLinhVuc, setSelectedLinhVuc] = useState(queryParams?.lvnc_id || '');
    const [selectedTrangThai, setSelectedTrangThai] = useState(queryParams?.trang_thai_id || '');
    const [linhVucOptions, setLinhVucOptions] = useState([]);
    const [trangThaiOptions, setTrangThaiOptions] = useState([]);
    const [isLoadingFilters, setIsLoadingFilters] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedResearchForDetails, setSelectedResearchForDetails] = useState(null);
    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        const fetchOptions = async () => {
            setIsLoadingFilters(true);
            try {
                const [lvRes, ttRes] = await Promise.all([getAllLinhVuc(), getAllTrangThaiDeTaiForLecturer()]);
                setLinhVucOptions(lvRes.data || []);
                setTrangThaiOptions(ttRes.data || []);
            } catch (err) { console.error("Error fetching filter options for lecturer:", err); }
            finally { setIsLoadingFilters(false); }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        const timerId = setTimeout(() => {
            if (typeof updateFilters === 'function') {
                updateFilters({
                    search_keyword: searchTerm.trim(), lvnc_id: selectedLinhVuc,
                    trang_thai_id: selectedTrangThai, lecturer_id: currentUser?.id
                });
            }
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm, selectedLinhVuc, selectedTrangThai, updateFilters, currentUser?.id]);

    const handleViewDetails = (research) => { setSelectedResearchForDetails(research); setShowDetailsModal(true); };

    const handleEditResearch = (research) => {
        // Chỉ cho phép sửa nếu đề tài ở trạng thái "Chờ duyệt" (id=1)
        // Đảm bảo rằng research.trang_thai.id là đường dẫn chính xác đến ID trạng thái
        if (research.trang_thai?.id === 1) {
            navigate(`/lecturer/researches/edit/${research.id}`);
        } else {
            setActionError("Chỉ có thể sửa đề tài đang ở trạng thái 'Chờ duyệt'.");
            setTimeout(() => setActionError(null), 5000);
        }
    };

    const renderPaginationItems = () => { // Tương tự trang admin
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
        <Container fluid className="my-research-page p-4">
            <Row className="mb-3 align-items-center">
                <Col> <h1 className="h3">Đề tài NCKH của tôi</h1> </Col>
                <Col xs="auto"><Button as={Link} to="/lecturer/researches/register" variant="primary"><FaPlus className="me-1" /> Đăng ký mới</Button></Col>
            </Row>
            {actionError && <Alert variant="danger" onClose={() => setActionError(null)} dismissible>{actionError}</Alert>}
            <Card className="mb-4 shadow-sm">
                <Card.Header><FaFilter className="me-1" /> Bộ lọc</Card.Header>
                <Card.Body><Row className="g-3">
                    <Col md={4}><InputGroup><FormControl placeholder="Tìm tên, mã đề tài..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={isLoading}/></InputGroup></Col>
                    <Col md={4}><FormSelect value={selectedLinhVuc} onChange={(e) => setSelectedLinhVuc(e.target.value)} disabled={isLoadingFilters || isLoading}><option value="">-- Lĩnh vực --</option>{linhVucOptions.map(lv => <option key={lv.id} value={lv.id}>{lv.ten}</option>)}</FormSelect></Col>
                    <Col md={4}><FormSelect value={selectedTrangThai} onChange={(e) => setSelectedTrangThai(e.target.value)} disabled={isLoadingFilters || isLoading}><option value="">-- Trạng thái --</option>{trangThaiOptions.map(tt => <option key={tt.id} value={tt.id}>{tt.ten_hien_thi}</option>)}</FormSelect></Col>
                </Row></Card.Body>
            </Card>
            <Card className="shadow mb-4 border-0">
                <Card.Header className="py-3 bg-light text-primary d-flex justify-content-between align-items-center">
                    <h6 className="m-0 fw-bold"><FaTasks className="me-2"/>Danh sách đề tài</h6>
                    {paginationData && <small className="text-muted">Hiển thị {paginationData.from}-{paginationData.to} / {paginationData.total}</small>}
                </Card.Header>
                <Card.Body className="p-0">
                    {isLoading && !researches.length ? (<div className="text-center p-5"><Spinner animation="border" /><p>Đang tải...</p></div>)
                    : fetchError ? (<Alert variant="danger" className="m-3">Lỗi: {fetchError.message || 'Không thể kết nối'}</Alert>)
                    : !researches || researches.length === 0 ? (<Alert variant="info" className="m-3">Không có đề tài nào.</Alert>)
                    : (<Table striped bordered hover responsive="lg" className="align-middle mb-0">
                        <thead><tr>
                            <th className="ps-3" style={{width: '5%'}}>#</th><th style={{width: '30%'}}>Tên đề tài</th>
                            <th style={{width: '15%'}}>Lĩnh vực</th><th style={{width: '15%'}}>Cấp NV</th>
                            <th style={{width: '10%'}} className="text-center">Ngày ĐK</th><th style={{width: '10%'}} className="text-center">Trạng thái</th>
                            <th style={{width: '15%'}} className="text-center pe-3">Hành động</th>
                        </tr></thead>
                        <tbody>{researches.map((r, idx) => (
                            <tr key={r.id || r.ma_de_tai}>
                                <td className="ps-3">{paginationData.from + idx}</td>
                                <td>{r.ten_de_tai || 'N/A'}{r.ma_de_tai && <small className="d-block text-muted">Mã: {r.ma_de_tai}</small>}</td>
                                <td>{r.linh_vuc_nghien_cuu?.ten || 'N/A'}</td><td>{r.cap_nhiem_vu?.ten || 'N/A'}</td>
                                <td className="text-center">{formatDate(r.created_at)}</td>
                                <td className="text-center"><Badge bg={getTrangThaiBadge(r.trang_thai?.ten_hien_thi)}>{r.trang_thai?.ten_hien_thi || 'N/A'}</Badge></td>
                                <td className="text-center pe-3">
                                    <Button variant="outline-info" size="sm" className="me-1" onClick={() => handleViewDetails(r)} title="Xem"><FaEye /></Button>
                                    {/*
                                        Điều kiện chỉnh sửa:
                                        Chỉ cho phép sửa nếu đề tài ở trạng thái "Chờ duyệt" (id=1).
                                        Giả định r.trang_thai.id là ID của trạng thái.
                                        // ID trạng thái "Chờ duyệt" là 1, "Từ chối" là 4 (dựa trên danh sách cung cấp)
                                    */}
                                   {r.trang_thai?.id == 1 && ( // Sử dụng so sánh lỏng ==
                                        <Button variant="outline-warning" size="sm" className="me-1" onClick={() => handleEditResearch(r)} title="Sửa"><FaEdit /></Button>
                                    )}
                                    {/* Nút Khai báo bài báo: Hiển thị nếu không phải "Chờ duyệt" (1) và không phải "Từ chối" (4) */}
                                    {r.trang_thai?.id == 3 && ( // Cập nhật ID trạng thái "Từ chối" thành 4
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            onClick={() => navigate(`/lecturer/researches/${r.id}/articles/declare`)}
                                            title="Khai báo bài báo"
                                        ><FaNewspaper /></Button>
                                    )}
                                </td>
                            </tr>))}
                        </tbody></Table>
                    )}
                    {!isLoading && paginationData && paginationData.last_page > 1 && (<div className="d-flex justify-content-center mt-4 mb-3"><Pagination>{renderPaginationItems()}</Pagination></div>)}
                </Card.Body>
            </Card>
            {selectedResearchForDetails && <LecturerResearchDetailsModal show={showDetailsModal} onHide={() => { setShowDetailsModal(false); setSelectedResearchForDetails(null); }} project={selectedResearchForDetails} />}
        </Container>
    );
};
export default MyResearchPage;
