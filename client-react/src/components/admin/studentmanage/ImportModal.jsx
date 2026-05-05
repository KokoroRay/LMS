import React, { useState } from "react";
import { Modal, Upload, message as antdMessage } from "antd";
import { InboxOutlined } from "@ant-design/icons";

export default function ImportModal({ open, onClose, onImported, importStudents }) {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <Modal
      title="Import sinh viên từ Excel (.xlsx)"
      open={open}
      onCancel={() => { onClose(); setFileList([]); }}
      onOk={async () => {
        const raw = fileList?.[0]?.originFileObj;
        if (!raw) return antdMessage.warning("Vui lòng chọn file .xlsx");

        const okType =
          raw.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          raw.name.toLowerCase().endsWith(".xlsx");
        if (!okType) return antdMessage.error("File không đúng định dạng .xlsx");

        setLoading(true);
        try {
          await importStudents(raw);
          antdMessage.success("Import thành công");
          setFileList([]);
          onImported();
        } catch (e) {
          antdMessage.error(e?.response?.data?.message || "Import thất bại. Kiểm tra dữ liệu.");
        } finally {
          setLoading(false);
        }
      }}
      okButtonProps={{ loading, disabled: fileList.length === 0 }}
      okText="Import"
      cancelText="Hủy"
    >
      <Upload.Dragger
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        multiple={false}
        beforeUpload={() => false}
        fileList={fileList}
        onChange={({ fileList }) => setFileList(fileList)}
        maxCount={1}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">Kéo thả hoặc nhấn để chọn file .xlsx</p>
        <p className="ant-upload-hint">
          Cột: email, password, firstName, lastName, phone, studentCode, className (header dòng 1)
        </p>
      </Upload.Dragger>
    </Modal>
  );
}
