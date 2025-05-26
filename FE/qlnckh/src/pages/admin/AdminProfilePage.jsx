// src/pages/admin/AdminProfilePage.jsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth'; // Hook để lấy thông tin user
import { Container, Card, ListGroup, Badge, Row, Col, Spinner, Alert } from 'react-bootstrap'; // Import components UI

const AdminProfilePage = () => {
    // Lấy thông tin user và danh sách mã quyền từ AuthContext
    // Đảm bảo AuthContext cung cấp 'user' (object) và 'permissions' (mảng string ma_quyen)
    const { user, permissions, isLoading: isAuthLoading } = useAuth();

    // Hiển thị loading nếu AuthContext chưa sẵn sàng hoặc user chưa có
    if (isAuthLoading || !user) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-2">Đang tải thông tin...</span>
            </Container>
        );
    }

    return (
        <Container fluid>
            {/* Tiêu đề trang */}
            <h2 className="h3 mb-4 text-gray-800">Hồ sơ cá nhân</h2>

            <Row>
                {/* Cột thông tin cơ bản */}
                <Col lg={6} className="mb-4">
                    <Card className="shadow h-100"> {/* Thêm h-100 để card cao bằng nhau */}
                        <Card.Header className="py-3 bg-light border-bottom"> {/* Header màu sáng */}
                            <h6 className="m-0 fw-bold text-primary">Thông tin cơ bản</h6>
                        </Card.Header>
                        <Card.Body>
                            <dl className="row"> {/* Dùng definition list cho đẹp */}
                                <dt className="col-sm-4">Họ và tên:</dt>
                                <dd className="col-sm-8">{user.ho_ten || 'N/A'}</dd>

                                <dt className="col-sm-4">Email:</dt>
                                <dd className="col-sm-8">{user.email || 'N/A'}</dd>

                                <dt className="col-sm-4">MSVC/Username:</dt>
                                <dd className="col-sm-8">{user.msvc || user.username || 'N/A'}</dd>

                                <dt className="col-sm-4">Số điện thoại:</dt>
                                <dd className="col-sm-8">{user.sdt || 'Chưa cập nhật'}</dd>

                                {/* Thêm các thông tin khác nếu cần và có trong object user từ API /api/user */}
                                {/* Ví dụ: */}
                                <dt className="col-sm-4">Đơn vị:</dt>
                                <dd className="col-sm-8">{user.don_vi?.ten || 'N/A'}</dd> 
                                <dt className="col-sm-4">Học hàm:</dt>
                                <dd className="col-sm-8">{user.hoc_ham?.ten || 'N/A'}</dd> 
                                <dt className="col-sm-4">Học vị:</dt>
                                <dd className="col-sm-8">{user.hoc_vi?.ten || 'N/A'}</dd> 
                               
                            </dl>
                            {/* Có thể thêm nút chỉnh sửa thông tin cơ bản ở đây nếu muốn */}
                            {/* <Button variant="outline-primary" size="sm">Chỉnh sửa</Button> */}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Cột thông tin quyền */}
                <Col lg={6} className="mb-4">
                    <Card className="shadow h-100">
                        <Card.Header className="py-3 bg-light border-bottom">
                            <h6 className="m-0 fw-bold text-primary">Quyền truy cập</h6>
                        </Card.Header>
                        <Card.Body>
                            {/* Kiểm tra trạng thái Super Admin */}
                            {user.is_superadmin ? (
                                <div className="text-center p-3">
                                    <Badge bg="danger" pill className="fs-6 px-3 py-2"> {/* Badge to và rõ ràng */}
                                        Super Admin
                                    </Badge>
                                    <p className="mt-2 text-muted">Bạn có toàn quyền truy cập hệ thống.</p>
                                </div>
                            ) : (
                                // Nếu không phải Super Admin, hiển thị quyền chi tiết
                                <>
                                    <p>Bạn được cấp các quyền chi tiết sau:</p>
                                    {/* Kiểm tra permissions có tồn tại và có phần tử không */}
                                    {permissions && permissions.length > 0 ? (
                                        // Hiển thị danh sách quyền
                                        <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {permissions.map((permCode) => (
                                                <ListGroup.Item key={permCode} className="d-flex justify-content-between align-items-center">
                                                    {permCode}
                                                    {/* Có thể thêm mô tả nếu lấy được từ API /api/user */}
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        // Thông báo nếu không có quyền chi tiết nào
                                        <Alert variant="info" className="mb-0">Bạn không có quyền quản trị chi tiết nào được gán.</Alert>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

             {/* Có thể thêm các Card khác cho các thông tin liên quan */}
             {/* Ví dụ: Card đổi mật khẩu */}

        </Container>
    );
};

export default AdminProfilePage;
