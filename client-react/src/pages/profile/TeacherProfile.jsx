import { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Typography,
  Form,
  Input,
  DatePicker,
  Button,
  Modal,
  message,
} from "antd";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";

import {
  fetchMe,
  updateUserProfile,
  changePassword,
} from "../../redux/api/slices/authSlice";

const { Title, Paragraph, Text } = Typography;
const AVATAR_SIZE = 379;

const styles = {
  wrap: { maxWidth: "1400px", margin: "40px auto 80px", padding: "0 24px" },

  header: { display: "flex", justifyContent: "space-between", gap: 24 },
  headerRight: {
    maxWidth: 520,
    color: "#666",
    textAlign: "right",
    lineHeight: 1.5,
  },

  avatarTitle: { fontWeight: 700, marginBottom: 16 },

  avatarOuter: {
    position: "relative",
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },

  avatarMask: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    overflow: "hidden",
    background: "#f3f3f3",
    border: "1px solid #eee",
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    pointerEvents: "none",
    userSelect: "none",
  },

  avatarUploadBtn: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 54,
    height: 54,
    borderRadius: "50%",
    background: "#ffffff",
    border: "1px solid #e5e5e5",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
    transition: "box-shadow .18s ease, transform .06s ease",
  },
  avatarUploadBtnHover: {
    boxShadow: "0 8px 22px rgba(0,0,0,0.16)",
    transform: "translateY(-1px)",
  },
  uploadIcon: { width: 28, height: 28, display: "block" },

  formTitle: { fontWeight: 700, marginBottom: 16 },
  input: {
    height: 44,
    background: "#F7F7F7",
    border: "1px solid #eee",
    borderRadius: 10,
    color: "#111",
  },

  buttonPrimary: { height: 44, borderRadius: 10, fontWeight: 700 },
  buttonLock: {
    height: 44,
    background: "#FEF1EC",
    borderColor: "#FEF1EC",
    color: "#DD673C",
    fontWeight: 600,
    borderRadius: 10,
  },
  lockIcon: { width: 18, height: 18, marginRight: 8, verticalAlign: "-3px" },

  pwdInput: {
    height: 42,
    background: "#fafafa",
    border: "1px solid #eee",
    borderRadius: 10,
  },
  eyeIcon: { width: 18, height: 18, cursor: "pointer" },
};

function PwdInput({ name, label, show, setShow, placeholder, rules = [] }) {
  return (
    <Form.Item name={name} label={label} rules={rules}>
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        style={styles.pwdInput}
        suffix={
          <img
            src={show ? "/icons/eye.svg" : "/icons/lock.svg"}
            alt="toggle visibility"
            style={styles.eyeIcon}
            onClick={() => setShow((v) => !v)}
          />
        }
      />
    </Form.Item>
  );
}
PwdInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rules: PropTypes.array,
};

const toStr = (v) => (v == null ? "" : String(v));
const parseDob = (v) => (v ? (dayjs(v).isValid() ? dayjs(v) : null) : null);

export default function TeacherProfile() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);

  useEffect(() => {
    if (!user) {
      dispatch(fetchMe());
    }
  }, [user, dispatch]);



  const init = useMemo(
    () => ({
      lastName: toStr(user?.lastName),
      firstName: toStr(user?.firstName),
      email: toStr(user?.email),
      phone: toStr(user?.phone),
      dob: parseDob(user?.dateOfBirth),
    }),
    [user]
  );

  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatarUrl || "/images/anh-vien-avt.jpg"
  );
  const [avatarFile, setAvatarFile] = useState(null);
  useEffect(() => {
    setAvatarPreview(user?.avatarUrl || "/images/anh-vien-avt.jpg");
  }, [user?.avatarUrl]);

  const inputId = "avatar-file-input";
  const onPickFile = () => document.getElementById(inputId)?.click();
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setDirty(true);
  };

  const [hoverBtn, setHoverBtn] = useState(false);
  const [form] = Form.useForm();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue(init);
    setDirty(false);
  }, [init, form]);

  const onValuesChange = () => setDirty(true);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();

      const data = {
        firstName: toStr(values.firstName).trim() || null,
        lastName: toStr(values.lastName).trim() || null,
        phone: toStr(values.phone).trim() || null,
        dateOfBirth: values.dob ? dayjs(values.dob).format("YYYY-MM-DD") : null,
      };

      const action = await dispatch(
        updateUserProfile({ data, avatar: avatarFile || undefined })
      );
      const resUser = unwrapResult(action);

      if (resUser) {
        form.setFieldsValue({
          firstName: resUser.firstName ?? values.firstName,
          lastName: resUser.lastName ?? values.lastName,
          email: resUser.email ?? values.email,
          phone: resUser.phone ?? values.phone,
          dob: parseDob(resUser.dateOfBirth ?? values.dateOfBirth),
        });

        if (resUser.avatarUrl) setAvatarPreview(resUser.avatarUrl);
      } else {
        dispatch(fetchMe());
      }
      setAvatarFile(null);
      setDirty(false);
      message.success("Cập nhật hồ sơ thành công!");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Cập nhật hồ sơ thất bại.");
      console.error("Error in handleSave:", err);
    } finally {
      setSaving(false);
    }
  };

  const [openPwd, setOpenPwd] = useState(false);
  const [pwdForm] = Form.useForm();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submitPwd = async () => {
    try {
      const vals = await pwdForm.validateFields();
      const action = await dispatch(
        changePassword({
          currentPassword: vals.oldPassword,
          newPassword: vals.newPassword,
          confirmPassword: vals.confirmPassword,
        })
      );
      unwrapResult(action);

      message.success("Đổi mật khẩu thành công!");
      setOpenPwd(false);
      pwdForm.resetFields();
      setShowOld(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (e) {
      if (typeof e === "string") message.error(e);
      else message.error("Đổi mật khẩu thất bại.");
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
          Chỉnh sửa thông tin
        </Title>
        <div style={styles.headerRight}>
          <Paragraph style={{ margin: 0 }}>
            Chỉnh sửa trực tiếp thông tin hiển thị và ảnh đại diện.
            <br />
            Nhấn <Text strong>Lưu thay đổi</Text> để cập nhật.
          </Paragraph>
        </div>
      </div>
      <Row gutter={[48, 24]} style={{ marginTop: 32 }}>
        {/* LEFT: Avatar */}
        <Col xs={24} md={10}>
          <div>
            <div style={styles.avatarTitle}>Ảnh đại diện</div>

            <div style={styles.avatarOuter}>
              <div style={styles.avatarMask}>
                <img
                  src={avatarPreview}
                  alt="avatar"
                  style={styles.avatarImg}
                />
              </div>

              <input
                id={inputId}
                type="file"
                accept="image/png,image/jpeg"
                style={{ display: "none" }}
                onChange={onFileChange}
              />

              <div
                role="button"
                aria-label="Đổi ảnh đại diện"
                title="Đổi ảnh"
                onClick={onPickFile}
                tabIndex={0}
                style={{
                  ...styles.avatarUploadBtn,
                  ...(hoverBtn ? styles.avatarUploadBtnHover : {}),
                }}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && onPickFile()
                }
                onMouseEnter={() => setHoverBtn(true)}
                onMouseLeave={() => setHoverBtn(false)}
              >
                <img
                  src="/icons/upload.svg"
                  alt="upload"
                  style={styles.uploadIcon}
                />
              </div>
            </div>

            <Paragraph style={{ color: "#666", marginTop: 16 }}>
              Kích thước ảnh nhỏ nhất: <Text strong>200 × 200px</Text>, định
              dạng PNG hoặc JPG
            </Paragraph>
          </div>
        </Col>

        {/* RIGHT: Form */}
        <Col xs={24} md={14}>
          <div>
            <div style={styles.formTitle}>Thông tin cá nhân</div>

            <Form
              form={form}
              layout="vertical"
              initialValues={init}
              onValuesChange={onValuesChange}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="lastName"
                    label="Họ"
                    rules={[{ required: true, message: "Không được bỏ trống" }]}
                  >
                    <Input style={styles.input} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="firstName"
                    label="Tên"
                    rules={[{ required: true, message: "Không được bỏ trống" }]}
                  >
                    <Input style={styles.input} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Không được bỏ trống" },
                      { type: "email", message: "Email không hợp lệ" },
                    ]}
                  >
                    <Input style={styles.input} disabled readOnly />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="dob" label="Ngày sinh">
                    <DatePicker
                      style={{ width: "100%", ...styles.input }}
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="phone" label="Số điện thoại">
                    <Input style={styles.input} />
                  </Form.Item>
                </Col>

              </Row>

              <div style={{ display: "flex", gap: 12 }}>
                <Button
                  type="primary"
                  style={{
                    ...styles.buttonPrimary,
                    flex: 1,
                    backgroundColor: "#DD673C",
                    color: "#fff",
                    borderColor: "#DD673C",
                  }}
                  disabled={!dirty}
                  loading={saving}
                  onClick={handleSave}
                >
                  Lưu thay đổi
                </Button>

                <Button
                  style={{ ...styles.buttonLock, flex: 1 }}
                  onClick={() => setOpenPwd(true)}
                >
                  <img
                    src="/icons/lock.svg"
                    alt="lock"
                    style={styles.lockIcon}
                  />
                  Đổi mật khẩu
                </Button>
              </div>
            </Form>
          </div>
        </Col>
      </Row>

      <Modal
        open={openPwd}
        title="Đổi mật khẩu"
        centered
        onCancel={() => setOpenPwd(false)}
        footer={null}
      >
        <Form layout="vertical" form={pwdForm}>
          <PwdInput
            name="oldPassword"
            label="Mật khẩu cũ"
            show={showOld}
            setShow={setShowOld}
            placeholder="Nhập mật khẩu cũ"
            rules={[{ required: true, message: "Không được bỏ trống" }]}
          />
          <PwdInput
            name="newPassword"
            label="Mật khẩu mới"
            show={showNew}
            setShow={setShowNew}
            placeholder="Nhập mật khẩu mới"
            rules={[
              { required: true, message: "Không được bỏ trống" },
              { min: 6, message: "Tối thiểu 6 ký tự" },
            ]}
          />
          <PwdInput
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            show={showConfirm}
            setShow={setShowConfirm}
            placeholder="Xác nhận mật khẩu mới"
            rules={[
              { required: true, message: "Không được bỏ trống" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value)
                    return Promise.resolve();
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp")
                  );
                },
              }),
            ]}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <Button style={{ flex: 1 }} onClick={() => setOpenPwd(false)}>
              Hủy
            </Button>
            <Button type="primary" style={{ flex: 1 }} onClick={submitPwd}>
              Cập nhật
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
