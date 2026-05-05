import React from "react";
import { Form, Input, Button, Space, Row, Col, Typography } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function McqOptionsManager({ questionFieldName }) {
  return (
    <Row
      gutter={16}
      style={{
        marginTop: "8px",
        paddingLeft: "24px",
        borderLeft: "3px solid #f0f0f0",
      }}
    >
      <Col xs={24} md={12}>
        <Form.List name={[questionFieldName, "options"]}>
          {(fields, { add, remove }) => (
            <>
              <Form.Item
                label="Lựa chọn"
                tooltip="Nhập văn bản cho mỗi lựa chọn"
              >
                {fields.map(
                  (
                    { key, name, ...restField },
                    index // Destructure key here
                  ) => (
                    <Space
                      key={key} // <<< SỬA 1: Truyền key trực tiếp vào Space
                      align="baseline"
                      style={{ display: "flex", marginBottom: 8 }}
                    >
                      <Form.Item
                        {...restField} // <<< SỬA 2: Spread phần còn lại (không có key)
                        name={name} // Pass name explicitly
                        rules={[
                          {
                            required: true,
                            message: "Lựa chọn không được để trống!",
                          },
                        ]}
                        style={{ flexGrow: 1 }}
                        // You might need fieldKey={fieldKey} if using advanced validation
                      >
                        <Input placeholder={`Option ${index + 1}`} />
                      </Form.Item>
                      {fields.length > 2 && (
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          title="Remove option"
                          style={{ color: "red", cursor: "pointer" }}
                        />
                      )}
                    </Space>
                  )
                )}
                <Button
                  type="dashed"
                  onClick={() => add("")}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm lựa chọn
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Col>
      <Col xs={24} md={12}>
        <Form.List name={[questionFieldName, "correctAnswer"]}>
          {(fields, { add, remove }) => (
            <>
              <Form.Item
                label="Đáp án đúng"
                tooltip="Nhập chính xác văn bản của các lựa chọn đúng"
              >
                {fields.map(
                  (
                    { key, name, ...restField },
                    index // Destructure key here
                  ) => (
                    <Space
                      key={key} // <<< SỬA 3: Truyền key trực tiếp vào Space
                      align="baseline"
                      style={{ display: "flex", marginBottom: 8 }}
                    >
                      <Form.Item
                        {...restField} // <<< SỬA 4: Spread phần còn lại (không có key)
                        name={name} // Pass name explicitly
                        rules={[
                          {
                            required: true,
                            message: "Đáp án đúng không được để trống!",
                          },
                        ]}
                        style={{ flexGrow: 1 }}
                        // You might need fieldKey={fieldKey} if using advanced validation
                      >
                        <Input placeholder={`Đáp án đúng ${index + 1}`} />
                      </Form.Item>
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        title="Xóa đáp án đúng"
                        style={{ color: "red", cursor: "pointer" }}
                      />
                    </Space>
                  )
                )}
                <Button
                  type="dashed"
                  onClick={() => add("")}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm câu trả lời đúng
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Text type="secondary">
          Đối với nhiều đáp án đúng, hãy thêm từng đáp án một.
        </Text>
      </Col>
    </Row>
  );
}
