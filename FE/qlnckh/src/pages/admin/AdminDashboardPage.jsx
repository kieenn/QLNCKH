import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Container, Row, Col, Card, Button } from 'react-bootstrap'; // Import components
import { FaUsers, FaFileSignature, FaBookOpen } from 'react-icons/fa';

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
                        <Icon size={32} className="text-gray-300" />
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    </Col>
);


const AdminDashboardPage = () => {
    const { user } = useAuth();

    return (
        <Container fluid>
            {/* Page Heading */}
            <Row className="align-items-center justify-content-between mb-4">
                <Col xs="auto">
                    <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
                </Col>
                {/* <Col xs="auto">
                    <Button variant="primary" size="sm" className="shadow-sm">Generate Report</Button>
                </Col> */}
            </Row>

            {/* Content Row - Cards */}
            <Row>
                <DashboardCard title="Giảng viên" value="[Số liệu]" icon={FaUsers} borderColor="primary" />
                <DashboardCard title="Đề tài chờ duyệt" value="[Số liệu]" icon={FaBookOpen} borderColor="success" />
                <DashboardCard title="Khai báo mới" value="[Số liệu]" icon={FaFileSignature} borderColor="info" />
                {/* Thêm các DashboardCard khác nếu cần */}
            </Row>

            {/* Content Row - Other sections */}
            <Row>
                <Col lg={6} className="mb-4">
                    <Card className="shadow mb-4">
                        <Card.Header className="py-3">
                             <h6 className="m-0 fw-bold text-primary">Hoạt động gần đây</h6>
                        </Card.Header>
                        <Card.Body>
                           <Card.Text>
                                Nội dung về các hoạt động gần đây...
                           </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                 <Col lg={6} className="mb-4">
                     <Card className="shadow mb-4">
                        <Card.Header className="py-3">
                            <h6 className="m-0 fw-bold text-primary">Thông báo quan trọng</h6>
                        </Card.Header>
                        <Card.Body>
                            <Card.Text>
                                Nội dung các thông báo quan trọng...
                            </Card.Text>
                        </Card.Body>
                    </Card>
                 </Col>
            </Row>
        </Container>
    );
};

export default AdminDashboardPage;
