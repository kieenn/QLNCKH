import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Card, Table, Button, Spinner, Alert, Row, Col, InputGroup, FormControl, Pagination,
    Modal, Form, Tooltip, OverlayTrigger, ButtonGroup
} from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTags } from 'react-icons/fa'; // Icon cho Lĩnh vực
import apiClient from '../../api/axiosConfig'; // Import API client
// Import các hàm API cho Lĩnh vực nghiên cứu
import { getResearchFieldsPaginated, createResearchField, updateResearchField, deleteResearchField } from '../../api/adminApi';
import usePagination from '../../hooks/usePagination'; // Import hook pagination

// --- Component Modal Thêm/Sửa Lĩnh vực nghiên cứu ---
const ResearchFieldFormModal = ({ show, onHide, onSave, field, isEditing = false }) => {
    const [formData, setFormData] = useState({ ten: '' }); // Chỉ có trường 'ten'
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Load data vào form khi sửa hoặc reset khi thêm mới
    useEffect(() => {
        if (show) {
            if (isEditing && field) {
                setFormData({
                    ten: field.ten || ''
                });
            } else {
                // Reset form cho thêm mới
                setFormData({ ten: '' });
            }
            setError(null);
            setValidationErrors({});
        }
    }, [show, field, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.ten.trim()) errors.ten = "Tên lĩnh vực không được để trống.";
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        setError(null);
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        try {
            // Chỉ gửi dữ liệu 'ten'
            await onSave({ ten: formData.ten });
            onHide();
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Lỗi không xác định khi lưu.";
            setError(errorMessage);
            if (err.response?.data?.errors) {
                const backendErrors = {};
                for (const fieldKey in err.response.data.errors) {
                    backendErrors[fieldKey] = err.response.data.errors[fieldKey].join(' ');
                }
                setValidationErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} backdrop="static" centered>
            <Modal.Header closeButton>
                <Modal.Title>{isEditing ? 'Sửa Lĩnh vực nghiên cứu' : 'Thêm Lĩnh vực nghiên cứu mới'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form noValidate>
                    <Form.Group className="mb-3" controlId="fieldName">
                        <Form.Label>Tên Lĩnh vực <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            name="ten"
                            value={formData.ten}
                            onChange={handleChange}
                            required
                            isInvalid={!!validationErrors.ten}
                            disabled={isSaving}
                            autoFocus // Tự động focus vào trường này khi modal mở
                        />
                        <Form.Control.Feedback type="invalid">{validationErrors.ten}</Form.Control.Feedback>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isSaving}>Hủy</Button>
                <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <><Spinner as="span" size="sm" className="me-2"/> Đang lưu...</> : 'Lưu'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// --- Component Trang Quản Lý Lĩnh vực nghiên cứu ---
const ManageResearchFieldsPage = () => {
    // Sử dụng hook pagination với endpoint của Lĩnh vực nghiên cứu
    const {
        data: fields, // Đổi tên data cho phù hợp
        loading: isLoading,
        error: fetchError,
        currentPage,
        paginationData,
        goToPage,
        refetch: refetchFields,
        updateFilters,
        queryParams
    } = usePagination('/api/admin/getLinhVucNghienCuu'); // Endpoint phân trang Lĩnh vực

    const [searchTerm, setSearchTerm] = useState(queryParams?.search || '');

    // State cho modals và actions
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState('');
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [fieldToEdit, setFieldToEdit] = useState(null);
    const [fieldToDelete, setFieldToDelete] = useState(null);

    // Hàm fetch dữ liệu (gọi refetch từ hook)
    const fetchFields = useCallback(() => {
        setActionError(null);
        refetchFields();
    }, [refetchFields]);

    // useEffect để cập nhật bộ lọc (debounce)
    useEffect(() => {
        const timerId = setTimeout(() => {
            if (searchTerm.trim() !== (queryParams?.search || '')) {
                 updateFilters({ search: searchTerm.trim() }); // Chỉ có search
            }
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm, updateFilters, queryParams]);

    // --- Handlers for Modals and Actions ---
    const handleAddClick = () => {
        setFieldToEdit(null);
        setShowAddEditModal(true);
        setActionError(null);
        setActionSuccess('');
    };

    const handleEditClick = (field) => {
        if (!field || !field.id) {
            setActionError("Dữ liệu lĩnh vực không hợp lệ để sửa.");
            return;
        }
        setFieldToEdit(field);
        setShowAddEditModal(true);
        setActionError(null);
        setActionSuccess('');
    };

    const handleDeleteClick = (field) => {
         if (!field || !field.id) {
            setActionError("Dữ liệu lĩnh vực không hợp lệ để xóa.");
            return;
        }
        // Không cần kiểm tra con vì lĩnh vực không có cấu trúc cha-con
        setFieldToDelete(field);
        setShowDeleteConfirm(true);
        setActionError(null);
        setActionSuccess('');
    };

    const handleSaveField = async (fieldData) => {
        try {
            let response;
            if (fieldToEdit) {
                response = await updateResearchField(fieldToEdit.id, fieldData);
                setActionSuccess(`Đã cập nhật lĩnh vực "${response.ten || fieldData.ten}" thành công.`);
            } else {
                response = await createResearchField(fieldData);
                setActionSuccess(`Đã thêm lĩnh vực "${response.ten || fieldData.ten}" thành công.`);
            }
            setShowAddEditModal(false);
            fetchFields(); // Tải lại bảng
        } catch (err) {
            console.error("Error saving research field:", err);
            throw err; // Ném lỗi để modal hiển thị
        }
    };

    const confirmDeleteField = async () => {
        if (!fieldToDelete || !fieldToDelete.id) return;

        try {
            await deleteResearchField(fieldToDelete.id);
            setActionSuccess(`Đã xóa lĩnh vực "${fieldToDelete.ten}" thành công.`);
            fetchFields(); // Tải lại bảng
        } catch (err) {
            console.error("Error deleting research field:", err);
            setActionError(`Lỗi khi xóa lĩnh vực: ${err.response?.data?.message || err.message}`);
        } finally {
            setShowDeleteConfirm(false);
            setFieldToDelete(null);
        }
    };

    // Hàm render tooltip
    const renderTooltip = (props, text) => (
        <Tooltip id={`tooltip-${text.toLowerCase().replace(/\s+/g, '-')}`} {...props}>
            {text}
        </Tooltip>
    );

    // Hàm render các nút phân trang (giống các trang khác)
    const renderPaginationItems = () => {
        if (!paginationData || paginationData.last_page <= 1) return null;
        const items = [];
        const { links } = paginationData;
        if (links) {
            links.forEach((link, index) => {
                if (link.url === null) {
                    if (link.label.includes('Previous')) items.push(<Pagination.Prev key={`link-${index}`} disabled />);
                    else if (link.label.includes('Next')) items.push(<Pagination.Next key={`link-${index}`} disabled />);
                    else items.push(<Pagination.Item key={`link-${index}`} disabled>{link.label}</Pagination.Item>);
                } else if (link.active) {
                    items.push(<Pagination.Item key={`link-${index}`} active>{link.label}</Pagination.Item>);
                } else if (link.label.includes('Previous')) {
                    const pageNumber = new URL(link.url).searchParams.get('page');
                    items.push(<Pagination.Prev key={`link-${index}`} onClick={() => goToPage(pageNumber)} />);
                } else if (link.label.includes('Next')) {
                    const pageNumber = new URL(link.url).searchParams.get('page');
                    items.push(<Pagination.Next key={`link-${index}`} onClick={() => goToPage(pageNumber)} />);
                } else {
                    const pageNumber = new URL(link.url).searchParams.get('page');
                    if (link.label === '...') items.push(<Pagination.Ellipsis key={`link-${index}`} />);
                    else items.push(<Pagination.Item key={`link-${index}`} onClick={() => goToPage(pageNumber)}>{link.label}</Pagination.Item>);
                }
            });
        }
        return items;
    };

    // --- JSX Render ---
    return (
        <Container fluid className="manage-research-fields-page p-4">
            <Row className="mb-3 align-items-center">
                <Col> <h1 className="h3">Quản lý Lĩnh vực nghiên cứu</h1> </Col>
            </Row>

            {actionError && <Alert variant="danger" onClose={() => setActionError(null)} dismissible>{actionError}</Alert>}
            {actionSuccess && <Alert variant="success" onClose={() => setActionSuccess('')} dismissible>{actionSuccess}</Alert>}

            {/* Thanh tìm kiếm */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col> {/* Điều chỉnh độ rộng nếu cần */}
                            <InputGroup className="input-group-lg"> {/* Thử làm input lớn hơn */}
                                 <FormControl
                                    placeholder="Tìm theo tên lĩnh vực..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    aria-label="Tìm kiếm lĩnh vực nghiên cứu"
                                />
                                <Button variant="outline-secondary" disabled={isLoading}>
                                    <FaSearch />
                                </Button>
                            </InputGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Bảng dữ liệu */}
            <Card className="shadow mb-4 border-0">
                <Card.Header className="py-3 bg-light d-flex justify-content-between align-items-center">
                    <h6 className="m-0 fw-bold text-primary">Danh sách Lĩnh vực nghiên cứu</h6>
                    <Button variant="primary" size="sm" onClick={handleAddClick}>
                        <FaPlus className="me-1" /> Thêm Lĩnh vực
                    </Button>
                </Card.Header>
                <Card.Body className="p-0">
                    {isLoading ? (
                        <div className="text-center p-5"><Spinner animation="border" variant="primary" /><p>Đang tải...</p></div>
                    ) : fetchError ? (
                        <Alert variant="warning" className="m-3">Lỗi tải danh sách: {fetchError.message || 'Lỗi không xác định'}</Alert>
                    ) : fields.length === 0 ? (
                        <Alert variant="info" className="m-3">{queryParams?.search ? 'Không tìm thấy lĩnh vực nào khớp.' : 'Chưa có lĩnh vực nghiên cứu nào.'}</Alert>
                    ) : (
                        <Table striped bordered hover responsive="sm" className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-3" style={{ width: '10%' }}>ID</th>
                                    <th style={{ width: '75%' }}>Tên Lĩnh vực</th>
                                    <th style={{ width: '15%' }} className="text-center pe-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((field) => (
                                    <tr key={field.id}>
                                        <td className="ps-3">{field.id}</td>
                                        <td>{field.ten}</td>
                                        <td className="text-center pe-3">
                                            <ButtonGroup size="sm">
                                                <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Sửa')}>
                                                    <Button variant="link" className="text-info p-1" onClick={() => handleEditClick(field)}> <FaEdit size={16}/> </Button>
                                                </OverlayTrigger>
                                                <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Xóa')}>
                                                    <Button variant="link" className="text-danger p-1" onClick={() => handleDeleteClick(field)}> <FaTrash size={16}/> </Button>
                                                </OverlayTrigger>
                                            </ButtonGroup>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {/* Hiển thị phân trang */}
                    {!isLoading && !fetchError && paginationData && paginationData.last_page > 1 && (
                        <div className="d-flex justify-content-center mt-4 mb-3">
                            <Pagination>{renderPaginationItems()}</Pagination>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* --- Render Modals --- */}

            {/* Modal Thêm/Sửa */}
            {showAddEditModal && (
                <ResearchFieldFormModal
                    show={showAddEditModal}
                    onHide={() => setShowAddEditModal(false)}
                    onSave={handleSaveField}
                    field={fieldToEdit}
                    isEditing={!!fieldToEdit}
                />
            )}

            {/* Modal Xác nhận Xóa */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
                 <Modal.Header closeButton> <Modal.Title>Xác nhận Xóa</Modal.Title> </Modal.Header>
                 <Modal.Body>Bạn có chắc chắn muốn xóa lĩnh vực <strong>{fieldToDelete?.ten}</strong>?</Modal.Body>
                 <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Hủy</Button>
                    <Button variant="danger" onClick={confirmDeleteField}>Xóa</Button>
                 </Modal.Footer>
            </Modal>

        </Container>
    );
};

export default ManageResearchFieldsPage;