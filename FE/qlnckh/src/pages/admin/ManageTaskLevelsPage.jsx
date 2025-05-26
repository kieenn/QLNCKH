import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Card, Table, Button, Spinner, Alert, Row, Col, InputGroup, FormControl, Pagination,
    Modal, Form, Tooltip, OverlayTrigger, ButtonGroup, FormSelect
} from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaLayerGroup } from 'react-icons/fa'; // Icon cho Cấp nhiệm vụ
import apiClient from '../../api/axiosConfig'; // Import API client đã cấu hình
// Import các hàm API cho Cấp nhiệm vụ
import { getAllTaskLevels, getTaskLevelsPaginated, createTaskLevel, updateTaskLevel, deleteTaskLevel } from '../../api/adminApi';
import usePagination from '../../hooks/usePagination'; // Import hook pagination

// --- Component Modal Thêm/Sửa Cấp nhiệm vụ ---
const TaskLevelFormModal = ({ show, onHide, onSave, taskLevel, allTaskLevelsForParentSelect = [], isEditing = false }) => {
    // Thêm kinh_phi vào state
    const [formData, setFormData] = useState({ ten: '', kinh_phi: '', parent_id: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Load data vào form khi sửa hoặc reset khi thêm mới
    useEffect(() => {
        if (show) {
            if (isEditing && taskLevel) {
                setFormData({
                    ten: taskLevel.ten || '',
                    kinh_phi: taskLevel.kinh_phi || '', // Load kinh_phi
                    parent_id: taskLevel.parent_id || ''
                });
            } else {
                // Reset form cho thêm mới
                setFormData({ ten: '', kinh_phi: '', parent_id: '' });
            }
            setError(null);
            setValidationErrors({});
        }
    }, [show, taskLevel, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.ten.trim()) errors.ten = "Tên cấp nhiệm vụ không được để trống.";
        // Validate kinh_phi nếu cần (ví dụ: phải là số không âm)
        if (formData.kinh_phi && isNaN(Number(formData.kinh_phi))) {
             errors.kinh_phi = "Kinh phí phải là một số.";
        } else if (formData.kinh_phi && Number(formData.kinh_phi) < 0) {
             errors.kinh_phi = "Kinh phí không được là số âm.";
        }

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
            const dataToSend = {
                ...formData,
                // Gửi null nếu kinh phí rỗng hoặc parent_id rỗng
                kinh_phi: formData.kinh_phi || null,
                parent_id: formData.parent_id || null
            };
            await onSave(dataToSend);
            onHide();
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Lỗi không xác định khi lưu.";
            setError(errorMessage);
            if (err.response?.data?.errors) {
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

    // Lọc ra các cấp nhiệm vụ không phải là chính nó hoặc con cháu của nó
    const getValidParentOptions = () => {
        if (!isEditing || !taskLevel) return allTaskLevelsForParentSelect;

        const descendantIds = new Set();
        const findDescendants = (parentId) => {
            descendantIds.add(parentId);
            allTaskLevelsForParentSelect.forEach(tl => {
                // Dùng so sánh lỏng lẻo phòng trường hợp kiểu dữ liệu khác nhau
                if (tl.parent_id == parentId) {
                    findDescendants(tl.id);
                }
            });
        };

        if (taskLevel && taskLevel.id) {
             findDescendants(taskLevel.id);
        }

        return allTaskLevelsForParentSelect.filter(tl => !descendantIds.has(tl.id));
    };

    const validParentOptions = getValidParentOptions();

    return (
        <Modal show={show} onHide={onHide} backdrop="static" centered>
            <Modal.Header closeButton>
                <Modal.Title>{isEditing ? 'Sửa Cấp nhiệm vụ' : 'Thêm Cấp nhiệm vụ mới'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form noValidate>
                    <Form.Group className="mb-3" controlId="taskLevelTen">
                        <Form.Label>Tên Cấp nhiệm vụ <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            name="ten"
                            value={formData.ten}
                            onChange={handleChange}
                            required
                            isInvalid={!!validationErrors.ten}
                            disabled={isSaving}
                        />
                        <Form.Control.Feedback type="invalid">{validationErrors.ten}</Form.Control.Feedback>
                    </Form.Group>

                    {/* Thêm trường Kinh phí */}
                    <Form.Group className="mb-3" controlId="taskLevelKinhPhi">
                        <Form.Label>Kinh phí (Tùy chọn)</Form.Label>
                        <Form.Control
                            type="number" // Sử dụng type number
                            name="kinh_phi"
                            value={formData.kinh_phi}
                            onChange={handleChange}
                            isInvalid={!!validationErrors.kinh_phi}
                            disabled={isSaving}
                            step="any" // Cho phép số thập phân nếu cần
                            min="0" // Ngăn số âm
                        />
                        <Form.Control.Feedback type="invalid">{validationErrors.kinh_phi}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="taskLevelParent">
                        <Form.Label>Cấp nhiệm vụ cha (Tùy chọn)</Form.Label>
                        <FormSelect
                            name="parent_id"
                            value={formData.parent_id}
                            onChange={handleChange}
                            disabled={isSaving || !allTaskLevelsForParentSelect.length}
                        >
                            <option value="">-- Không có cấp cha --</option>
                            {validParentOptions.map(tl => (
                                <option key={tl.id} value={tl.id}>{tl.ten}</option>
                            ))}
                        </FormSelect>
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

// --- Component Trang Quản Lý Cấp nhiệm vụ ---
const ManageTaskLevelsPage = () => {
    // Sử dụng hook pagination với endpoint phân trang của Cấp nhiệm vụ
    const {
        data: taskLevels,
        loading: isLoading,
        error: fetchError,
        currentPage,
        paginationData,
        goToPage,
        refetch: refetchTaskLevels,
        updateFilters,
        queryParams
    } = usePagination('/api/admin/getCapNhiemVu'); // Endpoint phân trang Cấp nhiệm vụ

    const [searchTerm, setSearchTerm] = useState(queryParams?.search || '');
    const [selectedParentId, setSelectedParentId] = useState(queryParams?.parent_id || '');
    const [allTaskLevelsForFilter, setAllTaskLevelsForFilter] = useState([]); // State cho dropdown lọc và tra cứu tên cha
    const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(false);

    // State cho modals và actions
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState('');
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [taskLevelToEdit, setTaskLevelToEdit] = useState(null);
    const [taskLevelToDelete, setTaskLevelToDelete] = useState(null);

    // Hàm fetch dữ liệu (gọi refetch từ hook)
    const fetchTaskLevels = useCallback(() => {
        setActionError(null);
        refetchTaskLevels();
    }, [refetchTaskLevels]);

    // Hàm tải danh sách đầy đủ cho bộ lọc và tra cứu tên
    const fetchAllTaskLevelsForFilter = useCallback(() => {
        setIsLoadingFilterOptions(true);
        getAllTaskLevels() // Gọi API lấy tất cả Cấp nhiệm vụ
            .then(data => {
                setAllTaskLevelsForFilter(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Error fetching task levels for filter:", err);
                setActionError("Lỗi tải danh sách cấp nhiệm vụ cho bộ lọc.");
            })
            .finally(() => {
                setIsLoadingFilterOptions(false);
            });
    }, []);

    // Fetch dữ liệu cho Filter Dropdown khi component mount
    useEffect(() => {
        fetchAllTaskLevelsForFilter();
    }, [fetchAllTaskLevelsForFilter]);

    // useEffect để cập nhật bộ lọc (debounce)
    useEffect(() => {
        const timerId = setTimeout(() => {
            if (searchTerm.trim() !== (queryParams?.search || '') || selectedParentId !== (queryParams?.parent_id || '')) {
                 updateFilters({ search: searchTerm.trim(), parent_id: selectedParentId });
            }
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm, selectedParentId, updateFilters, queryParams]);

    // --- Handlers for Modals and Actions ---
    const handleAddClick = () => {
        setTaskLevelToEdit(null);
        setShowAddEditModal(true);
        setActionError(null);
        setActionSuccess('');
    };

    const handleEditClick = (level) => {
        if (!level || !level.id) {
            setActionError("Dữ liệu cấp nhiệm vụ không hợp lệ để sửa.");
            return;
        }
        setTaskLevelToEdit(level);
        setShowAddEditModal(true);
        setActionError(null);
        setActionSuccess('');
    };

    const handleDeleteClick = (level) => {
         if (!level || !level.id) {
            setActionError("Dữ liệu cấp nhiệm vụ không hợp lệ để xóa.");
            return;
        }
        // Kiểm tra con
        const hasChildren = allTaskLevelsForFilter.some(tl => tl.parent_id == level.id);
        if (hasChildren) {
            setActionError(`Không thể xóa "${level.ten}" vì có cấp nhiệm vụ con.`);
            setTimeout(() => setActionError(null), 5000);
            return;
        }
        setTaskLevelToDelete(level);
        setShowDeleteConfirm(true);
        setActionError(null);
        setActionSuccess('');
    };

    const handleSaveTaskLevel = async (taskLevelData) => {
        try {
            let response;
            if (taskLevelToEdit) {
                response = await updateTaskLevel(taskLevelToEdit.id, taskLevelData);
                setActionSuccess(`Đã cập nhật cấp nhiệm vụ "${response.ten || taskLevelData.ten}" thành công.`);
            } else {
                response = await createTaskLevel(taskLevelData);
                setActionSuccess(`Đã thêm cấp nhiệm vụ "${response.ten || taskLevelData.ten}" thành công.`);
            }
            setShowAddEditModal(false);
            fetchTaskLevels(); // Tải lại bảng
            fetchAllTaskLevelsForFilter(); // Tải lại dropdown
        } catch (err) {
            console.error("Error saving task level:", err);
            throw err; // Ném lỗi để modal hiển thị
        }
    };

    const confirmDeleteTaskLevel = async () => {
        if (!taskLevelToDelete || !taskLevelToDelete.id) return;

        try {
            await deleteTaskLevel(taskLevelToDelete.id);
            setActionSuccess(`Đã xóa cấp nhiệm vụ "${taskLevelToDelete.ten}" thành công.`);
            fetchTaskLevels(); // Tải lại bảng
            fetchAllTaskLevelsForFilter(); // Tải lại dropdown
        } catch (err) {
            console.error("Error deleting task level:", err);
            setActionError(`Lỗi khi xóa cấp nhiệm vụ: ${err.response?.data?.message || err.message}`);
        } finally {
            setShowDeleteConfirm(false);
            setTaskLevelToDelete(null);
        }
    };

    // Hàm hiển thị tên cha (sử dụng parent_ten từ API)
    const renderParentName = (level) => {
        if (!level.parent_id) return '-';
        if (level.parent_ten) return level.parent_ten;
        // Nếu API không trả về parent_ten nhưng có parent_id, thử tìm trong danh sách đầy đủ
        if (!isLoadingFilterOptions) {
            const parent = allTaskLevelsForFilter.find(tl => tl.id == level.parent_id);
            if (parent) return parent.ten;
        }
        return <span className="text-warning fst-italic">Đang tải/Không rõ...</span>;
    };

    // Hàm định dạng kinh phí
    const formatCurrency = (value) => {
        if (value === null || value === undefined || value === '') return '-';
        // Chuyển đổi sang số và định dạng
        const number = Number(value);
        if (isNaN(number)) return '-';
        return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    };

    // Hàm render tooltip
    const renderTooltip = (props, text) => (
        <Tooltip id={`tooltip-${text.toLowerCase().replace(/\s+/g, '-')}`} {...props}>
            {text}
        </Tooltip>
    );

    // Hàm render các nút phân trang (giống ManageUnitsPage)
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
        <Container fluid className="manage-task-levels-page p-4">
            <Row className="mb-3 align-items-center">
                <Col> <h1 className="h3">Quản lý Cấp nhiệm vụ</h1> </Col>
            </Row>

            {actionError && <Alert variant="danger" onClose={() => setActionError(null)} dismissible>{actionError}</Alert>}
            {actionSuccess && <Alert variant="success" onClose={() => setActionSuccess('')} dismissible>{actionSuccess}</Alert>}

            {/* Thanh tìm kiếm và lọc */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                 <FormControl
                                    placeholder="Tìm theo tên cấp nhiệm vụ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <Form.Select
                                value={selectedParentId}
                                onChange={(e) => setSelectedParentId(e.target.value)}
                                disabled={isLoadingFilterOptions || isLoading}
                            >
                                <option value="">-- Tất cả cấp cha --</option>
                                <option value="null">-- Cấp gốc (Không có cha) --</option>
                                {allTaskLevelsForFilter.map(tl => (
                                    <option key={tl.id} value={tl.id}>{tl.ten}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Bảng dữ liệu */}
            <Card className="shadow mb-4 border-0">
                <Card.Header className="py-3 bg-light d-flex justify-content-between align-items-center">
                    <h6 className="m-0 fw-bold text-primary">Danh sách Cấp nhiệm vụ</h6>
                    <Button variant="primary" size="sm" onClick={handleAddClick}>
                        <FaPlus className="me-1" /> Thêm Cấp nhiệm vụ
                    </Button>
                </Card.Header>
                <Card.Body className="p-0">
                    {isLoading ? (
                        <div className="text-center p-5"><Spinner animation="border" variant="primary" /><p>Đang tải...</p></div>
                    ) : fetchError ? (
                        <Alert variant="warning" className="m-3">Lỗi tải danh sách: {fetchError.message || 'Lỗi không xác định'}</Alert>
                    ) : taskLevels.length === 0 ? (
                        <Alert variant="info" className="m-3">{queryParams?.search || queryParams?.parent_id ? 'Không tìm thấy cấp nhiệm vụ nào khớp.' : 'Chưa có cấp nhiệm vụ nào.'}</Alert>
                    ) : (
                        <Table striped bordered hover responsive="sm" className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-3" style={{ width: '10%' }}>ID</th>
                                    <th style={{ width: '35%' }}>Tên Cấp nhiệm vụ</th>
                                    <th style={{ width: '20%' }}>Kinh phí</th> {/* Thêm cột Kinh phí */}
                                    <th style={{ width: '20%' }}>Cấp cha</th>
                                    <th style={{ width: '15%' }} className="text-center pe-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taskLevels.map((level) => (
                                    <tr key={level.id}>
                                        <td className="ps-3">{level.id}</td>
                                        <td>{level.ten}</td>
                                        <td>{formatCurrency(level.kinh_phi)}</td> {/* Hiển thị kinh phí đã định dạng */}
                                        <td>{renderParentName(level)}</td>
                                        <td className="text-center pe-3">
                                            <ButtonGroup size="sm">
                                                <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Sửa')}>
                                                    <Button variant="link" className="text-info p-1" onClick={() => handleEditClick(level)}> <FaEdit size={16}/> </Button>
                                                </OverlayTrigger>
                                                <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Xóa')}>
                                                    <Button variant="link" className="text-danger p-1" onClick={() => handleDeleteClick(level)}> <FaTrash size={16}/> </Button>
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
                <TaskLevelFormModal
                    show={showAddEditModal}
                    onHide={() => setShowAddEditModal(false)}
                    onSave={handleSaveTaskLevel}
                    taskLevel={taskLevelToEdit}
                    allTaskLevelsForParentSelect={allTaskLevelsForFilter} // Truyền danh sách đầy đủ
                    isEditing={!!taskLevelToEdit}
                />
            )}

            {/* Modal Xác nhận Xóa */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
                 <Modal.Header closeButton> <Modal.Title>Xác nhận Xóa</Modal.Title> </Modal.Header>
                 <Modal.Body>Bạn có chắc chắn muốn xóa cấp nhiệm vụ <strong>{taskLevelToDelete?.ten}</strong>?</Modal.Body>
                 <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Hủy</Button>
                    <Button variant="danger" onClick={confirmDeleteTaskLevel}>Xóa</Button>
                 </Modal.Footer>
            </Modal>

        </Container>
    );
};

export default ManageTaskLevelsPage;