import React from "react";
import {
  Form,
  Input,
  Button,
  Space,
  Row,
  Col,
  Checkbox,
  Card,
  Typography,
  Empty,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  EyeInvisibleOutlined,
  CodeOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function TestCaseManager({ questionFieldName }) {
  return (
    <div
      style={{
        marginTop: "16px",
        padding: "20px",
        backgroundColor: "#fafafa",
        borderRadius: "8px",
        border: "1px solid #f0f0f0",
      }}
    >
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
        <CodeOutlined style={{ marginRight: 8, fontSize: 16 }} />
        <Text strong style={{ fontSize: 16 }}>
          Quản lý Test Cases
        </Text>
        <Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
          (Dùng để chấm điểm tự động)
        </Text>
      </div>

      <Form.List name={[questionFieldName, "testCases"]}>
        {(fields, { add, remove }) => (
          <>
            {fields.length === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có Test Case nào"
                style={{ marginBottom: 16 }}
              />
            )}

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {fields.map(({ key, name, ...restField }, index) => (
                <Card
                  key={key}
                  size="small"
                  type="inner"
                  title={
                    <Space>
                      <Text strong>Test Case #{index + 1}</Text>
                    </Space>
                  }
                  extra={
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                      title="Xóa Test Case này"
                    />
                  }
                  style={{
                    borderColor: "#d9d9d9",
                    borderRadius: "6px",
                  }}
                  headStyle={{
                    backgroundColor: "#f5f5f5",
                    borderBottom: "1px solid #e8e8e8",
                  }}
                >
                  <Row gutter={16}>
                    {/* INPUT COLUMN */}
                    <Col xs={24} md={12}>
                      <Form.Item
                        {...restField}
                        name={[name, "input"]}
                        label={<Text strong>Input</Text>}
                        rules={[{ required: true, message: "Bắt buộc!" }]}
                        style={{ marginBottom: 8 }}
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Nhập dữ liệu đầu vào (VD: [1, 2, 3])"
                          style={{
                            fontFamily: "'Fira Code', 'Consolas', monospace",
                            fontSize: "13px",
                            backgroundColor: "#fff",
                          }}
                        />
                      </Form.Item>
                    </Col>

                    {/* OUTPUT COLUMN */}
                    <Col xs={24} md={12}>
                      <Form.Item
                        {...restField}
                        name={[name, "expectedOutput"]}
                        label={<Text strong>Expected Output</Text>}
                        rules={[{ required: true, message: "Bắt buộc!" }]}
                        style={{ marginBottom: 8 }}
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Kết quả mong đợi (VD: 6)"
                          style={{
                            fontFamily: "'Fira Code', 'Consolas', monospace",
                            fontSize: "13px",
                            backgroundColor: "#fff",
                            color: "#389e0d", // Màu xanh lá nhẹ để ám chỉ output đúng
                          }}
                        />
                      </Form.Item>
                    </Col>

                    {/* HIDDEN CHECKBOX */}
                    <Col span={24}>
                      <Form.Item
                        {...restField}
                        name={[name, "isHidden"]}
                        valuePropName="checked"
                        style={{ marginBottom: 0, marginTop: 4 }}
                      >
                        <Checkbox>
                          <Space>
                            <EyeInvisibleOutlined />
                            <span>
                              Ẩn Test Case này với sinh viên (Dùng để chấm điểm
                              bí mật)
                            </span>
                          </Space>
                        </Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>

            <Button
              type="dashed"
              onClick={() =>
                add({ input: "", expectedOutput: "", isHidden: false })
              }
              block
              icon={<PlusOutlined />}
              style={{ marginTop: 16, height: 40 }}
            >
              Thêm Test Case Mới
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
}
