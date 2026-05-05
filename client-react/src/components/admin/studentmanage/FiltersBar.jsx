import React from "react";
import { Space, Input, Select, Tooltip, Button } from "antd";
import {
  AppstoreOutlined, TableOutlined, SortAscendingOutlined, SortDescendingOutlined,
  ReloadOutlined, ImportOutlined, PlusOutlined, FilterOutlined
} from "@ant-design/icons";

export default function FiltersBar({
  q, setQ,
  sortDir, setSortDir,
  onRefresh, onImport, onCreate,
  statusFilter, setStatusFilter,
  classFilter, setClassFilter,
  genderFilter, setGenderFilter,
  statusOptions, classOptions, genderOptions,
  resetFilters
}) {
  return (
    <Space wrap>
      <Input.Search
        allowClear
        placeholder="Tìm theo tên, email, mã SV, lớp..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ maxWidth: 420 }}
      />

      <Button onClick={resetFilters}>Reset</Button>

      <Tooltip title={`Sort: ${sortDir.toUpperCase()}`}>
        <Button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          icon={sortDir === "asc" ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
        />
      </Tooltip>

      <Button icon={<ReloadOutlined />} onClick={onRefresh}>Refresh</Button>
      <Button icon={<ImportOutlined />} onClick={onImport}>Import Excel</Button>
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>New Student</Button>
    </Space>
  );
}
