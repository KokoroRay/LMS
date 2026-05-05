import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  Input,
  Select,
  Table,
  Button,
  Space,
  message,
  Spin,
  Tag,
  Pagination,
  Tooltip,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { searchExamBankQuestions } from "../../services/examService";
import { debounce } from "lodash";

const { Option } = Select;

const QUESTION_TYPES = {
  MCQ: "MCQ",
  MULTI: "MULTI",
  TRUE_FALSE: "TRUE_FALSE",
  SHORT_ANSWER: "SHORT_ANSWER",
};

const typeLabels = {
  MCQ: "MCQ (Single)",
  MULTI: "MCQ (Multi)",
  TRUE_FALSE: "True/False",
  SHORT_ANSWER: "Short Answer",
};

const ExamBankModal = ({ open, onClose, onAddQuestions }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({ keyword: "", type: null });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  const debouncedFetchQuestions = useMemo(
    () =>
      debounce((page, pageSize, keyword, type) => {
        setLoading(true);
        setSelectedRowKeys([]);
        setSelectedRows([]);
        searchExamBankQuestions({
          keyword: keyword || null,
          type: type || null,
          page: page - 1,
          size: pageSize,
          sort: ["createdAt,desc"],
        })
          .then((resp) => {
            const data = resp.data?.data;
            setQuestions(data?.content || []);
            setPagination((prev) => ({
              ...prev,
              current: data?.number + 1 || 1,
              pageSize: data?.size || pageSize,
              total: data?.totalElements || 0,
            }));
          })
          .catch((err) => {
            // Failed to search questions
            message.error("Lỗi khi tìm kiếm câu hỏi.");
            setQuestions([]);
            setPagination({ current: 1, pageSize: 10, total: 0 });
          })
          .finally(() => setLoading(false));
      }, 500),
    []
  );

  useEffect(() => {
    if (open) {
      debouncedFetchQuestions(
        pagination.current,
        pagination.pageSize,
        filters.keyword,
        filters.type
      );
    } else {
      setQuestions([]);
      setFilters({ keyword: "", type: null });
      setPagination({ current: 1, pageSize: 10, total: 0 });
      setSelectedRowKeys([]);
      setSelectedRows([]);
    }
    return () => debouncedFetchQuestions.cancel();
  }, [open, debouncedFetchQuestions]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };

    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));

    debouncedFetchQuestions(
      1,
      pagination.pageSize,
      newFilters.keyword,
      newFilters.type
    );
  };

  const handleTableChange = (page) => {
    const currentPageSize = pagination.pageSize;
    setPagination((prev) => ({ ...prev, current: page }));
    debouncedFetchQuestions(
      page,
      currentPageSize,
      filters.keyword,
      filters.type
    );
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys);
      setSelectedRows(rows);
    },
  };

  const handleAddSelected = () => {
    if (selectedRows.length === 0) {
      message.warn("Vui lòng chọn ít nhất một câu hỏi.");
      return;
    }
    const questionsToAdd = selectedRows.map((q) => ({
      questionText: q.questionText,
      questionType: q.questionType,
      options: Array.isArray(q.choices) ? q.choices : [],
      correctAnswer:
        q.questionType === QUESTION_TYPES.TRUE_FALSE
          ? q.correctAnswers?.[0] || undefined
          : Array.isArray(q.correctAnswers)
          ? q.correctAnswers
          : [],
    }));
    onAddQuestions(questionsToAdd);
    onClose();
  };

  const columns = [
    {
      title: "Nội dung",
      dataIndex: "questionText",
      key: "questionText",
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: "Loại",
      dataIndex: "questionType",
      key: "questionType",
      width: 150,
      render: (type) => <Tag>{typeLabels[type] || type}</Tag>,
    },
    {
      title: "Điểm",
      dataIndex: "points",
      key: "points",
      width: 80,
    },
    {
      title: "Người tạo",
      dataIndex: "createdByUsername",
      key: "createdByUsername",
      width: 120,
      ellipsis: true,
    },
  ];

  return (
    <Modal
      title="Thêm câu hỏi từ Ngân hàng"
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="back" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleAddSelected}
          disabled={selectedRows.length === 0}
        >
          Thêm {selectedRows.length > 0 ? `(${selectedRows.length})` : ""} câu
          hỏi đã chọn
        </Button>,
      ]}
      destroyOnClose
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo nội dung câu hỏi"
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 300 }}
          value={filters.keyword}
          onChange={(e) => handleFilterChange("keyword", e.target.value)}
        />
        <Select
          placeholder="Lọc theo loại câu hỏi"
          allowClear
          style={{ width: 200 }}
          value={filters.type}
          onChange={(value) => handleFilterChange("type", value)}
        >
          {Object.entries(typeLabels).map(([value, label]) => (
            <Option key={value} value={value}>
              {label}
            </Option>
          ))}
        </Select>
      </Space>
      <Spin spinning={loading}>
        <Table
          rowKey="questionId"
          columns={columns}
          dataSource={questions}
          rowSelection={{ type: "checkbox", ...rowSelection }}
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
          locale={{ emptyText: "Không tìm thấy câu hỏi nào." }}
        />
        {pagination.total > pagination.pageSize && (
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handleTableChange}
            style={{ marginTop: 16, textAlign: "right" }}
            size="small"
          />
        )}
      </Spin>
    </Modal>
  );
};

export default ExamBankModal;
