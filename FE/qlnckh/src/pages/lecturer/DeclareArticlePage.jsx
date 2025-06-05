// c:\Users\maing\OneDrive\Documents\KLTN\project\FE\qlnckh\src\pages\lecturer\DeclareArticlePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaSave, FaPaperclip, FaTimes, FaPlusCircle } from 'react-icons/fa';
import { fetchCsrfToken } from '../../api/axiosConfig';
// Chỉ import hàm submit thật, getResearchDetails sẽ là mock
import { submitActualArticleDeclaration } from '../../api/lecturerApi';

// Hàm mock cho getResearchDetails nếu chưa có API thật hoặc API hiện tại không phù hợp
const getResearchDetailsMock = async (researchId) => {
    console.log(`Fetching details for research ID (mock): ${researchId}`);
    return Promise.resolve({ data: { id: researchId, ten_de_tai: `Đề tài mẫu ${researchId}`, ma_de_tai: `DT${researchId}` } });
};


const DeclareArticlePage = () => {
    const { researchId } = useParams();
    const navigate = useNavigate();

    const [researchTitle, setResearchTitle] = useState('');
    const [formData, setFormData] = useState({
        ten_bai_bao: '',
        ngay_xuat_ban: '',
        mo_ta_bai_bao: '',
        // trang_thai_bai_bao: '', // Bỏ trường này khỏi state của form giảng viên
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingResearch, setIsFetchingResearch] = useState(true);
    const [fileEntries, setFileEntries] = useState([
        { id: `file-${Date.now()}`, fileObject: null, description: '' }
    ]); // State cho các mục nhập file, khởi tạo với 1 mục
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [submissionSucceeded, setSubmissionSucceeded] = useState(false); // State mới để trigger reset form

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

    // useEffect để reset form sau khi submissionSucceeded là true
    useEffect(() => {
        if (submissionSucceeded) {
            setFormData({
                ten_bai_bao: '', ngay_xuat_ban: '', mo_ta_bai_bao: '',
            });
            setFileEntries([{ id: `file-${Date.now()}`, fileObject: null, description: '' }]);
            setSubmissionSucceeded(false); // Reset lại trigger
            // Giữ lại success message để người dùng thấy, nó sẽ tự mất khi họ dismiss hoặc submit lần nữa
        }
    }, [submissionSucceeded]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Không xử lý input file ở đây nữa
        if (name !== "files_input") { // Đảm bảo không có input nào tên là files_input
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setError(null);
        setSuccess(null);
    };

    const handleFileChangeForEntry = (entryId, e) => {
        const file = e.target.files[0];
        setFileEntries(prevEntries =>
            prevEntries.map(entry =>
                entry.id === entryId ? { ...entry, fileObject: file || null } : entry
            )
        );
        e.target.value = null; // Reset file input để có thể chọn lại file nếu cần
    };

    const handleDescriptionChangeForEntry = (entryId, description) => {
        setFileEntries(prevEntries =>
            prevEntries.map(entry =>
                entry.id === entryId ? { ...entry, description } : entry
            )
        );
    };

    const addFileEntry = () => {
        setFileEntries(prevEntries => [
            ...prevEntries,
            { id: `file-${Date.now()}-${prevEntries.length}`, fileObject: null, description: '' }
        ]);
    };

    const removeFileEntry = (entryId) => {
        setFileEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.ten_bai_bao) {
            setError("Tên bài báo không được để trống.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccess(null); // Xóa thông báo cũ trước khi submit

        try {
            await fetchCsrfToken();
            const dataToSubmit = new FormData();
            // dataToSubmit.append('de_tai_id', researchId); // researchId is now part of the URL
            dataToSubmit.append('ten_bai_bao', formData.ten_bai_bao);
            if (formData.ngay_xuat_ban) dataToSubmit.append('ngay_xuat_ban', formData.ngay_xuat_ban);
            if (formData.mo_ta_bai_bao) dataToSubmit.append('mo_ta_bai_bao', formData.mo_ta_bai_bao);
            // Không gửi 'trang_thai_bai_bao' từ frontend nữa, backend sẽ tự đặt trạng thái ban đầu

            let actualFileIndex = 0;
            fileEntries.forEach((entry) => {
                if (entry.fileObject) { // Chỉ gửi những mục có file được chọn
                    dataToSubmit.append(`files[${actualFileIndex}]`, entry.fileObject);
                    dataToSubmit.append(`file_descriptions[${actualFileIndex}]`, entry.description);
                    actualFileIndex++;
                }
            });

            // Gọi hàm API thật để gửi dữ liệu
            const response = await submitActualArticleDeclaration(researchId, dataToSubmit);
            
            setSuccess(response.data.message || "Khai báo thành công! Chờ quản trị viên duyệt.");
            // Không reset form trực tiếp ở đây nữa
            setSubmissionSucceeded(true); // Trigger việc reset form trong useEffect
        } catch (err) {
            console.error("Error submitting article declaration:", err);
            setError(err.response?.data?.message || "Khai báo thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetchingResearch) {
        return <Container className="p-4 text-center"><Spinner animation="border" /> <p>Đang tải thông tin đề tài...</p></Container>;
    }

    return (
        <Container fluid className="p-4">
            <Row className="mb-3">
                <Col>
                    <Button as={Link} to="/lecturer" variant="light" className="mb-3">
                        <FaArrowLeft /> Quay lại Danh sách đề tài
                    </Button>
                    <h2 className="h3">Khai báo Bài báo Khoa học</h2>
                    <p className="text-muted">Cho đề tài: <strong>{researchTitle}</strong> (ID: {researchId})</p>
                </Col>
            </Row>

            <Card className="shadow-sm">
                <Card.Body>
                    {/* Bỏ comment và di chuyển Alert vào trong Card.Body, thêm key và class mb-3 */}
                    {error && <Alert key="error-alert" variant="danger" onClose={() => setError(null)} dismissible className="mb-3">{error}</Alert>}
                    {success && <Alert key="success-alert" variant="success" onClose={() => setSuccess(null)} dismissible className="mb-3">{success}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="ten_bai_bao">
                            <Form.Label>Tên bài báo <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="text" name="ten_bai_bao" value={formData.ten_bai_bao} onChange={handleChange} required disabled={isLoading} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="ngay_xuat_ban">
                            <Form.Label>Ngày xuất bản</Form.Label>
                            <Form.Control type="date" name="ngay_xuat_ban" value={formData.ngay_xuat_ban} onChange={handleChange} disabled={isLoading} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="mo_ta_bai_bao">
                            <Form.Label>Mô tả bài báo</Form.Label>
                            <Form.Control as="textarea" rows={3} name="mo_ta_bai_bao" value={formData.mo_ta_bai_bao} onChange={handleChange} disabled={isLoading} />
                        </Form.Group>
                        {/* Trường Trạng thái bài báo đã được loại bỏ khỏi form của giảng viên */}
                        <hr />
                        <h5 className="mb-3">Các File Đính Kèm</h5>
                        {fileEntries.map((entry, index) => (
                            <Card key={entry.id} className="mb-3 shadow-sm">
                                <Card.Header className="py-2 px-3 d-flex justify-content-between align-items-center bg-light">
                                    <strong className="text-primary">File đính kèm {index + 1}</strong>
                                    {fileEntries.length > 1 && (
                                        <Button variant="link" className="p-0 text-danger" onClick={() => removeFileEntry(entry.id)} disabled={isLoading} title="Xóa file này">
                                            <FaTimes size="1.1em" />
                                        </Button>
                                    )}
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <Form.Group controlId={`file-input-${entry.id}`}>
                                                <Form.Label className="mb-1">
                                                    <FaPaperclip className="me-1" /> Chọn File
                                                </Form.Label>
                                                <Form.Control
                                                    type="file"
                                                    onChange={(e) => handleFileChangeForEntry(entry.id, e)}
                                                    disabled={isLoading}
                                                    size="sm"
                                                />
                                                {entry.fileObject && (
                                                    <Form.Text className="text-muted d-block mt-1">
                                                        Đã chọn: {entry.fileObject.name} ({(entry.fileObject.size / 1024).toFixed(2)} KB)
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
                                                    disabled={isLoading}
                                                    size="sm"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        ))}
                        <Button variant="outline-primary" size="sm" onClick={addFileEntry} disabled={isLoading} className="mt-2 mb-3">
                            <FaPlusCircle className="me-1" /> Thêm File Khác
                        </Button>

                        <div className="mt-4 d-flex justify-content-end">
                            <Button variant="primary" type="submit" disabled={isLoading}>
                                {isLoading ? <><Spinner as="span" animation="border" size="sm" className="me-2" /> Đang lưu...</> : <><FaSave className="me-1" /> Lưu khai báo</>}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DeclareArticlePage;
