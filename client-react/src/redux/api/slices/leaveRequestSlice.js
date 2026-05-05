import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createLeaveRequest as createLeaveRequestAPI,
  getMyLeaveRequests as getMyLeaveRequestsAPI,
  getAllLeaveRequests as getAllLeaveRequestsAPI,
  approveLeaveRequest as approveLeaveRequestAPI,
  rejectLeaveRequest as rejectLeaveRequestAPI,
} from "../../../services/leaveRequestService";

const initialState = {
  myRequests: {
    content: [],
    pageable: {},
    totalElements: 0,
  },
  adminRequests: {
    content: [],
    pageable: {},
    totalElements: 0,
  },
  loading: false,
  error: null,
};

export const uploadAttachment = createAsyncThunk(
  "leaveRequests/uploadAttachment",
  async (file, { rejectWithValue }) => {
    const CLOUD_NAME = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env
      .VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      return rejectWithValue(
        "Lỗi cấu hình Cloudinary: Thiếu Cloud Name hoặc Upload Preset."
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("cloud_name", CLOUD_NAME);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.error?.message || "Lỗi tải ảnh lên Cloudinary."
        );
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      return rejectWithValue("Lỗi kết nối khi tải ảnh.");
    }
  }
);

export const createLeaveRequest = createAsyncThunk(
  "leaveRequests/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createLeaveRequestAPI(data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Tạo đơn xin nghỉ thất bại."
      );
    }
  }
);

export const fetchMyLeaveRequests = createAsyncThunk(
  "leaveRequests/fetchMy",
  async ({ status, page, size }, { rejectWithValue }) => {
    try {
      const response = await getMyLeaveRequestsAPI(status, page, size);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Không thể lấy lịch sử đơn xin nghỉ."
      );
    }
  }
);

export const fetchAllLeaveRequests = createAsyncThunk(
  "leaveRequests/fetchAll",
  async ({ status, page, size }, { rejectWithValue }) => {
    try {
      const response = await getAllLeaveRequestsAPI(status, page, size);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Không thể lấy danh sách đơn quản lý."
      );
    }
  }
);

export const approveLeaveRequest = createAsyncThunk(
  "leaveRequests/approve",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await approveLeaveRequestAPI(requestId);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Duyệt đơn thất bại."
      );
    }
  }
);

export const rejectLeaveRequest = createAsyncThunk(
  "leaveRequests/reject",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await rejectLeaveRequestAPI(requestId);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Từ chối đơn thất bại."
      );
    }
  }
);

const leaveRequestSlice = createSlice({
  name: "leaveRequests",
  initialState,
  reducers: {
    clearLeaveRequestError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createLeaveRequest.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(fetchMyLeaveRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.myRequests = action.payload;
      })
      .addCase(fetchAllLeaveRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.adminRequests = action.payload;
      })
      .addCase(uploadAttachment.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(uploadAttachment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(approveLeaveRequest.fulfilled, (state, action) => {
        state.loading = false;
        const updatedRequest = action.payload;

        state.adminRequests.content = state.adminRequests.content.filter(
          (req) => req.id !== updatedRequest.id
        );
        state.adminRequests.totalElements = Math.max(
          0,
          state.adminRequests.totalElements - 1
        );
      })
      .addCase(rejectLeaveRequest.fulfilled, (state, action) => {
        state.loading = false;
        const updatedRequest = action.payload;

        state.adminRequests.content = state.adminRequests.content.filter(
          (req) => req.id !== updatedRequest.id
        );
        state.adminRequests.totalElements = Math.max(
          0,
          state.adminRequests.totalElements - 1
        );
      })

      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { clearLeaveRequestError } = leaveRequestSlice.actions;
export default leaveRequestSlice.reducer;
