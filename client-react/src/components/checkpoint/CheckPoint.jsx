import { Card, Table, Typography, Select, Row, Col } from "antd";
import "../../styles/checkpoint.css";

const { Title } = Typography;
const { Option } = Select;

const scoreData = [
  {
    key: "1",
    stt: 1,
    monHoc: "HTML",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "2",
    stt: 2,
    monHoc: "Node.js",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "3",
    stt: 3,
    monHoc: "React.js",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "4",
    stt: 4,
    monHoc: "Web Frontend Fundamental",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "5",
    stt: 5,
    monHoc: "HTML",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "6",
    stt: 6,
    monHoc: "Node.js",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "7",
    stt: 7,
    monHoc: "React.js",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "8",
    stt: 8,
    monHoc: "Web Frontend Fundamental",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "9",
    stt: 9,
    monHoc: "HTML",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "10",
    stt: 10,
    monHoc: "Node.js",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "11",
    stt: 11,
    monHoc: "React.js",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "12",
    stt: 12,
    monHoc: "Web Frontend Fundamental",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
  {
    key: "13",
    stt: 13,
    monHoc: "HTML",
    hk1: 10,
    hk2: 10,
    project: 10,
    tongDiem: 30,
  },
];

const columns = [
  { title: "STT", dataIndex: "stt", key: "stt", align: "center" },
  { title: "Môn học", dataIndex: "monHoc", key: "monHoc" },
  { title: "HK1", dataIndex: "hk1", key: "hk1", align: "center" },
  { title: "HK2", dataIndex: "hk2", key: "hk2", align: "center" },
  { title: "Project", dataIndex: "project", key: "project", align: "center" },
  {
    title: "Tổng điểm",
    dataIndex: "tongDiem",
    key: "tongDiem",
    align: "center",
  },
];

export default function CheckPoint() {
  return (
    <>
      <Row align="middle" justify="space-between" className="checkpoint-header">
        <Col>
          <Title level={3} className="checkpoint-title">
            Bảng điểm
          </Title>
        </Col>
        <Col className="checkpoint-select-col">
          <Select defaultValue="hk1" style={{ width: "100%" }}>
            <Option value="hk1">Học kỳ 1</Option>
            <Option value="hk2">Học kỳ 2</Option>
          </Select>
        </Col>
      </Row>
      <Card
        style={{ borderRadius: 16, boxShadow: "none" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          className="grade-table"
          dataSource={scoreData}
          columns={columns}
          pagination={false}
          scroll={{ y: 600 }}
        />
      </Card>
    </>
  );
}
