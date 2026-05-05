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
  Form,
  Input,
  Upload,
} from "antd";
import {
  TrophyOutlined,
  DownloadOutlined,
  FlagOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import {
  fetchCertificatesByStudent,
  submitCertificateAppeal,
} from "../../services/certificateService";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export default function MyCertificatePage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const [isAppealModalVisible, setIsAppealModalVisible] = useState(false);
  const [selectedCertForAppeal, setSelectedCertForAppeal] = useState(null);
  const [appealForm] = Form.useForm();
  const [appealLoading, setAppealLoading] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const studentId = useMemo(() => user?.userId || user?.id, [user]);

  const loadCertificates = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await fetchCertificatesByStudent(studentId);
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
  }, [studentId, selectedFilter]);

  const handleDownload = (record) => {
    if (record.certificateUrl) {
      window.open(record.certificateUrl, "_blank");
      message.success("Bắt đầu tải xuống chứng chỉ.");
    } else {
      message.warning("Chứng chỉ chưa có file PDF/Ảnh.");
    }
  };

  const showAppealModal = (record) => {
    setSelectedCertForAppeal(record);
    setIsAppealModalVisible(true);
    appealForm.resetFields();
  };

  const handleCancelAppeal = () => {
    setIsAppealModalVisible(false);
    appealForm.resetFields();
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const handleAppealSubmit = async (values) => {
    if (!selectedCertForAppeal) return;

    setAppealLoading(true);

    const formData = new FormData();
    formData.append("reason", values.reason);

    const fileListFromForm = values.proof || [];
    const proofFileObject = fileListFromForm[0]?.originFileObj;

    if (proofFileObject) {
      formData.append("proofFile", proofFileObject, proofFileObject.name);
    } else {
      message.error("Lỗi: File minh chứng là bắt buộc!");
      setAppealLoading(false);
      return;
    }

    try {
      await submitCertificateAppeal(
        selectedCertForAppeal.certificateId,
        formData
      );
      message.success("Đã gửi khiếu nại thành công.");
      handleCancelAppeal();
      loadCertificates();
    } catch (error) {
      message.error("Không thể gửi khiếu nại. Vui lòng thử lại.");
    } finally {
      setAppealLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      return false;
    },
    maxCount: 1,
    accept: "image/png, image/jpeg, application/pdf",
  };

  const columns = [
    {
      title: "Mã chứng chỉ",
      dataIndex: "certificateCode",
      key: "certificateCode",
      sorter: (a, b) => a.certificateCode.localeCompare(b.certificateCode),
    },
    {
      title: "Khóa học",
      dataIndex: "categoryName",
      key: "categoryName",
    },
    {
      title: "Lớp học",
      dataIndex: "className",
      key: "className",
    },
    {
      title: "Ngày cấp",
      dataIndex: "issueDate",
      key: "issueDate",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "N/A"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        if (status === "ACTIVE") return <Tag color="green">Đã cấp</Tag>;

        if (status === "REVOKED") {
          return (
            <Tooltip
              title={`Lý do: ${
                record.revocationReason || "Không có lý do cụ thể"
              }`}
            >
              <Tag color="red">Đã thu hồi</Tag>
            </Tooltip>
          );
        }

        if (status === "PENDING_REVIEW")
          return <Tag color="blue">Đang xem xét</Tag>;

        return <Tag color="default">{status}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      align: "center",
      render: (text, record) => (
        <Space size="small">
          <Tooltip title="Tải xuống chứng chỉ">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              disabled={!record.certificateUrl || record.status !== "ACTIVE"}
              type={record.status === "ACTIVE" ? "primary" : "default"}
            />
          </Tooltip>

          {record.status === "REVOKED" && (
            <Tooltip title="Gửi khiếu nại về quyết định thu hồi">
              <Button
                icon={<FlagOutlined />}
                onClick={() => showAppealModal(record)}
              />
            </Tooltip>
          )}

          {record.status === "PENDING_REVIEW" && (
            <Tooltip title="Đã gửi khiếu nại">
              <Button type="text" icon={<FlagOutlined />} disabled />
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
          "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
        flexWrap: "wrap",
        gap: 12,
      }}
      className="responsive-header-box"
    >
      <Title
        level={4}
        style={{
          margin: 0,
          display: "flex",
          alignItems: "center",
          fontWeight: 600,
          fontSize: "1.25rem",
        }}
      >
        <TrophyOutlined
          style={{ marginRight: 8, color: "rgb(24, 144, 255)" }}
        />
        <span className="mobile-hide-text">Danh sách Chứng chỉ đã nhận</span>
        <span className="desktop-hide-text">Chứng chỉ</span>
      </Title>

      <Space wrap size="middle">
        <Space size={4} align="center" wrap>
          <Text style={{ fontWeight: 500 }} className="mobile-hide-text">Lọc trạng thái:</Text>
          <Select
            style={{ width: 150, minWidth: 120 }}
            value={selectedFilter}
            onChange={setSelectedFilter}
            size="small"
          >
            <Option value="all">Tất cả</Option>
            <Option value="ACTIVE">Đã cấp</Option>
            <Option value="REVOKED">Đã thu hồi</Option>
            <Option value="PENDING_REVIEW">Đang xem xét</Option>
          </Select>
        </Space>
      </Space>
    </div>
  );

  return (
    <>
      <div className="main-content">
        {ControlsHeader}

        <Card bordered={false} style={{ borderRadius: 8 }}>
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={certificates.filter((cert) => {
                if (selectedFilter === "all") return true;
                return cert.status === selectedFilter;
              })}
              rowKey="certificateId"
              pagination={{ pageSize: 10 }}
              scroll={{ x: "max-content" }}
              locale={{ emptyText: "Bạn chưa nhận được chứng chỉ nào." }}
            />
          </Spin>
        </Card>
      </div>

      <Modal
        title="Gửi Khiếu nại Thu hồi Chứng chỉ"
        open={isAppealModalVisible}
        onCancel={handleCancelAppeal}
        onOk={() => appealForm.submit()}
        okText="Gửi khiếu nại"
        cancelText="Hủy"
        confirmLoading={appealLoading}
      >
        <p>
          Bạn đang khiếu nại về chứng chỉ{" "}
          <strong>{selectedCertForAppeal?.certificateCode}</strong>.
        </p>
        <p>
          Vui lòng cung cấp lý do và tệp minh chứng (ảnh hoặc PDF) cho quyết
          định thu hồi này.
        </p>
        <Form
          form={appealForm}
          layout="vertical"
          onFinish={handleAppealSubmit}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="reason"
            label="Lý do khiếu nại"
            rules={[
              { required: true, message: "Vui lòng nhập lý do khiếu nại!" },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Tôi không gian lận vì..." />
          </Form.Item>
          <Form.Item
            name="proof"
            label="Minh chứng đính kèm (Ảnh/PDF)"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[
              { required: true, message: "Vui lòng tải lên file minh chứng!" },
            ]}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                Chọn file (Ảnh hoặc PDF)
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
