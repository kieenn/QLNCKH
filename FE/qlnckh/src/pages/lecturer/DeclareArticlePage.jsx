// c:\Users\maing\OneDrive\Documents\KLTN\project\FE\qlnckh\src\pages\lecturer\DeclareArticlePage.jsx
import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col, Spinner, Alert, ListGroup } from 'react-bootstrap'; // Added ListGroup
import { FaArrowLeft, FaSave, FaPaperclip, FaTimes, FaPlusCircle, FaTrashAlt, FaUpload } from 'react-icons/fa'; // Added FaTrashAlt, FaUpload
import { fetchCsrfToken } from '../../api/axiosConfig';
// Chỉ import hàm submit thật, getResearchDetails sẽ là mock
import { submitActualArticleDeclaration, getArticleDetail, updateLecturerArticle } from '../../api/lecturerApi'; // Added getArticleDetail, updateLecturerArticle
import { toast } from 'react-toastify'; // For user feedback

// Hàm mock cho getResearchDetails nếu chưa có API thật hoặc API hiện tại không phù hợp
const getResearchDetailsMock = async (researchId) => {
    console.log(`Fetching details for research ID (mock): ${researchId}`);
    return Promise.resolve({ data: { id: researchId, ten_de_tai: `Đề tài mẫu ${researchId}`, ma_de_tai: `DT${researchId}` } });
};

// Helper functions for file display
const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileUrl = (filePath) => {
    return filePath ? `${process.env.REACT_APP_API_BASE_URL}/storage/${filePath}` : '#';
};


const DeclareArticlePage = () => {
    const { researchId, articleId } = useParams(); // Get articleId for edit mode
    const navigate = useNavigate();
    const isEditMode = !!articleId; // Determine if in edit mode

    const [researchTitle, setResearchTitle] = useState('');
    const [formData, setFormData] = useState({
        ten_bai_bao: '',
        ngay_xuat_ban: '',
        mo_ta_bai_bao: '',
        // trang_thai_bai_bao: '', // Bỏ trường này khỏi state của form giảng viên
    });
    const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from isLoading for clarity
    const [isFetchingResearch, setIsFetchingResearch] = useState(true);
    const [isFetchingArticle, setIsFetchingArticle] = useState(isEditMode); // True if in edit mode initially
    
    // fileEntries is now newFileEntries, for adding NEW files
    const [newFileEntries, setNewFileEntries] = useState([
        { id: `new-file-${Date.now()}`, fileObject: null, description: '' }
    ]);
    const [currentFiles, setCurrentFiles] = useState([]); // For existing files in edit mode
    const [filesToDelete, setFilesToDelete] = useState([]); // IDs of existing files to delete
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResearchTitle = async () => {
            setIsFetchingResearch(true);
            try {
                // Nếu bạn đã có API thật để lấy chi tiết đề tài, hãy dùng nó
                // const response = await getResearchDetails(researchId);
                // Tạm thời vẫn dùng mock cho getResearchDetails để tập trung vào submit
                const response = await getResearchDetailsMock(researchId); // Sử dụng hàm mock
                setResearchTitle(response.data?.ten_de_tai || 'Không tìm thấy đề tài');

            } catch (err) {
                console.error("Error fetching research details:", err);
                setError("Không thể tải thông tin đề tài.");
                setResearchTitle('Lỗi tải đề tài');
            } finally {
                setIsFetchingResearch(false);
            }
        };
        if (researchId) {
            fetchResearchTitle();
        }
    }, [researchId]);

    useEffect(() => {
        if (isEditMode && articleId) {
            const fetchArticleData = async () => {
                setIsFetchingArticle(true);
                setError(null);
                try {
                    const response = await getArticleDetail(articleId);
                    const article = response.data;
                    setFormData({
                        ten_bai_bao: article.ten_bai_bao || '',
                        ngay_xuat_ban: article.ngay_xuat_ban ? new Date(article.ngay_xuat_ban).toISOString().split('T')[0] : '',
                        mo_ta_bai_bao: article.mo_ta || '', // Assuming backend uses 'mo_ta'
                    });
                    setCurrentFiles(article.tai_lieu || []);
                    setNewFileEntries([{ id: `new-file-${Date.now()}`, fileObject: null, description: '' }]); // Reset new file entries
                    setFilesToDelete([]);
                } catch (err) {
                    console.error("Error fetching article details:", err);
                    const apiError = err.response?.data?.message || "Không thể tải chi tiết bài báo.";
                    setError(apiError);
                    toast.error(apiError);
                } finally {
                    setIsFetchingArticle(false);
                }
            };
            fetchArticleData();
        } else {
            // Reset form if not in edit mode (e.g., navigating from edit to new)
            setFormData({ ten_bai_bao: '', ngay_xuat_ban: '', mo_ta_bai_bao: '' });
            setCurrentFiles([]);
            setNewFileEntries([{ id: `new-file-${Date.now()}`, fileObject: null, description: '' }]);
            setFilesToDelete([]);
            setIsFetchingArticle(false);
        }
    }, [isEditMode, articleId, researchId]); // Add researchId to reset if it changes while not in edit mode

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleFileChangeForEntry = (entryId, e) => {
        const file = e.target.files[0];
        setNewFileEntries(prevEntries =>
            prevEntries.map(entry =>
                entry.id === entryId ? { ...entry, fileObject: file || null } : entry
            )
        );
        e.target.value = null; // Reset file input để có thể chọn lại file nếu cần
    };
    
    const handleDescriptionChangeForEntry = (entryId, description) => {
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
        if (newFileEntries.length === 1) {
            setNewFileEntries([{ id: `new-file-${Date.now()}`, fileObject: null, description: '' }]);
        } else {
            setNewFileEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.ten_bai_bao || !formData.ngay_xuat_ban) {
            const msg = "Tên bài báo và Ngày xuất bản không được để trống.";
            setError(msg);
            toast.error(msg);
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            await fetchCsrfToken();
            const dataToSubmit = new FormData();
            dataToSubmit.append('ten_bai_bao', formData.ten_bai_bao);
            if (formData.ngay_xuat_ban) dataToSubmit.append('ngay_xuat_ban', formData.ngay_xuat_ban);
            // Backend for updateArticle expects 'mo_ta'
            // Always send mo_ta in edit mode, even if it's an empty string, to allow clearing it.
            dataToSubmit.append(isEditMode ? 'mo_ta' : 'mo_ta_bai_bao', formData.mo_ta_bai_bao || '');

            // Log FormData entries for debugging
            console.log("DeclareArticlePage: FormData before sending to backend:");
            for (let pair of dataToSubmit.entries()) {
                console.log(pair[0]+ ': ', pair[1]);
            }

            let actualFileIndex = 0;
            newFileEntries.forEach((entry) => {
                // Chỉ thêm vào FormData nếu thực sự có file được chọn cho mục nhập này
                if (entry.fileObject instanceof File) {
                    const fileArrayKey = isEditMode ? 'new_files' : 'files';
                    const descriptionArrayKey = isEditMode ? 'new_file_descriptions' : 'file_descriptions';
                    
                    dataToSubmit.append(`${fileArrayKey}[${actualFileIndex}]`, entry.fileObject);
                    dataToSubmit.append(`${descriptionArrayKey}[${actualFileIndex}]`, entry.description || '');
                    actualFileIndex++;
                }
            });

            if (isEditMode) {
                filesToDelete.forEach(fileId => {
                    dataToSubmit.append('delete_files[]', fileId);
                });
                const response = await updateLecturerArticle(articleId, dataToSubmit);
                toast.success(response.data.message || "Cập nhật bài báo thành công!");
                navigate(`/lecturer/researches/${researchId}/articles`);
            } else {
                const response = await submitActualArticleDeclaration(researchId, dataToSubmit);
                toast.success(response.data.message || "Khai báo thành công! Chờ quản trị viên duyệt.");
                setFormData({ ten_bai_bao: '', ngay_xuat_ban: '', mo_ta_bai_bao: '' });
                setNewFileEntries([{ id: `new-file-${Date.now()}`, fileObject: null, description: '' }]);
            }

        } catch (err) {
            console.error(`Error ${isEditMode ? 'updating' : 'submitting'} article:`, err);
            if (err.response) {
                console.error("Backend Error Response Data:", err.response.data); // Log the full response data
            }

            const apiErrorMessage = err.response?.data?.message || `Lỗi ${isEditMode ? 'cập nhật' : 'khai báo'}. Vui lòng thử lại.`;
            
             if (err.response && err.response.data && err.response.data.errors) {
                const validationErrors = err.response.data.errors;
                let errorMessages = [];
                for (const key in validationErrors) {
                    errorMessages.push(`Trường '${key}': ${validationErrors[key].join(', ')}`);
                }
                const detailedErrorMessage = `${apiErrorMessage} Chi tiết: ${errorMessages.join('; ')}`;
                setError(detailedErrorMessage);
                toast.error(detailedErrorMessage); // Show detailed errors in toast as well
            } else {
                setError(apiErrorMessage);
                toast.error(apiErrorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler for deleting existing files in edit mode
    const handleDeleteExistingFile = (fileIdToDelete) => {
        setFilesToDelete(prev => [...prev, fileIdToDelete]);
        setCurrentFiles(prev => prev.filter(f => f.id !== fileIdToDelete));
        toast.info("Đã đánh dấu xóa file. Thay đổi sẽ được áp dụng khi bạn lưu.");
    };

    if (isFetchingResearch || (isEditMode && isFetchingArticle)) {
        return <Container className="p-4 text-center"><Spinner animation="border" /> <p>Đang tải thông tin...</p></Container>;
    }

    return (
        <Container fluid className="p-4">
            <Row className="mb-3">
                <Col>
                    <Button 
                        as={Link} 
                        to={isEditMode ? `/lecturer/researches/${researchId}/articles` : "/lecturer/"} 
                        variant="light" 
                        className="mb-3"
                    >
                        <FaArrowLeft /> {isEditMode ? 'Quay lại DS Bài báo' : 'Quay lại DS Đề tài'}
                    </Button>
                    <h2 className="h3">{isEditMode ? 'Chỉnh sửa Bài báo Khoa học' : 'Khai báo Bài báo Khoa học'}</h2>
                    <p className="text-muted">
                        {researchTitle ? `Cho đề tài: ${researchTitle}` : `Đề tài ID: ${researchId}`}
                        {isEditMode && articleId && ` - Bài báo ID: ${articleId}`}
                    </p>
                </Col>
            </Row>

            <Card className="shadow-sm">
                <Card.Body>
                    {/* Bỏ comment và di chuyển Alert vào trong Card.Body, thêm key và class mb-3 */}
                    {error && <Alert key="error-alert" variant="danger" onClose={() => setError(null)} dismissible className="mb-3">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="ten_bai_bao">
                            <Form.Label>Tên bài báo <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="text" name="ten_bai_bao" value={formData.ten_bai_bao} onChange={handleChange} required disabled={isSubmitting} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="ngay_xuat_ban">
                            <Form.Label>Ngày xuất bản <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="date" name="ngay_xuat_ban" value={formData.ngay_xuat_ban} onChange={handleChange} required disabled={isSubmitting} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="mo_ta_bai_bao">
                            <Form.Label>Mô tả bài báo</Form.Label>
                            <Form.Control as="textarea" rows={3} name="mo_ta_bai_bao" value={formData.mo_ta_bai_bao} onChange={handleChange} disabled={isSubmitting} />
                        </Form.Group>
                        {/* Trường Trạng thái bài báo đã được loại bỏ khỏi form của giảng viên */}
                        <hr />
                        <h5 className="mb-3">Quản lý File Đính Kèm</h5>

                        {isEditMode && currentFiles.length > 0 && (
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
                                                {file.file_size && <span className="text-muted ms-2">({formatFileSize(file.file_size)})</span>}
                                            </div>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteExistingFile(file.id)} title="Đánh dấu xóa file này" disabled={isSubmitting}>
                                                <FaTrashAlt /> Xóa
                                            </Button>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card>
                        )}

                        <Card className="mb-3">
                            <Card.Header as="h6">{isEditMode ? "Thêm File Mới" : "Các File Đính Kèm"}</Card.Header>
                            <Card.Body>
                        {newFileEntries.map((entry, index) => (
                            <Card key={entry.id} className="mb-3 shadow-sm">
                                <Card.Header className="py-2 px-3 d-flex justify-content-between align-items-center bg-light">
                                    <strong className="text-primary">{isEditMode ? "File mới" : "File đính kèm"} {index + 1}</strong>
                                    {(newFileEntries.length > 1 || (newFileEntries.length === 1 && entry.fileObject)) && (
                                        <Button 
                                            variant="link" 
                                            className="p-0 text-danger" 
                                            onClick={() => removeNewFileEntry(entry.id)} // Corrected function name
                                            disabled={isSubmitting} 
                                            title="Xóa mục file này"
                                        >
                                            <FaTimes size="1.1em" />
                                        </Button>
                                    )}
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <Form.Group controlId={`new-file-input-${entry.id}`}>
                                                <Form.Label className="mb-1">
                                                    <FaUpload className="me-1" /> Chọn File
                                                </Form.Label>
                                                <Form.Control
                                                    type="file"
                                                    onChange={(e) => handleFileChangeForEntry(entry.id, e)}
                                                    disabled={isSubmitting}
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
                                            <Form.Group controlId={`file-description-${entry.id}`}>
                                                <Form.Label className="mb-1">Mô tả cho File</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    placeholder="Ví dụ: Bản full text, Abstract, Poster, Hình ảnh minh họa..."
                                                    value={entry.description}
                                                    onChange={(e) => handleDescriptionChangeForEntry(entry.id, e.target.value)}
                                                    disabled={isSubmitting}
                                                    size="sm"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                                </Card>
                        ))}
                        <Button variant="outline-primary" size="sm" onClick={addNewFileEntry} disabled={isSubmitting} className="mt-2 mb-3"> {/* Corrected function name */}
                            <FaPlusCircle className="me-1" /> Thêm File Khác
                        </Button>
                            </Card.Body>
                        </Card>

                        <div className="mt-4 d-flex justify-content-end">
                            <Button variant="primary" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><Spinner as="span" animation="border" size="sm" className="me-2" /> Đang xử lý...</> : <><FaSave className="me-1" /> {isEditMode ? 'Lưu thay đổi' : 'Lưu khai báo'}</>}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DeclareArticlePage;
