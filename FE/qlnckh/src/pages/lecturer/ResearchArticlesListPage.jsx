import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Table, Badge, Row, Col } from 'react-bootstrap'; // Removed Modal, Form, ListGroup
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

    // States related to edit modal are removed as editing will be on a separate page

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

    const handleEditClick = (articleIdToEdit) => {
        // researchId is available from useParams()
        navigate(`/lecturer/research/${researchId}/article/${articleIdToEdit}/edit`);
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
                                                <Button variant="outline-warning" size="sm" onClick={() => handleEditClick(article.id)}>
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
        </Container>
    );
};

export default ResearchArticlesListPage;
