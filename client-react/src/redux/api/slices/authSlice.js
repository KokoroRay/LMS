import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginStudent,
  getCurrentUser,
  changePassword as changePasswordAPI,
  updateProfile as updateProfileAPI,
  forgotPassword as forgotPasswordAPI,
  resetPassword as resetPasswordAPI,
} from "../../../services/authService";

const bootToken = localStorage.getItem("access_token") || null;

const initialState = {
  user: null,
  token: bootToken,
  loading: false,
  isAuthenticated: !!bootToken,
  needChangePassword: localStorage.getItem("needChangePassword") === "true",
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginStudent(credentials);

      const {
        accessToken: token,
        user,
        needChangePassword,
      } = response.data.data;

      if (!token || !user) {
        return rejectWithValue(
          "Không nhận được token hoặc thông tin người dùng."
        );
      }

      localStorage.setItem("access_token", token);
      localStorage.setItem("needChangePassword", needChangePassword);
      if (user.classId) {
        localStorage.setItem("classId", user.classId);
      }

      return { token, user, needChangePassword };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Email hoặc mật khẩu không đúng."
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwords, { rejectWithValue }) => {
    try {
      await changePasswordAPI(passwords);
      return true;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Đổi mật khẩu thất bại."
      );
    }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCurrentUser();
      const user = response.data.data;
      if (!user) {
        return rejectWithValue("Không thể lấy thông tin người dùng.");
      }
      return user;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Phiên đăng nhập đã hết hạn."
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await updateProfileAPI(payload);
      const updatedUser = res?.data?.data;
      if (!updatedUser) {
        return rejectWithValue(
          "Không nhận được dữ liệu người dùng sau khi cập nhật."
        );
      }
      return updatedUser;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Cập nhật hồ sơ thất bại."
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await forgotPasswordAPI(email);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Gửi yêu cầu đặt lại mật khẩu thất bại."
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (passwords, { rejectWithValue }) => {
    try {
      const response = await resetPasswordAPI(passwords);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.data || "Đặt lại mật khẩu thất bại."
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.needChangePassword = false;
      state.error = null;
      localStorage.removeItem("access_token");
      localStorage.removeItem("needChangePassword");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.needChangePassword = action.payload.needChangePassword;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.needChangePassword = false;
        state.error = action.payload;
        localStorage.removeItem("access_token");
        localStorage.removeItem("needChangePassword");
      })

      .addCase(fetchMe.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        const user = action.payload;
        const storedClassId = localStorage.getItem("classId");
        if (storedClassId) {
          user.classId = storedClassId;
        }
        state.user = user;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.needChangePassword = false;
        state.error = action.payload;
        localStorage.removeItem("access_token");
        localStorage.removeItem("needChangePassword");
      })

      .addCase(changePassword.fulfilled, (state) => {
        state.needChangePassword = false;
        if (state.user) {
          state.user.firstLogin = false;
        }
        localStorage.removeItem("needChangePassword");
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export const selectCurrentUserId = (state) => state.auth.user?.userId;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
