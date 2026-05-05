import React from "react";
import { Form, InputNumber, Button, Space, DatePicker } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export default function ManageExamSlots({ form, isEditing }) {
  return (
    <Form.List name="examSlots">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }, index) => {
            return (
              <Space
                key={key}
                style={{
                  display: "flex",
                  marginBottom: 8,
                  alignItems: "baseline",
                  flexWrap: "wrap",
                }}
                align="baseline"
              >
                {/* SLOT TIME */}
                <Form.Item
                  {...restField}
                  name={[name, "slotTime"]}
                  label="Slot Time"
                  rules={[
                    { required: true, message: "Missing slot time" },
                    {
                      validator(_, value) {
                        if (!value) return Promise.reject("Missing slot time");
                        if (!dayjs.isDayjs(value))
                          return Promise.reject("Invalid date");
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DDTHH:mm:ss"
                    placeholder="Select Slot Time"
                    style={{ minWidth: "220px" }}
                  />
                </Form.Item>

                {/* MAX PARTICIPANTS */}
                <Form.Item
                  {...restField}
                  name={[name, "maxParticipants"]}
                  label="Max Participants"
                  rules={[
                    { required: true, message: "Missing max" },
                    { type: "number", min: 1, message: "Must be >= 1" },
                  ]}
                >
                  <InputNumber placeholder="Max" style={{ width: "100px" }} />
                </Form.Item>

                <MinusCircleOutlined
                  onClick={() => remove(name)}
                  style={{ marginLeft: 8, color: "red", cursor: "pointer" }}
                />
              </Space>
            );
          })}

          {/* ADD BUTTON */}
          <Form.Item>
            <Button
              type="dashed"
              onClick={() =>
                add({
                  slotTime: null,
                  maxParticipants: 10,
                })
              }
              block
              icon={<PlusOutlined />}
            >
              Add Exam Slot
            </Button>
          </Form.Item>
        </>
      )}
    </Form.List>
  );
}
