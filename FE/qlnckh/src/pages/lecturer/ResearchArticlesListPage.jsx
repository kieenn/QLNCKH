import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Table, Modal, Form, Badge, Row, Col, ListGroup } from 'react-bootstrap';
import { FaArrowLeft, FaEdit, FaSave, FaPaperclip, FaTimes, FaPlusCircle, FaTrashAlt, FaUpload, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getArticlesForResearch, updateLecturerArticle } from '../../api/lecturerApi';
import { useAuth } from '../../hooks/useAuth';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('vi-VN'); } catch (e) { return 'Invalid Date'; }
};

const getArticleStatusBadge = (statusName) => {
    const lowerStatus = statusName?.toLowerCase() || '';
    if (lowerStatus.includes('chờ duyệt')) return 'secondary';
    if (lowerStatus.includes('đã duyệt')) return 'success';
    if (lowerStatus.includes('từ chối')) return 'danger';
    return 'light';
};

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileUrl = (filePath) => {
    // Sử dụng REACT_APP_API_BASE_URL từ file .env
    return filePath ? `${process.env.REACT_APP_API_BASE_URL}/storage/${filePath}` : '#';
};

const ResearchArticlesListPage = () => {
    const { researchId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [editFormData, setEditFormData] = useState({ ten_bai_bao: '', ngay_xuat_ban: '', mo_ta: '' });
    
    const [currentFiles, setCurrentFiles] = useState([]); 
    const [newFileEntries, setNewFileEntries] = useState([{ id: `new-file-${Date.now()}`, fileObject: null, description: '' }]); 
    const [filesToDelete, setFilesToDelete] = useState([]); 
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    const fetchArticles = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getArticlesForResearch(researchId);
            setArticles(response.data || []);
        } catch (err) {
            console.error("Error fetching articles for research:", err);
            const errorMessage = err.response?.data?.message || "Không thể tải danh sách bài báo.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [researchId]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const handleEditClick = (article) => {
        setEditingArticle(article);
        setEditFormData({
            ten_bai_bao: article.ten_bai_bao || '',
            ngay_xuat_ban: article.ngay_xuat_ban ? new Date(article.ngay_xuat_ban).toISOString().split('T')[0] : '',
            mo_ta: article.mo_ta || '',
        });
        setCurrentFiles(article.tai_lieu || []);
        setNewFileEntries([{ id: `new-file-${Date.now()}`, fileObject: null, description: '' }]);
        setFilesToDelete([]);
        setShowEditModal(true);
    };

    const handleEditModalClose = () => {
        setShowEditModal(false);
        setEditingArticle(null);
        setCurrentFiles([]);
        setNewFileEntries([{ id: `new-file-${Date.now()}`, fileObject: null, description: '' }]);
        setFilesToDelete([]);
    };

    const handleEditFormChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingArticle) return;
        setIsSubmittingEdit(true);

        const formDataToSubmit = new FormData();
        formDataToSubmit.append('ten_bai_bao', editFormData.ten_bai_bao);
        formDataToSubmit.append('ngay_xuat_ban', editFormData.ngay_xuat_ban);
        formDataToSubmit.append('mo_ta', editFormData.mo_ta);

        console.log("ResearchArticlesListPage: handleEditSubmit - Processing newFileEntries:", 
            newFileEntries.map(e => ({ id: e.id, fileName: e.fileObject?.name, description: e.description, isFile: e.fileObject instanceof File }))
        );

        let actualNewFileIndex = 0;
        newFileEntries.forEach(entry => {
            if (entry.fileObject instanceof File) {
                formDataToSubmit.append(`new_files[${actualNewFileIndex}]`, entry.fileObject);
                formDataToSubmit.append(`new_file_descriptions[${actualNewFileIndex}]`, entry.description || '');
                actualNewFileIndex++;
            } else {
                if (entry.fileObject !== null) { // Log only if it's not null but also not a File
                    console.warn("ResearchArticlesListPage: handleEditSubmit - Skipping entry with non-File object. Entry ID:", entry.id, "File Object:", entry.fileObject);
                }
            }
        });
        console.log(`ResearchArticlesListPage: Appended ${actualNewFileIndex} valid new files to FormData.`);

        filesToDelete.forEach(fileId => {
            formDataToSubmit.append('delete_files[]', fileId);
        });
        
        // For debugging FormData content (files will show as [object File])
        // for (let pair of formDataToSubmit.entries()) {
        //    console.log(`FormData Entry: ${pair[0]} = `, pair[1]);
        // }

        try {
            const response = await updateLecturerArticle(editingArticle.id, formDataToSubmit);
            toast.success(response.data.message || "Cập nhật bài báo thành công!");
            setShowEditModal(false);
            setEditingArticle(null);
            setCurrentFiles([]);
            setNewFileEntries([{ id: `new-file-${Date.now()}`, fileObject: null, description: '' }]);
            setFilesToDelete([]);
            fetchArticles(); 
        } catch (err) {
            if (err.response && err.response.data && err.response.data.errors) {
                console.error("ResearchArticlesListPage: Backend validation errors:", JSON.stringify(err.response.data.errors, null, 2));
            }
            console.error("Error updating article:", err);
            toast.error(err.response?.data?.message || "Lỗi cập nhật bài báo.");
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    const handleNewFileChangeForEntry = (entryId, e) => {
        const file = e.target.files[0]; 
        console.log(`ResearchArticlesListPage: handleNewFileChangeForEntry - Entry ID: ${entryId}, Selected file:`, file ? file.name : 'No file selected', file);
        setNewFileEntries(prevEntries =>
            prevEntries.map(entry =>
                entry.id === entryId ? { ...entry, fileObject: file instanceof File ? file : null } : entry
            )
        );
        e.target.value = null; 
    };

    const handleNewFileDescriptionChangeForEntry = (entryId, description) => {
        setNewFileEntries(prevEntries =>
            prevEntries.map(entry =>
                entry.id === entryId ? { ...entry, description } : entry
            )
        );
    };

    const addNewFileEntry = () => {
        setNewFileEntries(prevEntries => [
            ...prevEntries,
            { id: `new-file-${Date.now()}-${prevEntries.length}`, fileObject: null, description: '' }
        ]);
    };

    const removeNewFileEntry = (entryId) => {
        if (newFileEntries.length > 1) {
            setNewFileEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
        } else {
            setNewFileEntries([{ id: `new-file-${Date.now()}`, fileObject: null, description: '' }]);
        }
    };

    const handleDeleteExistingFile = (fileId) => {
        setFilesToDelete(prev => [...prev, fileId]);
        setCurrentFiles(prev => prev.filter(f => f.id !== fileId));
    };

    if (isLoading) {
        return <Container className="p-4 text-center"><Spinner animation="border" /> <p>Đang tải bài báo...</p></Container>;
    }

    if (error) {
        return (
            <Container className="p-4">
                <Alert variant="danger">
                    <h4>Lỗi</h4>
                    <p>{error}</p>
                    <Button variant="secondary" onClick={() => navigate(-1)}>Quay lại</Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="p-4">
            <Row className="mb-3 align-items-center">
                <Col xs="auto">
                    <Button as={RouterLink} to="/lecturer" variant="light"> {/* Adjusted back link */}
                        <FaArrowLeft /> Quay lại DS Đề tài
                    </Button>
                </Col>
                <Col>
                    <h2 className="h3 mb-0">Bài báo đã khai báo cho Đề tài ID: {researchId}</h2>
                </Col>
            </Row>

            <Card className="shadow-sm">
                <Card.Header>Danh sách bài báo</Card.Header>
                <Card.Body>
                    {articles.length === 0 ? (
                        <Alert variant="info">Chưa có bài báo nào được khai báo cho đề tài này.</Alert>
                    ) : (
                        <Table striped bordered hover responsive="lg">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tên bài báo</th>
                                    <th>Ngày xuất bản</th>
                                    <th>Người nộp</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.map((article, index) => (
                                    <tr key={article.id}>
                                        <td>{index + 1}</td>
                                        <td>{article.ten_bai_bao}</td>
                                        <td>{formatDate(article.ngay_xuat_ban)}</td>
                                        <td>{article.nguoi_nop?.ho_ten || article.msvc_nguoi_nop || 'N/A'}</td>
                                        <td><Badge bg={getArticleStatusBadge(article.trang_thai)}>{article.trang_thai}</Badge></td>
                                        <td>{formatDate(article.created_at)}</td>
                                        <td>
                                            {article.trang_thai === 'chờ duyệt' && article.msvc_nguoi_nop === user?.msvc && (
                                                <Button variant="outline-warning" size="sm" onClick={() => handleEditClick(article)}>
                                                    <FaEdit /> Sửa
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showEditModal} onHide={handleEditModalClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chỉnh sửa Bài báo</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit} id="editArticleForm">
                    <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <Form.Group className="mb-3" controlId="editTenBaiBao">
                            <Form.Label>Tên bài báo <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="ten_bai_bao"
                                value={editFormData.ten_bai_bao}
                                onChange={handleEditFormChange}
                                required
                                disabled={isSubmittingEdit}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="editNgayXuatBan">
                            <Form.Label>Ngày xuất bản <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="date"
                                name="ngay_xuat_ban"
                                value={editFormData.ngay_xuat_ban}
                                onChange={handleEditFormChange}
                                required
                                disabled={isSubmittingEdit}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="editMoTa">
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="mo_ta"
                                value={editFormData.mo_ta}
                                onChange={handleEditFormChange}
                                disabled={isSubmittingEdit}
                            />
                        </Form.Group>

                        <hr />
                        <h5 className="mb-3">Quản lý File Đính Kèm</h5>

                        {currentFiles.length > 0 && (
                            <Card className="mb-3">
                                <Card.Header as="h6">File hiện tại</Card.Header>
                                <ListGroup variant="flush">
                                    {currentFiles.map(file => (
                                        <ListGroup.Item key={file.id} className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <FaPaperclip className="me-2 text-secondary" />
                                                <a href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" title={file.mo_ta || file.file_path.split('/').pop()}>
                                                    {file.mo_ta || file.file_path.split('/').pop()}
                                                </a>
                                            </div>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteExistingFile(file.id)} title="Đánh dấu xóa file này" disabled={isSubmittingEdit}>
                                                <FaTrashAlt /> Xóa
                                            </Button>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card>
                        )}

                        <Card className="mb-3">
                            <Card.Header as="h6">File mới tải lên</Card.Header>
                            <Card.Body className="pt-3">
                                {newFileEntries.map((entry, index) => (
                                    <Card key={entry.id} className="mb-3 shadow-sm">
                                        <Card.Header className="py-2 px-3 d-flex justify-content-between align-items-center bg-light-subtle">
                                            <strong className="text-primary">File mới {index + 1}</strong>
                                            {newFileEntries.length > 1 && (
                                                <Button variant="link" className="p-0 text-danger" onClick={() => removeNewFileEntry(entry.id)} disabled={isSubmittingEdit} title="Xóa mục file này">
                                                    <FaTimes size="1.1em" />
                                                </Button>
                                            )}
                                        </Card.Header>
                                        <Card.Body className="p-3">
                                            <Row className="g-3">
                                                <Col md={12}>
                                                    <Form.Group controlId={`new-file-input-${entry.id}`}>
                                                        <Form.Label className="mb-1"><FaUpload className="me-1" /> Chọn File</Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            onChange={(e) => handleNewFileChangeForEntry(entry.id, e)}
                                                            disabled={isSubmittingEdit}
                                                            size="sm"
                                                        />
                                                        {entry.fileObject && (
                                                            <Form.Text className="text-muted d-block mt-1">
                                                                Đã chọn: {entry.fileObject.name} ({formatFileSize(entry.fileObject.size)})
                                                            </Form.Text>
                                                        )}
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12}>
                                                    <Form.Group controlId={`new-file-description-${entry.id}`}>
                                                        <Form.Label className="mb-1">Mô tả cho File mới</Form.Label>
                                                        <Form.Control
                                                            as="textarea" rows={2}
                                                            placeholder="Mô tả ngắn gọn..."
                                                            value={entry.description}
                                                            onChange={(e) => handleNewFileDescriptionChangeForEntry(entry.id, e.target.value)}
                                                            disabled={isSubmittingEdit} size="sm"
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                ))}
                                <Button variant="outline-primary" size="sm" onClick={addNewFileEntry} disabled={isSubmittingEdit} className="mt-2">
                                    <FaPlusCircle className="me-1" /> Thêm File Mới Khác
                                </Button>
                            </Card.Body>
                        </Card>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleEditModalClose} disabled={isSubmittingEdit}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit" form="editArticleForm" disabled={isSubmittingEdit}>
                            {isSubmittingEdit ? <><Spinner as="span" animation="border" size="sm" /> Đang lưu...</> : <><FaSave /> Lưu thay đổi</>}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default ResearchArticlesListPage;
