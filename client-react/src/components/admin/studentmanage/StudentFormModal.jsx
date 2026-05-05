import React, { useEffect } from "react";
import { Modal, Form, Row, Col, Input, Select, DatePicker, Avatar, Upload, Button, message as antdMessage } from "antd";
import { UserOutlined, CloudUploadOutlined } from "@ant-design/icons";

const CLOUD_NAME = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export default function StudentFormModal({
    open, onClose, onSubmitted,
    editingId, list,
    apiCreateStudent, apiUpdateStudent,
    checkEmailExists, checkStudentCodeExists,
    parseDateLike, GENDER_OPTIONS, STATUS_OPTIONS, classOptions
}) {
    const [form] = Form.useForm();

    // SỬA ĐỔI: Sử dụng useWatch để theo dõi giá trị avatarUrl
    const avatarUrl = Form.useWatch('avatarUrl', form);

    useEffect(() => {
        if (!open) return;

        if (editingId) {
            const u = list.find((x) => x.userId === editingId);
            if (u) {
                form.setFieldsValue({
                    email: u.email?.toLowerCase() || "",
                    username: u.username || "",
                    avatarUrl: u.avatarUrl || "",
                    firstName: u.firstName || "",
                    lastName: u.lastName || "",
                    phone: u.phone || "",
                    dateOfBirth: u.dateOfBirth ? parseDateLike(u.dateOfBirth) : null,
                    gender: u.gender || "OTHER",
                    studentCode: u.studentCode || "",
                    className: u.className || "",
                    address: u.address || "",
                    country: u.country || "",
                    city: u.city || "",
                    occupation: u.occupation || "",
                    bio: u.bio || "",
                    status: u.status || undefined,
                });
            }
        } else {
            form.resetFields();
        }
    }, [open, editingId, list, form, parseDateLike]);


    const validateUsername = async (_, value) => {
        const val = value?.trim();
        if (!val) return Promise.resolve();
        const ok = /^[a-zA-Z0-9_.-]+$/.test(val);
        return ok ? Promise.resolve() : Promise.reject(new Error("Username chỉ chứa chữ, số, _, ., -"));

    };


    const validateEmail = async (_, value) => {
        const val = value?.trim();
        if (!val) return Promise.resolve();
        if (editingId) {

            const original = list.find((u) => u.userId === editingId);

            if (original && original.email === val.toLowerCase()) return Promise.resolve();
        }
        try {

            const res = await checkEmailExists(val.toLowerCase());

            if (res?.data?.data === true) return Promise.reject(new Error("Email đã tồn tại"));
        } catch { Error }
        return Promise.resolve();

    };


    const validateStudentCode = async (_, value) => {
        const val = value?.trim();
        if (!val) return Promise.resolve();
        if (editingId) {

            const original = list.find((u) => u.userId === editingId);

            if (original && original.studentCode === val) return Promise.resolve();
        }
        try {

            const res = await checkStudentCodeExists(val);

            if (res?.data?.data === true) return Promise.reject(new Error("Mã sinh viên đã tồn tại"));
        } catch { Error }
        return Promise.resolve();

    };


    const uploadToCloudinary = async (file) => {
        if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error("Thiếu Cloudinary env");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", UPLOAD_PRESET);
        const resp = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: fd });
        if (!resp.ok) throw new Error("Upload thất bại");
        const data = await resp.json();
        return data.secure_url;

    };


    const handleSubmit = async () => {
        try {

            const v = await form.validateFields();

            const payloadBase = {
                email: v.email?.trim().toLowerCase(),
                userName: v.username?.trim() || undefined,
                avatarUrl: v.avatarUrl?.trim() || undefined,
                firstName: v.firstName?.trim(),
                lastName: v.lastName?.trim(),
                phone: v.phone?.trim() || undefined,
                dateOfBirth: v.dateOfBirth ? v.dateOfBirth.format("YYYY-MM-DD") : undefined,
                gender: v.gender,
                studentCode: v.studentCode?.trim() || undefined,
                ...(editingId && { className: v.className }),
                address: v.address?.trim() || undefined,
                country: v.country?.trim() || undefined,
                city: v.city?.trim() || undefined,
                occupation: v.occupation?.trim() || undefined,
                bio: v.bio?.trim() || undefined,
                status: v.status || undefined,

            };


            if (editingId) {
                const payload = { ...payloadBase };
                if (v.password?.trim()) payload.password = v.password.trim();
                await apiUpdateStudent(editingId, payload);

            } else {
                const payload = { ...payloadBase, password: v.password?.trim() || "123456" };
                await apiCreateStudent(payload);

            }

            onSubmitted();
        } catch (e) {

            if (e?.errorFields) return;

            console.error(e);

            antdMessage.error(e?.response?.data?.message || "Lưu thất bại");
        }

    };


    return (
        <Modal

            title={editingId ? "Chỉnh sửa người dùng" : "Tạo người dùng mới"}

            open={open}

            onCancel={onClose}

            onOk={handleSubmit}

            okText={editingId ? "Cập nhật" : "Tạo mới"}

            cancelText="Hủy"

            width={780}
        >

            <Form form={form} layout="vertical">
                <Row gutter={16}>

                    <Col span={12}>
                        <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>

                            <Input placeholder="First name" />
                        </Form.Item>

                    </Col>

                    <Col span={12}>
                        <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: "Vui lòng nhập họ" }]}>

                            <Input placeholder="Last name" />
                        </Form.Item>

                    </Col>
                </Row>

                <Row gutter={16}>

                    <Col span={12}>
                        <Form.Item

                                                        name="username" label="Username" tooltip="Chỉ chứa chữ, số, _, ., -"

                                                        rules={[{ validator: validateUsername }]}
                        >

                            <Input placeholder="vd: thanh.nguyen" />
                        </Form.Item>

                    </Col>

                    <Col span={12}>
                        <Form.Item

                            name="email" label="Email"

                            rules={[{ required: true, message: "Vui lòng nhập email" }, { type: "email" }, { validator: validateEmail }]}
                        >

                            <Input placeholder="email@example.com" />
                        </Form.Item>

                    </Col>
                </Row>

                <Form.Item

                    name="password"

                    label={editingId ? "Password (để trống nếu không đổi)" : "Password (để trống = 123456)"}
                >

                    <Input.Password placeholder="Mật khẩu" />
                </Form.Item>

                <Form.Item name="avatarUrl" label="Avatar">

                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {/* SỬA ĐỔI: Sử dụng giá trị từ useWatch */}
                        <Avatar size={72} src={avatarUrl} icon={<UserOutlined />} />
                        <Upload

                            accept="image/*" showUploadList={false}

                            beforeUpload={async (file) => {
                                try {

                                    const url = await uploadToCloudinary(file);

                                    // Cập nhật form value và Avatar sẽ tự động hiện nhờ useWatch

                                    form.setFieldsValue({ avatarUrl: url });

                                    antdMessage.success("Tải ảnh thành công");
                                } catch (err) {

                                    antdMessage.error(err?.message || "Tải ảnh thất bại");
                                }
                                return false;

                            }}
                        >

                            <Button icon={<CloudUploadOutlined />}>Upload lên Cloudinary</Button>
                        </Upload>

                    </div>
                </Form.Item>

                <Row gutter={16}>

                    <Col span={12}><Form.Item name="phone" label="Phone"><Input placeholder="Số điện thoại" /></Form.Item></Col>

                    <Col span={12}><Form.Item name="dateOfBirth" label="Date of Birth"><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                </Row>

                <Row gutter={16}>

                    <Col span={12}><Form.Item name="gender" label="Gender" initialValue="OTHER"><Select options={GENDER_OPTIONS} /></Form.Item></Col>

                    <Col span={12}><Form.Item name="status" label="Status"><Select allowClear options={STATUS_OPTIONS} placeholder="Chọn status" /></Form.Item></Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="studentCode" label="Student Code" rules={[{ validator: validateStudentCode }]}>
                            <Input placeholder="VD: SV000123" />
                        </Form.Item>
                    </Col>
                    {editingId && (
                        <Col span={12}>
                            <Form.Item name="className" label="Class">
                                <Select
                                    showSearch
                                    placeholder="Chọn lớp học"
                                    options={classOptions}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    )}
                </Row>

                <Form.Item name="address" label="Address"><Input placeholder="Địa chỉ" /></Form.Item>

                <Row gutter={16}>

                    <Col span={12}><Form.Item name="city" label="City"><Input placeholder="Thành phố" /></Form.Item></Col>

                    <Col span={12}><Form.Item name="country" label="Country"><Input placeholder="Quốc gia" /></Form.Item></Col>
                </Row>

                <Row gutter={16}>

                    <Col span={12}><Form.Item name="occupation" label="Occupation"><Input placeholder="Nghề nghiệp" /></Form.Item></Col>

                    <Col span={12}><Form.Item name="bio" label="Bio"><Input placeholder="Giới thiệu ngắn" /></Form.Item></Col>
                </Row>

            </Form>
        </Modal>

    );
}