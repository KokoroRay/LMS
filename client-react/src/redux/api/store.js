import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../api/slices/authSlice";
import leaveRequestReducer from "../api/slices/leaveRequestSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leaveRequests: leaveRequestReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
