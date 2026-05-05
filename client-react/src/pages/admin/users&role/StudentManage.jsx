import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  getStudents as apiGetStudents,
  createStudent as apiCreateStudent,
  updateStudent as apiUpdateStudent,
  deleteStudent as apiDeleteStudent,
  checkEmailExists,
  checkStudentCodeExists,
  importStudents
} from "../../../services/studentService";
// Giữ nguyên import
import { fetchAllClassAPI } from "../../../services/classService";
import { Card, Typography, Spin, Empty, message as antdMessage } from "antd";
import dayjs from "dayjs";
import FiltersBar from "../../../components/admin/studentmanage/FiltersBar";
import StudentTable from "../../../components/admin/studentmanage/StudentTable";
import StudentFormModal from "../../../components/admin/studentmanage/StudentFormModal";
import PasswordModal from "../../../components/admin/studentmanage/PasswordModal";
import ImportModal from "../../../components/admin/studentmanage/ImportModal";
import StudentViewModal from "../../../components/admin/studentmanage/StudentViewModal";
import "../../../styles/admin/student.manage.css";
const { Title, Text } = Typography;

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];
const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "INACTIVE", label: "INACTIVE" },
];
const parseDateLike = (v) => (v ? dayjs(v) : null);

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function UsersPage() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Sorting
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  // Search
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 400);

  // Filters
  const [statusFilter, setStatusFilter] = useState();
  const [classFilter, setClassFilter] = useState();
  const [genderFilter, setGenderFilter] = useState();

  // State chứa TẤT CẢ các lớp học để hiển thị trong bộ lọc
  const [allClassOptions, setAllClassOptions] = useState([]);

  // Modals
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordEditingUser, setPasswordEditingUser] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const fetchStudents = () => apiGetStudents().catch(() => ({ data: [] }));

  // --- Data Loading & Filtering Logic ---

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetStudents({
        page: page - 1,
        size: pageSize,
        sortBy,
        sortDir,
        keyword: dq?.trim() || "",
        status: statusFilter,
        class: classFilter, // Backend nhận param là 'class'
        gender: genderFilter,
      });
      const pg = res?.data?.data;
      setList(pg?.content || []);
      setTotal(pg?.totalElements || 0);
    } catch (e) {
      console.error("Load students error:", e);
      antdMessage.error(e?.response?.data?.message || "Không thể tải danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortDir, dq, statusFilter, classFilter, genderFilter]);


  const loadClassOptions = useCallback(async () => {
    try {
      const res = await fetchAllClassAPI();
      // Ánh xạ dữ liệu class từ API sang format { value: string, label: string }
      // Giả định API trả về mảng object và trường chứa tên lớp là 'className'
      const options = res?.data?.data
        .map(cls => ({ value: cls.className, label: cls.className }))
        .filter((v, i, a) => a.findIndex(t => t.value === v.value) === i); // Lọc trùng lặp

      setAllClassOptions(options || []);
    } catch (e) {
      console.error("Load class options error:", e);
    }
  }, []); // Dependecies rỗng vì chỉ gọi 1 lần

  useEffect(() => {
    // Chỉ gọi loadClassOptions một lần khi component mount
    loadClassOptions();
  }, [loadClassOptions]);

  // Gọi loadUsers khi các filter/page/sort thay đổi
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);


  // VẤN ĐỀ ĐÃ FIX: Loại bỏ useMemo classOptions cũ dựa trên 'list'
  // const classOptions = useMemo(() => {
  //   const uniq = Array.from(new Set((list || []).map((x) => x.className).filter(Boolean)));
  //   return uniq.map((c) => ({ value: c, label: c }));
  // }, [list]); 

  // Giữ lại filtered chỉ là list vì logic lọc đã được đưa vào loadUsers
  const filtered = useMemo(() => Array.isArray(list) ? list : [], [list]);

  // --- Action Handlers & Pagination/Sorter Handlers ---
  const handleCreate = () => { setEditingId(null); setOpenForm(true); };
  const handleEdit = (u) => { setEditingId(u.userId); setOpenForm(true); };
  const handleDelete = async (id) => {
    try {
      await apiDeleteStudent(id);
      antdMessage.success("Xóa sinh viên thành công");
      // Cập nhật lại list ngay lập tức
      setList((cur) => cur.filter((x) => x.userId !== id));
      // Gọi lại loadUsers nếu cần (ví dụ: để điền vào chỗ trống do phân trang)
      // setTimeout(() => loadUsers(), 100); 
    } catch (e) {
      console.error("Delete error:", e);
      antdMessage.error(e?.response?.data?.message || "Xóa sinh viên thất bại");
    }
  };

  const openPasswordFor = (u) => { setPasswordEditingUser(u); setPasswordOpen(true); };

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleSorterChange = useCallback((newSortBy, newSortDir) => {
    if (newSortBy && newSortDir) {
      setSortBy(newSortBy);
      setSortDir(newSortDir);
      setPage(1);
    } else {
      setSortBy("id");
      setSortDir("asc");
      setPage(1);
    }
  }, []);


  return (
    <>
      <div className="users-wrap" style={{ padding: 16 }}>
        <Card bodyStyle={{ padding: 10 }} style={{ marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div className="sticky-title">
            <div className="title-row">
              <Title level={4} style={{ margin: 0 }}>Students Management</Title>
              <FiltersBar
                q={q} // Thêm q và setQ vào FiltersBar
                setQ={(v) => { setQ(v); setPage(1); }}
                sortDir={sortDir}
                setSortDir={setSortDir}
                onRefresh={loadUsers}
                onImport={() => setImportOpen(true)}
                onCreate={handleCreate}
                statusOptions={STATUS_OPTIONS}
                // TRUYỀN allClassOptions đã được fetch đầy đủ
                classOptions={allClassOptions}
                genderOptions={GENDER_OPTIONS}
                resetFilters={() => {
                  setQ(""); // Thêm reset cho q
                  setStatusFilter(undefined);
                  setClassFilter(undefined);
                  setGenderFilter(undefined);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </Card>

        <Card bodyStyle={{ paddingTop: 14 }}>
          {/* HIỂN THỊ BẢNG (TABLE VIEW) */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "56px 0" }}>
              <Spin size="large" />
              <div style={{ marginTop: 12 }}><Text type="secondary">Đang tải...</Text></div>
            </div>
          ) : filtered.length === 0 ? (
            <Empty description="Không có dữ liệu" style={{ padding: "48px 0" }} />
          ) : (
            <StudentTable
              data={filtered}
              loading={loading}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
              sortBy={sortBy}
              sortDir={sortDir}
              onSorterChange={handleSorterChange}
              onView={(u) => setViewing(u)}
              onEdit={handleEdit}
              onChangePassword={openPasswordFor}
              onDelete={handleDelete}
            />
          )}
        </Card>
      </div>

      {/* Các Modal giữ nguyên chức năng */}
      {openForm && (
        <StudentFormModal
          open={openForm}
          onClose={() => setOpenForm(false)}
          onSubmitted={() => { setOpenForm(false); loadUsers(); }}
          editingId={editingId}
          list={list}
          apiCreateStudent={apiCreateStudent}
          apiUpdateStudent={apiUpdateStudent}
          checkEmailExists={checkEmailExists}
          checkStudentCodeExists={checkStudentCodeExists}
          parseDateLike={parseDateLike}
          GENDER_OPTIONS={GENDER_OPTIONS}
          STATUS_OPTIONS={STATUS_OPTIONS}
          classOptions={allClassOptions}
        />
      )}

      <PasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        user={passwordEditingUser}
        onSubmitted={() => setPasswordOpen(false)}
        apiUpdateStudent={apiUpdateStudent}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => { setImportOpen(false); loadUsers(); }}
        importStudents={importStudents}
      />

      <StudentViewModal
        open={!!viewing}
        onClose={() => setViewing(null)}
        user={viewing}
      />
    </>
  );
}