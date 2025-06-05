import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Container, Row, Col, Card, Button, Spinner, Alert, ListGroup } from 'react-bootstrap'; // Import components
import { FaUsers, FaFileSignature, FaBookOpen } from 'react-icons/fa';
import { getDashboardStats } from '../../api/adminApi'; // Import API function

// Component hiển thị thẻ số liệu
const DashboardCard = ({ title, value, icon: Icon, borderColor = 'primary' }) => (
    <Col xl={3} md={6} className="mb-4">
        <Card border={borderColor} className={`shadow h-100 py-2 border-start border-${borderColor} border-4`}> {/* Thêm class border-start và độ dày */}
            <Card.Body>
                <Row className="g-0 align-items-center">
                    <Col className="me-2">
                        <div className={`text-xs fw-bold text-${borderColor} text-uppercase mb-1`}>
                            {title}
                        </div>
                        <div className="h5 mb-0 fw-bold text-gray-800">{value}</div>
                    </Col>
                    <Col xs="auto">
                        <Icon size={32} className={`text-${borderColor}`} /> {/* Sử dụng màu border cho icon */}
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    </Col>
);

// Hàm định dạng ngày tháng (có thể chuyển vào file utils dùng chung)
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        // Sử dụng toLocaleString để hiển thị ngày giờ theo định dạng địa phương
        return new Date(dateString).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) { return 'Invalid Date'; }
};


const AdminDashboardPage = () => {
    const { user } = useAuth(); // Lấy thông tin user nếu cần hiển thị tên admin
    const [stats, setStats] = useState(null); // State lưu trữ dữ liệu thống kê
    const [loading, setLoading] = useState(true); // State loading
    const [error, setError] = useState(null); // State lỗi

    // Effect hook để fetch dữ liệu khi component mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true); // Bắt đầu tải, set loading true
                setError(null); // Reset lỗi
                const response = await getDashboardStats(); // Gọi API
                setStats(response.data); // Lưu dữ liệu vào state
            } catch (err) {
                // Xử lý lỗi
                setError(err.response?.data?.message || err.message || "Không thể tải dữ liệu dashboard.");
                console.error("Error fetching dashboard stats:", err);
            } finally {
                setLoading(false); // Kết thúc tải, set loading false
            }
        };

        fetchStats(); // Gọi hàm fetch khi component mount
    }, []); // Dependency array rỗng để chỉ chạy 1 lần khi mount

    // Hiển thị spinner khi đang tải dữ liệu
    if (loading) {
        return (
            <Container fluid className="p-4 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Đang tải dữ liệu dashboard...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="p-4">
            {/* Page Heading */}
            <Row className="align-items-center justify-content-between mb-4">
                <Col xs="auto">
                    <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
                </Col>
                {/* Có thể thêm nút Generate Report nếu cần */}
                {/* <Col xs="auto">
                    <Button variant="primary" size="sm" className="shadow-sm">Generate Report</Button>
                </Col> */}
            </Row>

            {/* Hiển thị lỗi nếu có */}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Content Row - Cards hiển thị số liệu thống kê */}
            <Row>
                <DashboardCard
                    title="Giảng viên"
                    value={stats?.lecturersCount ?? 'N/A'} // Sử dụng optional chaining và fallback 'N/A'
                    icon={FaUsers}
                    borderColor="primary"
                />
                <DashboardCard
                    title="Đề tài chờ duyệt"
                    value={stats?.pendingProjectsCount ?? 'N/A'}
                    icon={FaBookOpen}
                    borderColor="success"
                />
                <DashboardCard
                    title="Bài báo chờ duyệt"
                    value={stats?.pendingArticlesCount ?? 'N/A'}
                    icon={FaFileSignature}
                    borderColor="info"
                />
                {/* Thêm các DashboardCard khác nếu cần */}
            </Row>

            {/* Content Row - Các phần khác (Hoạt động gần đây) */}
            <Row>
                <Col lg={12} className="mb-4"> {/* Sử dụng toàn bộ chiều rộng cho Hoạt động gần đây */}
                    <Card className="shadow mb-4">
                        <Card.Header className="py-3 bg-light text-primary">
                             <h6 className="m-0 fw-bold">Hoạt động gần đây</h6>
                        </Card.Header>
                        <Card.Body>
                            {/* Hiển thị danh sách hoạt động gần đây */}
                            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                                <ListGroup variant="flush">
                                    {stats.recentActivities.map(activity => (
                                        <ListGroup.Item key={activity.id} className="px-0">
                                            <div className="d-flex w-100 justify-content-between">
                                                <h6 className="mb-1 small">
                                                    {/* Hiển thị tên admin nếu có */}
                                                    <strong>{activity.admin?.ho_ten || 'Admin'}</strong> {activity.hanh_dong}
                                                    {/* Hiển thị đối tượng và ID nếu có */}
                                                    {activity.doi_tuong && ` (${activity.doi_tuong}${activity.doi_tuong_id ? `: ${activity.doi_tuong_id}` : ''})`}
                                                </h6>
                                                {/* Hiển thị thời gian */}
                                                <small className="text-muted">{formatDate(activity.thoi_gian)}</small>
                                            </div>
                                            {/* Có thể thêm chi tiết nội dung trước/sau nếu muốn hiển thị */}
                                            {/* <p className="mb-1 small text-muted">Chi tiết nếu có...</p> */}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                // Thông báo nếu không có hoạt động nào
                                <Card.Text className="text-muted">Không có hoạt động nào gần đây.</Card.Text>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                 {/* Cột "Thông báo quan trọng" đã được loại bỏ */}
            </Row>
        </Container>
    );
};

export default AdminDashboardPage;
