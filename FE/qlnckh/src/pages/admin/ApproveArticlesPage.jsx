import React, { useState, useEffect } from 'react';
import {
    Container, Card, Table, Button, Spinner, Alert, Pagination, Row, Col, InputGroup, FormControl,
    Modal, Badge, Form, ButtonGroup, ListGroup
} from 'react-bootstrap';
import { FaEye, FaCheckCircle, FaTimesCircle, FaFilter, FaFileAlt, FaDownload, FaSyncAlt } from 'react-icons/fa';
import usePagination from '../../hooks/usePagination';
// Giả sử bạn sẽ tạo các hàm API này trong adminApi.js
import {
    getPendingArticles,
    getArticleDetailsForAdmin, // Lấy chi tiết bài báo (bao gồm file)
    approveArticleByAdmin,
    rejectArticleByAdmin
} from '../../api/adminApi';
import { fetchCsrfToken } from '../../api/axiosConfig';
// import { initPusher, subscribeToAdminNotifications, unsubscribeFromAdminNotifications } from '../../services/pusherService'; // Xóa import này
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) { return 'Invalid Date'; }
};

// CSS for text truncation with tooltip
const truncateStyle = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '250px', // Adjust this width as needed for your layout
    display: 'inline-block', // Important for ellipsis to work with maxWidth
    verticalAlign: 'middle' // Aligns text nicely if it's shorter than the cell height
};

const ArticleDetailsModal = ({ show, onHide, article, onAction }) => {
    if (!article) return null;
    // Access environment variable using process.env for Create React App
    const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

    const getFileName = (filePath) => {
        if (!filePath) return 'file';
        return filePath.split('/').pop();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title as="h5">Chi tiết Bài báo: {article.ten_bai_bao}</Modal.Title>
                {article.trang_thai && (
                    <Badge pill bg={article.trang_thai === 'đã duyệt' ? 'success' : article.trang_thai === 'bị từ chối' ? 'danger' : 'warning'} className="ms-3">
                        {article.trang_thai.charAt(0).toUpperCase() + article.trang_thai.slice(1)}
                    </Badge>
                )}
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Row className="mb-3">
                    <Col md={6}>
                        <p className="mb-1"><strong>Tên bài báo:</strong></p>
                        <p className="text-muted">{article.ten_bai_bao}</p>
                    </Col>
                    <Col md={6}>
                        <p className="mb-1"><strong>Ngày xuất bản:</strong></p>
                        <p className="text-muted">{formatDate(article.ngay_xuat_ban)}</p>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col md={6}>
                        <p className="mb-1"><strong>Đề tài liên quan:</strong></p>
                        <p className="text-muted">{article.de_tai?.ten_de_tai || 'N/A'} (Mã: {article.de_tai?.ma_de_tai || article.de_tai_id})</p>
                    </Col>
                    <Col md={6}>
                        <p className="mb-1"><strong>Giảng viên khai báo:</strong></p>
                        <p className="text-muted">{article.nguoi_nop?.ho_ten || 'N/A'} (MSVC: {article.nguoi_nop?.msvc || 'N/A'})</p>
                    </Col>
                </Row>

                {article.admin_xet_duyet && (
                    <Row className="mb-3">
                        <Col md={12}>
                            <p className="mb-1"><strong>Người duyệt:</strong></p>
                            <p className="text-muted">{article.admin_xet_duyet.ho_ten || 'N/A'} (MSVC: {article.admin_xet_duyet.msvc || 'N/A'})</p>
                        </Col>
                    </Row>
                )}


                <h6 className="text-primary mt-4 mb-2">Mô tả bài báo:</h6>
                <Card body className="bg-light mb-3">
                    <div style={{ whiteSpace: 'pre-wrap' }}>{article.mo_ta_bai_bao || article.mo_ta || 'Không có mô tả.'}</div>
                </Card>

                <h6 className="text-primary mt-4 mb-2">File đính kèm:</h6>
                {article.tai_lieu && article.tai_lieu.length > 0 ? (
                    <ListGroup variant="flush">
                        {article.tai_lieu.map(doc => {
                            const fileName = getFileName(doc.file_path);
                            // Assuming files are served from Laravel's public storage
                            const fileUrl = `${API_URL}/storage/${doc.file_path}`;
                            return (
                                <ListGroup.Item key={doc.id} className="d-flex justify-content-between align-items-center ps-1 pe-1 pt-2 pb-2">
                                    <div>
                                        <FaFileAlt className="me-2 text-secondary" />
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" title={`Tải ${fileName}`}>
                                            {fileName}
                                        </a>
                                        {doc.mo_ta && <small className="d-block text-muted fst-italic ms-4">Mô tả: {doc.mo_ta}</small>}
                                    </div>
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                        <FaDownload className="me-1" /> Tải
                                    </a>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                ) : <p className="text-muted">Không có file đính kèm.</p>}

                {(article.nhan_xet || article.ly_do_tu_choi || (article.admin_xet_duyet && article.trang_thai === 'bị từ chối')) && (
                    <>
                        <h6 className="text-danger mt-4 mb-2">Lý do từ chối / Nhận xét:</h6>
                        <Card body className="bg-light border-danger">
                            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{article.nhan_xet || article.ly_do_tu_choi}</p>
                        </Card>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Đóng</Button>
                {article.trang_thai === 'chờ duyệt' && ( // Chỉ hiển thị nút nếu đang chờ duyệt (khớp với DB)
                    <>
                        <Button variant="danger" onClick={() => onAction('reject', article)}>
                            <FaTimesCircle className="me-1" /> Từ chối
                        </Button>
                        <Button variant="success" onClick={() => onAction('approve', article)}>
                            <FaCheckCircle className="me-1" /> Duyệt
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};

const ActionModal = ({ show, onHide, article, actionType, onSubmit, isLoading }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!show) setReason('');
    }, [show]);

    const handleSubmit = () => {
        if (actionType === 'reject' && !reason.trim()) {
            alert("Vui lòng nhập lý do từ chối.");
            return;
        }
        onSubmit(article.id, actionType === 'reject' ? { ly_do_tu_choi: reason } : {});
    };

    if (!article) return null;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title as="h5">
                    {actionType === 'approve' ? 'Xác nhận Duyệt Bài báo' : 'Xác nhận Từ chối Bài báo'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Bạn có chắc chắn muốn <strong>{actionType === 'approve' ? 'duyệt' : 'từ chối'}</strong> bài báo:</p>
                <p><strong>"{article.ten_bai_bao}"</strong>?</p>
                {actionType === 'reject' && (
                    <Form.Group controlId="rejectionReason">
                        <Form.Label>Lý do từ chối <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do từ chối..."
                            disabled={isLoading}
                        />
                    </Form.Group>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isLoading}>Hủy</Button>
                <Button
                    variant={actionType === 'approve' ? "success" : "danger"}
                    onClick={handleSubmit}
                    disabled={isLoading || (actionType === 'reject' && !reason.trim())}
                >
                    {isLoading ? <Spinner size="sm" /> : (actionType === 'approve' ? 'Duyệt' : 'Từ chối')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

const ApproveArticlesPage = () => {
    const {
        data: articles, loading: isLoadingArticles, error: fetchError,
        goToPage, refetch: refetchArticles, updateFilters, queryParams, paginationData
    } = usePagination(getPendingArticles); // Backend sẽ tự xử lý lấy bài báo chờ duyệt

    const [searchTerm, setSearchTerm] = useState(queryParams?.search_keyword || '');
    // Thêm các state cho bộ lọc khác nếu cần (ví dụ: giảng viên, đề tài)

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [actionAlert, setActionAlert] = useState({ show: false, variant: '', message: '' });

    useEffect(() => {
        const timerId = setTimeout(() => {
            updateFilters({ search_keyword: searchTerm.trim() });
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm, updateFilters]);

    const handleViewDetails = async (articleId) => {
        try {
            // Gọi API lấy chi tiết bài báo, bao gồm cả file
            const response = await getArticleDetailsForAdmin(articleId); // response is assumed to be an Axios response object.
            setSelectedArticle(response.data); 
            setShowDetailsModal(true);
        } catch (err) {
            console.error("Error fetching article details:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Lỗi tải chi tiết bài báo.';
            setActionAlert({ show: true, variant: 'danger', message: errorMessage });
        }
    };

    const handleOpenActionModal = (type, article) => {
        setSelectedArticle(article);
        setActionType(type);
        setShowActionModal(true);
        setShowDetailsModal(false); // Đóng modal chi tiết nếu đang mở
    };

    const handleSubmitAction = async (articleId, data) => {
        setIsSubmittingAction(true);
        setActionAlert({ show: false, variant: '', message: '' });
        try {
            await fetchCsrfToken();
            let response;
            if (actionType === 'approve') {
                response = await approveArticleByAdmin(articleId, data);
            } else {
                response = await rejectArticleByAdmin(articleId, data);
            }
            setActionAlert({ show: true, variant: 'success', message: response.data.message || 'Thao tác thành công!' });
            setShowActionModal(false);
            refetchArticles();
        } catch (err) {
            setActionAlert({ show: true, variant: 'danger', message: err.response?.data?.message || 'Thao tác thất bại.' });
        } finally {
            setIsSubmittingAction(false);
        }
    };

    const renderPaginationItems = () => {
        if (!paginationData || paginationData.last_page <= 1) return null;
        const items = [];
        paginationData.links.forEach((link, index) => {
            if (link.url === null) items.push(<Pagination.Item key={`link-${index}`} disabled><span dangerouslySetInnerHTML={{ __html: link.label }} /></Pagination.Item>);
            else if (link.active) items.push(<Pagination.Item key={`link-${index}`} active>{link.label}</Pagination.Item>);
            else {
                const pageNum = new URLSearchParams(new URL(link.url).search).get('page');
                items.push(<Pagination.Item key={`link-${index}`} onClick={() => goToPage(pageNum)} disabled={isLoadingArticles}><span dangerouslySetInnerHTML={{ __html: link.label }} /></Pagination.Item>);
            }
        });
        return items;
    };

    return (
        <Container fluid className="p-4">
            <h1 className="h3 mb-3">Xét duyệt Khai báo Bài báo</h1>

            {actionAlert.show && (
                <Alert variant={actionAlert.variant} onClose={() => setActionAlert({ ...actionAlert, show: false })} dismissible>
                    {actionAlert.message}
                </Alert>
            )}

            <Card className="my-4 shadow-sm"> {/* Added my-4 for vertical margin */}
                <Card.Header className="bg-light py-3">
                    <h6 className="m-0 fw-bold text-primary"><FaFilter className="me-2" />Bộ lọc</h6>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={8} lg={6}> {/* Adjusted column width */}
                            <InputGroup>
                                <FormControl
                                    placeholder="Tìm tên bài báo, tên giảng viên, mã đề tài..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={isLoadingArticles}
                                />
                            </InputGroup>
                        </Col>
                        {/* Thêm các bộ lọc khác nếu cần */}
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4"> {/* Added mb-4 */}
                <Card.Header className="py-3 bg-light text-primary d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <h6 className="m-0 fw-bold">Danh sách Bài báo chờ duyệt</h6>
                        <Button variant="link" size="sm" onClick={() => refetchArticles()} disabled={isLoadingArticles} className="ms-2 p-0" title="Tải lại danh sách">
                            <FaSyncAlt className={isLoadingArticles ? 'fa-spin' : ''} />
                        </Button>
                    </div>
                    {paginationData && <small className="text-muted">Hiển thị {paginationData.from}-{paginationData.to} / {paginationData.total}</small>}
                </Card.Header>
                <Card.Body className="p-0">
                    {isLoadingArticles && !articles.length ? (
                        <div className="text-center p-5"><Spinner animation="border" /><p>Đang tải...</p></div>
                    ) : fetchError ? (
                        <Alert variant="danger" className="m-3">Lỗi: {fetchError.message || 'Không thể tải danh sách bài báo.'}</Alert>
                    ) : !articles || articles.length === 0 ? (
                        <Alert variant="info" className="m-3">Không có bài báo nào đang chờ duyệt.</Alert>
                    ) : (
                        <Table striped bordered hover responsive="lg" className="align-middle mb-0">
                            <thead>
                                <tr>
                                    <th className="ps-3" style={{ width: '5%' }}>#</th>
                                    <th style={{ width: '30%' }}>Tên bài báo</th>
                                    <th style={{ width: '20%' }}>Đề tài liên quan</th>
                                    <th style={{ width: '15%' }}>Người khai báo</th>
                                    <th style={{ width: '10%' }} className="text-center">Ngày khai báo</th>
                                    <th style={{ width: '10%' }} className="text-center">Trạng thái</th>
                                    <th style={{ width: '10%' }} className="text-center pe-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.map((article, idx) => (
                                    <tr key={article.id}>
                                        <td className="ps-3">{paginationData.from + idx}</td>
                                        <td>
                                            <div style={truncateStyle} title={article.ten_bai_bao}>
                                                {article.ten_bai_bao}
                                            </div>
                                        </td>
                                        <td>{article.de_tai?.ten_de_tai || 'N/A'} ({article.de_tai?.ma_de_tai || 'N/A'})</td>
                                        <td>{article.nguoi_nop?.ho_ten || 'N/A'}</td>
                                        <td className="text-center">{formatDate(article.created_at)}</td>
                                        <td className="text-center">
                                            <Badge pill bg={
                                                article.trang_thai === 'đã duyệt' ? 'success'
                                                    : article.trang_thai === 'bị từ chối' ? 'danger'
                                                        : 'warning' // Mặc định cho 'chờ duyệt' hoặc các trạng thái khác
                                            }>
                                                {article.trang_thai ? (article.trang_thai.charAt(0).toUpperCase() + article.trang_thai.slice(1)) : 'N/A'}
                                            </Badge>
                                        </td>
                                        <td className="text-center pe-3">
                                            <ButtonGroup>
                                                <Button variant="outline-info" size="sm" onClick={() => handleViewDetails(article.id)} title="Xem chi tiết">
                                                    <FaEye />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleOpenActionModal('reject', article)}
                                                    title={article.trang_thai !== 'chờ duyệt' ? `Bài báo đã ${article.trang_thai}` : "Từ chối"}
                                                    disabled={article.trang_thai !== 'chờ duyệt'}
                                                >
                                                    <FaTimesCircle />
                                                </Button>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => handleOpenActionModal('approve', article)}
                                                    title={article.trang_thai !== 'chờ duyệt' ? `Bài báo đã ${article.trang_thai}` : "Duyệt"}
                                                    disabled={article.trang_thai !== 'chờ duyệt'}
                                                >
                                                    <FaCheckCircle />
                                                </Button>
                                            </ButtonGroup>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {!isLoadingArticles && paginationData && paginationData.last_page > 1 && (
                        <div className="d-flex justify-content-center mt-4 mb-3"><Pagination>{renderPaginationItems()}</Pagination></div>
                    )}
                </Card.Body>
            </Card>

            {selectedArticle && showDetailsModal && (
                <ArticleDetailsModal
                    show={showDetailsModal}
                    onHide={() => { setShowDetailsModal(false); setSelectedArticle(null); }}
                    article={selectedArticle}
                    onAction={handleOpenActionModal}
                />
            )}

            {selectedArticle && showActionModal && (
                <ActionModal
                    show={showActionModal}
                    onHide={() => { setShowActionModal(false); /* Giữ selectedArticle để modal chi tiết có thể mở lại nếu cần */ }}
                    article={selectedArticle}
                    actionType={actionType}
                    onSubmit={handleSubmitAction}
                    isLoading={isSubmittingAction}
                />
            )}
        </Container>
    );
};

export default ApproveArticlesPage;
