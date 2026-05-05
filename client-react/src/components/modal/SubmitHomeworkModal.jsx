// src/pages/student/homework/SubmitHomeworkModal.jsx
import { Modal, Row, Col, Input, Typography, Form } from "antd";
import { UploadOutlined, PaperClipOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const { Title } = Typography;

const SubmitHomeworkModal = ({
  open,
  onCancel,
  onSubmit = () => {},
  courseName = "",
  sessionTitle = "",
  defaultGithubUrl = "",
}) => {
  const [form] = Form.useForm();

  const handleOk = () => form.submit();

  return (
    <Modal
      className="submit-modal"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Nộp bài"
      okButtonProps={{ icon: <UploadOutlined /> }}
      width={720}
      centered
    >
      <Row style={{ marginBottom: 8 }}>
        <Col span={24}>
          <Title level={3} style={{ marginBottom: 0 }}>
            Nộp bài
          </Title>
        </Col>
      </Row>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ githubUrl: defaultGithubUrl }}
        onFinish={(vals) => onSubmit({ githubUrl: vals.githubUrl?.trim() })}
      >
        <Form.Item label="Môn học">
          <Input value={courseName} readOnly />
        </Form.Item>

        {/* Chương học / Phần */}
        <Form.Item label="Chương học">
          <Input value={sessionTitle} readOnly />
        </Form.Item>

        <Form.Item
          label="Link GitHub"
          name="githubUrl"
          rules={[
            { required: true, message: "Vui lòng dán link GitHub." },
            { type: "url", message: "Định dạng URL không hợp lệ." },
            {
              validator: (_, v) =>
                !v || /github\.com/i.test(v)
                  ? Promise.resolve()
                  : Promise.reject(new Error("Link phải là GitHub.")),
            },
          ]}
        >
          <Input
            allowClear
            prefix={<PaperClipOutlined />}
            placeholder="https://github.com/username/repo hoặc link đến folder/bài"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

SubmitHomeworkModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  courseName: PropTypes.string,
  sessionTitle: PropTypes.string,
  defaultGithubUrl: PropTypes.string,
};

export default SubmitHomeworkModal;
