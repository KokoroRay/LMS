import { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Table,
  Tag,
  message,
  Spin,
  Card,
  Space,
  Button,
  Tooltip,
  Modal,
  Select,
  Input,
  Form,
} from "antd";
import {
  TrophyOutlined,
  DownloadOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  CheckOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import {
  fetchAllCertificatesAdmin,
  revokeCertificateAdmin,
  processCertificateAppeal,
} from "../../../services/certificateService";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AppealDecisionModal = ({
  visible,
  onCancel,
  cert,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm();
  const [decision, setDecision] = useState(null);

  const handleFormSubmit = (values) => {
    if (!decision) {
      message.warning("Vui lòng chọn kết quả xem xét.");
      return;
    }
    onSubmit(cert.certificateId, decision, values.adminFeedback);
  };

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setDecision(null);
    }
  }, [visible, form]);

  if (!cert) return null;

  return (
    <Modal
      title={`Xử lý Khiếu nại: ${cert.certificateCode}`}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={decision === "APPROVE" ? "XÁC NHẬN CẤP LẠI" : "TỪ CHỐI THU HỒI"}
      cancelText="Hủy"
      okButtonProps={{
        loading: loading,
        danger: decision === "REJECT",
        type: decision === "APPROVE" ? "primary" : "default",
        disabled: !decision,
      }}
    >
      <p>
        <strong>Học viên:</strong> {cert.studentName}
      </p>
      <p>
        <strong>Lý do bị thu hồi:</strong> {cert.revocationReason || "N/A"}
      </p>

      <Card
        title="Chi tiết Khiếu nại"
        size="small"
        style={{ marginBottom: 15 }}
      >
        <p>
          <strong>Lý do Khiếu nại:</strong> {cert.appealReason}
        </p>
        <p>
          <strong>Minh chứng:</strong>
          {cert.appealProofUrl ? (
            <a
              href={cert.appealProofUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {" "}
              Xem File đính kèm <EyeOutlined />
            </a>
          ) : (
            "Không có file đính kèm."
          )}
        </p>
      </Card>

      <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
        <Form.Item label="Kết quả Xem xét" required>
          <Space>
            <Button
              type={decision === "APPROVE" ? "primary" : "default"}
              onClick={() => setDecision("APPROVE")}
            >
              <CheckOutlined /> Duyệt (Khôi phục)
            </Button>
            <Button
              type={decision === "REJECT" ? "primary" : "default"}
              danger
              onClick={() => setDecision("REJECT")}
            >
              <CloseCircleOutlined /> Từ chối
            </Button>
          </Space>
        </Form.Item>
        <Form.Item
          name="adminFeedback"
          label="Phản hồi chính thức"
          rules={[
            {
              required: true,
              message: "Cần cung cấp phản hồi chính thức cho học viên.",
            },
          ]}
        >
          <TextArea
            rows={3}
            placeholder="Phản hồi này sẽ được gửi qua email cho học viên."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default function AdminCertificatePage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ searchTerm: "", status: "all" });

  const [isRevokeModalVisible, setIsRevokeModalVisible] = useState(false);
  const [isAppealDecisionModalVisible, setIsAppealDecisionModalVisible] =
    useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [revokeForm] = Form.useForm();

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const res = await fetchAllCertificatesAdmin();
      setCertificates(res.data || []);
    } catch (error) {
      message.error("Lỗi khi tải danh sách chứng chỉ.");
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const filteredCertificates = useMemo(() => {
    const { searchTerm, status } = filters;
    return certificates.filter((cert) => {
      const term = searchTerm.toLowerCase();
      const studentName = cert.studentName?.toLowerCase() || "";
      const courseName = cert.categoryName?.toLowerCase() || "";
      const certCode = cert.certificateCode?.toLowerCase() || "";

      const matchesSearch =
        studentName.includes(term) ||
        courseName.includes(term) ||
        certCode.includes(term);

      const matchesStatus =
        status === "all" || cert.status.toUpperCase() === status.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [certificates, filters]);

  const handleDownload = (record) => {
    if (record.certificateUrl) {
      window.open(record.certificateUrl, "_blank");
      message.success("Bắt đầu tải xuống chứng chỉ.");
    } else {
      message.warning("Chứng chỉ chưa có file PDF/ảnh để tải.");
    }
  };

  const showRevokeModal = (record) => {
    setSelectedCertificate(record);
    setIsRevokeModalVisible(true);
  };

  const showDecisionModal = (record) => {
    setSelectedCertificate(record);
    setIsAppealDecisionModalVisible(true);
  };

  const handleRevokeSubmit = async (values) => {
    const { reason } = values;
    if (!selectedCertificate) return;

    try {
      setLoading(true);
      await revokeCertificateAdmin(selectedCertificate.certificateId, reason);
      message.success(
        "Chứng chỉ đã được thu hồi và email thông báo đã được gửi."
      );
      setIsRevokeModalVisible(false);
      revokeForm.resetFields();
      loadCertificates();
    } catch (error) {
      message.error("Lỗi khi thu hồi chứng chỉ.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAppeal = async (
    certificateId,
    decision,
    adminFeedback
  ) => {
    try {
      setLoading(true);
      await processCertificateAppeal(certificateId, decision, adminFeedback);

      if (decision === "APPROVE") {
        message.success(
          `Đã khôi phục chứng chỉ ${certificateId}. Email đã được gửi.`
        );
      } else {
        message.warning(
          `Đã từ chối khiếu nại ${certificateId}. Email đã được gửi.`
        );
      }

      setIsAppealDecisionModalVisible(false);
      loadCertificates();
    } catch (error) {
      message.error("Lỗi khi xử lý khiếu nại.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Học viên",
      dataIndex: "studentName",
      key: "studentName",
      sorter: (a, b) =>
        (a.studentName || "").localeCompare(b.studentName || ""),
      width: 150,
    },
    {
      title: "Mã chứng chỉ",
      dataIndex: "certificateCode",
      key: "certificateCode",
      sorter: (a, b) => a.certificateCode.localeCompare(b.certificateCode),
      width: 200,
    },
    {
      title: "Khóa học",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 150,
    },
    {
      title: "Lý do thu hồi",
      dataIndex: "revocationReason",
      key: "revocationReason",
      width: 200,
      render: (reason) => <Text>{reason || "N/A"}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        let color = "default";
        if (status === "ACTIVE") color = "green";
        if (status === "REVOKED") color = "red";
        if (status === "PENDING_REVIEW") color = "blue";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      align: "center",
      render: (text, record) => (
        <Space size="small">
          <Tooltip title="Tải xuống chứng chỉ">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              disabled={record.status !== "ACTIVE"}
              type={record.status === "ACTIVE" ? "primary" : "default"}
            />
          </Tooltip>

          {record.status === "PENDING_REVIEW" ? (
            <Tooltip title="Xử lý Khiếu nại">
              <Button
                icon={<CheckOutlined />}
                type="primary"
                ghost
                onClick={() => showDecisionModal(record)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Thu hồi chứng chỉ">
              <Button
                icon={<CloseCircleOutlined />}
                danger
                onClick={() => showRevokeModal(record)}
                disabled={record.status === "REVOKED"}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const ControlsHeader = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        marginTop: 16,
        padding: "16px 24px",
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow:
          "0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)",
      }}
      className="responsive-header-box"
    >
      <Title
        level={4}
        style={{ margin: 0, display: "flex", alignItems: "center" }}
      >
        <TrophyOutlined
          style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
        />
        Quản lý Chứng chỉ
      </Title>
      <Space wrap size="middle">
        <Input
          placeholder="Tìm theo tên, khóa học, mã..."
          prefix={<SearchOutlined />}
          style={{ width: 250 }}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
          }
        />
        <Select
          style={{ width: 150 }}
          value={filters.status}
          onChange={(value) =>
            setFilters((prev) => ({ ...prev, status: value }))
          }
        >
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="ACTIVE">Active</Option>
          <Option value="REVOKED">Revoked</Option>
          <Option value="PENDING_REVIEW">Đang xem xét</Option>
        </Select>
      </Space>
    </div>
  );

  return (
    <>
      <div className="main-content">
        <div className="desktop-only">{ControlsHeader}</div>
        <Card
          bordered={false}
          style={{
            borderRadius: 8,
            boxShadow:
              "0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={filteredCertificates}
              rowKey="certificateId"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: "max-content" }}
              locale={{ emptyText: "Không tìm thấy chứng chỉ nào." }}
            />
          </Spin>
        </Card>
      </div>

      <Modal
        title="Xác nhận Thu hồi Chứng chỉ"
        open={isRevokeModalVisible}
        onCancel={() => {
          setIsRevokeModalVisible(false);
          revokeForm.resetFields();
        }}
        onOk={() => revokeForm.submit()}
        okText="Thu hồi"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: loading }}
      >
        <p>
          Bạn sắp thu hồi chứng chỉ:{" "}
          <strong>{selectedCertificate?.certificateCode}</strong> của học viên{" "}
          <strong>{selectedCertificate?.studentName}</strong>.
        </p>
        <p>
          Hành động này không thể hoàn tác và sẽ gửi email thông báo cho học
          viên.
        </p>
        <Form
          form={revokeForm}
          layout="vertical"
          onFinish={handleRevokeSubmit}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="reason"
            label="Lý do thu hồi"
            rules={[
              { required: true, message: "Vui lòng nhập lý do thu hồi!" },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Phát hiện lỗi dữ liệu điểm."
            />
          </Form.Item>
        </Form>
      </Modal>

      <AppealDecisionModal
        visible={isAppealDecisionModalVisible}
        onCancel={() => setIsAppealDecisionModalVisible(false)}
        cert={selectedCertificate}
        onSubmit={handleProcessAppeal}
        loading={loading}
      />
    </>
  );
}
