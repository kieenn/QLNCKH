import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Card, Table, Button, Spinner, Alert, Row, Col, InputGroup, FormControl, Pagination, // <<< Thêm lại Pagination
    Modal, Form, Tooltip, OverlayTrigger, ButtonGroup, FormSelect
} from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSitemap } from 'react-icons/fa'; // Thêm FaSitemap nếu muốn
import { FaSyncAlt } from 'react-icons/fa'; // Import FaSyncAlt
import apiClient from '../../api/axiosConfig'; // Import API client đã cấu hình
// Import các hàm API cần thiết, bao gồm cả hàm lấy đơn vị phân trang
import { getAllUnits, getUnitsPaginated, createUnit, updateUnit, deleteUnit } from '../../api/adminApi';
// import PaginationControls from '../../components/common/PaginationControls'; // <<< Bỏ component Pagination tùy chỉnh
import usePagination from '../../hooks/usePagination'; // Import hook pagination

// --- Component Modal Thêm/Sửa Đơn vị ---
const UnitFormModal = ({ show, onHide, onSave, unit, allUnitsForParentSelect = [], isEditing = false }) => { // Nhận allUnitsForParentSelect từ props
    const [formData, setFormData] = useState({ ten: '', parent_id: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    // const [allUnitsForParentSelect, setAllUnitsForParentSelect] = useState([]); // <<< ĐÃ XÓA DÒNG NÀY

    // Load data vào form khi sửa hoặc reset khi thêm mới
    useEffect(() => {
        if (show) {
            if (isEditing && unit) {
                setFormData({
                    ten: unit.ten || '',
                    parent_id: unit.parent_id || '' // parent_id có thể là null hoặc ID
                });
            } else {
                // Reset form cho thêm mới
                setFormData({ ten: '', parent_id: '' });
            }
            setError(null); // Reset lỗi khi mở modal
            setValidationErrors({}); // Reset lỗi validation

            // <<< Bỏ gọi API ở đây, sử dụng prop allUnitsForParentSelect >>>
        }
    }, [show, unit, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Xóa lỗi validation khi người dùng nhập
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.ten.trim()) errors.ten = "Tên đơn vị không được để trống.";
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
                parent_id: formData.parent_id || null // Gửi null nếu không chọn cha
            };
            await onSave(dataToSend); // Gọi hàm onSave từ component cha
            onHide(); // Đóng modal nếu thành công
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

    // Lọc ra các đơn vị không phải là chính nó hoặc con cháu của nó (để tránh vòng lặp cha-con)
    const getValidParentOptions = () => {
        // Sử dụng prop allUnitsForParentSelect được truyền vào
        if (!isEditing || !unit) return allUnitsForParentSelect;

        const descendantIds = new Set();
        const findDescendants = (parentId) => {
            descendantIds.add(parentId);
            allUnitsForParentSelect.forEach(u => {
                if (u.parent_id === parentId) {
                    findDescendants(u.id);
                }
            });
        };

        if (unit && unit.id) { // Chỉ tìm con cháu nếu unit tồn tại và có id
             findDescendants(unit.id);
        }

        return allUnitsForParentSelect.filter(u => !descendantIds.has(u.id));
    };

    const validParentOptions = getValidParentOptions();

    return (
        <Modal show={show} onHide={onHide} backdrop="static" centered>
            <Modal.Header closeButton>
                <Modal.Title>{isEditing ? 'Sửa Đơn vị' : 'Thêm Đơn vị mới'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form noValidate>
                    <Form.Group className="mb-3" controlId="unitTen">
                        <Form.Label>Tên Đơn vị <span className="text-danger">*</span></Form.Label>
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

                    <Form.Group className="mb-3" controlId="unitParent">
                        <Form.Label>Đơn vị cha (Tùy chọn)</Form.Label>
                        <FormSelect
                            name="parent_id"
                            value={formData.parent_id}
                            onChange={handleChange}
                            disabled={isSaving || !allUnitsForParentSelect.length} // Disable nếu chưa load xong
                        >
                            <option value="">-- Không có đơn vị cha --</option>
                            {validParentOptions.map(dv => (
                                <option key={dv.id} value={dv.id}>{dv.ten}</option>
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

// --- Component Trang Quản Lý Đơn vị ---
const ManageUnitsPage = () => {
    // Sử dụng hook pagination
    const {
        data: units, // Dữ liệu đơn vị của trang hiện tại
        loading: isLoading, // Trạng thái loading
        error: fetchError, // Lỗi fetch
        currentPage,
        paginationData,
        goToPage,
        refetch: refetchUnits, // Hàm để tải lại dữ liệu
        updateFilters, // Hàm cập nhật bộ lọc
        queryParams // Các tham số lọc hiện tại (page, search, parent_id)
    } = usePagination('/api/admin/getDonVi'); // Sử dụng endpoint phân trang

    const [searchTerm, setSearchTerm] = useState(queryParams?.search || ''); // Lấy từ queryParams nếu có
    const [selectedParentId, setSelectedParentId] = useState(queryParams?.parent_id || ''); // Lấy từ queryParams nếu có
    const [allUnitsForFilter, setAllUnitsForFilter] = useState([]); // State cho dropdown lọc và tra cứu tên cha
    const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(false);

    // State cho modals và actions
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(''); // Đổi thành chuỗi rỗng
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [unitToEdit, setUnitToEdit] = useState(null); // null: Add, object: Edit
    const [unitToDelete, setUnitToDelete] = useState(null);

    // Hàm fetch dữ liệu (giờ chỉ cần gọi refetch từ hook)
    const fetchUnits = useCallback(() => {
        setActionError(null); // Clear action errors on refetch
        // setActionSuccess(''); // Optionally clear success messages too
        refetchUnits(); // Gọi hàm refetch từ hook usePagination
    }, [refetchUnits]);

    // Hàm tải danh sách đầy đủ cho bộ lọc và tra cứu tên
    const fetchAllUnitsForFilter = useCallback(() => {
        setIsLoadingFilterOptions(true);
        getAllUnits()
            .then(data => {
                setAllUnitsForFilter(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Error fetching units for filter dropdown:", err);
                setActionError("Lỗi tải danh sách đơn vị cho bộ lọc.");
            })
            .finally(() => {
                setIsLoadingFilterOptions(false);
            });
    }, []); // Dependencies trống vì nó không phụ thuộc state/props nào

    // Fetch dữ liệu cho Filter Dropdown khi component mount
    useEffect(() => {
        fetchAllUnitsForFilter();
    }, [fetchAllUnitsForFilter]); // Chỉ chạy 1 lần khi mount

    // useEffect để cập nhật bộ lọc khi searchTerm hoặc selectedParentId thay đổi (debounce)
    useEffect(() => {
        const timerId = setTimeout(() => {
            // Chỉ gọi updateFilters nếu giá trị thực sự thay đổi so với queryParams hiện tại
            // để tránh gọi API không cần thiết khi component mới mount
            if (searchTerm.trim() !== (queryParams?.search || '') || selectedParentId !== (queryParams?.parent_id || '')) {
                 updateFilters({ search: searchTerm.trim(), parent_id: selectedParentId });
            }
        }, 500); // Đợi 500ms sau khi người dùng ngừng gõ/chọn
        return () => clearTimeout(timerId);
    }, [searchTerm, selectedParentId, updateFilters, queryParams]); // Thêm queryParams vào dependencies

    // --- Handlers for Modals and Actions ---
    const handleAddClick = () => {
        setUnitToEdit(null); // Đảm bảo là chế độ thêm mới
        setShowAddEditModal(true);
        setActionError(null);
        setActionSuccess('');
    };

    const handleEditClick = (unit) => {
        if (!unit || !unit.id) {
            setActionError("Dữ liệu đơn vị không hợp lệ để sửa.");
            return;
        }
        setUnitToEdit(unit);
        setShowAddEditModal(true);
        setActionError(null);
        setActionSuccess('');
    };

    const handleDeleteClick = (unit) => {
         if (!unit || !unit.id) {
            setActionError("Dữ liệu đơn vị không hợp lệ để xóa.");
            return;
        }
        // Kiểm tra xem đơn vị có đơn vị con không (dựa trên dữ liệu đã fetch cho dropdown)
        const hasChildren = allUnitsForFilter.some(u => u.parent_id === unit.id);
        if (hasChildren) {
            setActionError(`Không thể xóa đơn vị "${unit.ten}" vì nó có đơn vị con. Vui lòng xóa hoặc di chuyển các đơn vị con trước.`);
            // Clear lỗi sau vài giây
            setTimeout(() => setActionError(null), 5000);
            return;
        }
        setUnitToDelete(unit);
        setShowDeleteConfirm(true);
        setActionError(null);
        setActionSuccess('');
    };

    const handleSaveUnit = async (unitData) => {
        // Hàm này được gọi bởi UnitFormModal
        try {
            let response;
            if (unitToEdit) {
                // Chế độ sửa
                response = await updateUnit(unitToEdit.id, unitData);
                setActionSuccess(`Đã cập nhật đơn vị "${response.ten || unitData.ten}" thành công.`);
            } else {
                // Chế độ thêm mới
                response = await createUnit(unitData);
                setActionSuccess(`Đã thêm đơn vị "${response.ten || unitData.ten}" thành công.`);
            }
            setShowAddEditModal(false); // Đóng modal sau khi lưu thành công
            fetchUnits(); // Tải lại danh sách phân trang (gọi refetch)
            // Tải lại danh sách đầy đủ cho bộ lọc và tra cứu tên
            fetchAllUnitsForFilter();
        } catch (err) {
            console.error("Error saving unit:", err);
            // Ném lỗi lại để modal hiển thị
            throw err;
        }
    };

    const confirmDeleteUnit = async () => {
        if (!unitToDelete || !unitToDelete.id) return;

        try {
            await deleteUnit(unitToDelete.id);
            setActionSuccess(`Đã xóa đơn vị "${unitToDelete.ten}" thành công.`);
            fetchUnits(); // Tải lại danh sách phân trang
             // Tải lại danh sách đầy đủ cho bộ lọc và tra cứu tên
            fetchAllUnitsForFilter();
        } catch (err) {
            console.error("Error deleting unit:", err);
            setActionError(`Lỗi khi xóa đơn vị: ${err.response?.data?.message || err.message}`);
        } finally {
            setShowDeleteConfirm(false);
            setUnitToDelete(null);
        }
    };

    // Hàm hiển thị tên đơn vị cha (sử dụng parent_ten từ API)
    const renderParentName = (unit) => {
        if (!unit.parent_id) return '-'; // Không có cha
        if (unit.parent_ten) return unit.parent_ten; // Hiển thị tên cha nếu API trả về
        return <span className="text-warning fst-italic">Đang tải...</span>; // Hoặc thông báo khác nếu tên cha chưa có (trường hợp hiếm)
    };

    // Hàm render tooltip
    const renderTooltip = (props, text) => (
        <Tooltip id={`tooltip-${text.toLowerCase().replace(/\s+/g, '-')}`} {...props}>
            {text}
        </Tooltip>
    );

    // <<< Thêm lại hàm renderPaginationItems để dùng với react-bootstrap Pagination >>>
    const renderPaginationItems = () => {
        if (!paginationData || paginationData.last_page <= 1) return null;

        const items = [];
        const { links } = paginationData;

        if (links) {
            links.forEach((link, index) => {
                if (link.url === null) {
                    // Link bị vô hiệu hóa (Previous/Next ở trang đầu/cuối)
                    if (link.label.includes('Previous')) {
                        items.push(<Pagination.Prev key={`link-${index}`} disabled />);
                    } else if (link.label.includes('Next')) {
                        items.push(<Pagination.Next key={`link-${index}`} disabled />);
                    } else {
                        items.push(<Pagination.Item key={`link-${index}`} disabled>{link.label}</Pagination.Item>);
                    }
                } else if (link.active) {
                    // Trang hiện tại
                    items.push(<Pagination.Item key={`link-${index}`} active>{link.label}</Pagination.Item>);
                } else if (link.label.includes('Previous')) {
                    // Nút Previous có thể click
                    const pageNumber = new URL(link.url).searchParams.get('page');
                    items.push(<Pagination.Prev key={`link-${index}`} onClick={() => goToPage(pageNumber)} />);
                } else if (link.label.includes('Next')) {
                    // Nút Next có thể click
                    const pageNumber = new URL(link.url).searchParams.get('page');
                    items.push(<Pagination.Next key={`link-${index}`} onClick={() => goToPage(pageNumber)} />);
                } else {
                    // Trang số hoặc dấu '...'
                    const pageNumber = new URL(link.url).searchParams.get('page');
                    if (link.label === '...') {
                        items.push(<Pagination.Ellipsis key={`link-${index}`} />);
                    } else {
                        items.push(<Pagination.Item key={`link-${index}`} onClick={() => goToPage(pageNumber)}>{link.label}</Pagination.Item>);
                    }
                }
            });
        }
        return items;
    };
    // --- JSX Render ---
    return (
        <Container fluid className="manage-units-page p-4">
            <Row className="mb-3 align-items-center">
                <Col> <h1 className="h3">Quản lý Đơn vị</h1> </Col>
            </Row>

            {/* Thông báo lỗi/thành công */}
            {actionError && <Alert variant="danger" onClose={() => setActionError(null)} dismissible>{actionError}</Alert>}
            {actionSuccess && <Alert variant="success" onClose={() => setActionSuccess('')} dismissible>{actionSuccess}</Alert>}

            {/* Thanh tìm kiếm và lọc */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                 <FormControl
                                    placeholder="Tìm theo tên đơn vị..."
                                    aria-label="Tìm kiếm đơn vị"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <Form.Select
                                aria-label="Lọc theo đơn vị cha"
                                value={selectedParentId}
                                onChange={(e) => setSelectedParentId(e.target.value)}
                                disabled={isLoadingFilterOptions || isLoading} // Disable khi đang tải options hoặc dữ liệu chính
                            >
                                <option value="">-- Tất cả đơn vị cha --</option>
                                <option value="null">-- Đơn vị gốc (Không có cha) --</option>
                                {allUnitsForFilter.map(dv => (
                                    <option key={dv.id} value={dv.id}>{dv.ten}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Bảng dữ liệu */}
            <Card className="shadow mb-4 border-0">
                <Card.Header className="py-3 bg-light text-primary d-flex justify-content-between align-items-center"> {/* Thêm text-primary */}
                    <div className="d-flex align-items-center">
                        <h6 className="m-0 fw-bold">Danh sách Đơn vị</h6>
                        <Button variant="link" size="sm" onClick={() => refetchUnits()} disabled={isLoading} className="ms-2 p-0" title="Tải lại danh sách">
                            <FaSyncAlt className={isLoading ? 'fa-spin' : ''} />
                        </Button>
                    </div>
                    <Button variant="primary" size="sm" onClick={handleAddClick}>
                        <FaPlus className="me-1" /> Thêm Đơn vị
                    </Button>
                </Card.Header>
                <Card.Body className="p-0">
                    {isLoading ? (
                        <div className="text-center p-5"><Spinner animation="border" variant="primary" /><p>Đang tải...</p></div>
                    ) : fetchError ? (
                        <Alert variant="warning" className="m-3">
                            Lỗi tải danh sách: {fetchError.message || 'Lỗi không xác định'}
                        </Alert> // Sử dụng fetchError từ hook
                    ) : units.length === 0 ? ( // Kiểm tra units từ hook
                        <Alert variant="info" className="m-3">
                            {queryParams?.search || queryParams?.parent_id ? 'Không tìm thấy đơn vị nào khớp.' : 'Chưa có đơn vị nào.'}
                        </Alert>
                    ) : (
                        <Table striped bordered hover responsive="sm" className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-3" style={{ width: '10%' }}>ID</th>
                                    <th style={{ width: '45%' }}>Tên Đơn vị</th>
                                    <th style={{ width: '30%' }}>Đơn vị cha</th>
                                    <th style={{ width: '15%' }} className="text-center pe-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {units.map((unit) => ( // Render units từ hook
                                    <tr key={unit.id}>
                                        <td className="ps-3">{unit.id}</td>
                                        <td>{unit.ten}</td>
                                        <td>{renderParentName(unit)}</td> {/* <<< Sử dụng hàm mới */}
                                        <td className="text-center pe-3">
                                            <ButtonGroup size="sm">
                                                <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Sửa đơn vị')}>
                                                    <Button variant="link" className="text-info p-1" onClick={() => handleEditClick(unit)}> <FaEdit size={16}/> </Button>
                                                </OverlayTrigger>
                                                <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Xóa đơn vị')}>
                                                    <Button variant="link" className="text-danger p-1" onClick={() => handleDeleteClick(unit)}> <FaTrash size={16}/> </Button>
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
                             {/* <<< Sử dụng lại Pagination của react-bootstrap >>> */}
                            <Pagination>{renderPaginationItems()}</Pagination>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* --- Render Modals --- */}

            {/* Modal Thêm/Sửa */}
            {showAddEditModal && ( // Chỉ render modal khi cần thiết
                <UnitFormModal
                    show={showAddEditModal}
                    onHide={() => setShowAddEditModal(false)}
                    onSave={handleSaveUnit}
                    unit={unitToEdit}
                    allUnitsForParentSelect={allUnitsForFilter} // <<< Truyền danh sách đầy đủ vào modal
                    isEditing={!!unitToEdit}
                />
            )}

            {/* Modal Xác nhận Xóa */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
                 <Modal.Header closeButton> <Modal.Title>Xác nhận Xóa</Modal.Title> </Modal.Header>
                 <Modal.Body>
                    Bạn có chắc chắn muốn xóa đơn vị <strong>{unitToDelete?.ten}</strong>?
                    <br/>
                    <small className="text-danger">Hành động này không thể hoàn tác.</small>
                 </Modal.Body>
                 <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Hủy bỏ</Button>
                    <Button variant="danger" onClick={confirmDeleteUnit}>Xác nhận Xóa</Button>
                 </Modal.Footer>
            </Modal>

        </Container>
    );
};

export default ManageUnitsPage;
