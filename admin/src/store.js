import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/es/storage";
import authReducer from "./redux/slice/authSlice";
import adminReducer from "./redux/slice/adminSlice";
import userReducer from "./redux/slice/userSlice";
import adminBlogSlice from "./redux/slice/adminBlogSlice";
import adminPlanSlice from "./redux/slice/adminPlanSlice";
import createTransform from "redux-persist/es/createTransform";
import adminSubscriptionSlice from "./redux/slice/adminSubscriptionSlice";
import adminTransactionSlice from "./redux/slice/adminTransactionSlice";
import adminRefundSlice from "./redux/slice/adminRefundSlice";
import adminErrorSlice from "./redux/slice/adminErrorSlice";
import adminConsoleLogSlice from "./redux/slice/adminConsoleLogSlice";

const authTransform = createTransform(
  (state) => ({
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
  }),
  (state) => ({
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    loading: false,
    error: null,
    isVerifying: false,
    tempEmail: null,
  }),
  { whitelist: ["auth"] },
);
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
  transforms: [authTransform],
};

const rootReducer = combineReducers({
  auth: authReducer,
  admin: adminReducer,
  users: userReducer,
  adminBlogs: adminBlogSlice,
  adminPlans: adminPlanSlice,
  adminSubscriptions: adminSubscriptionSlice,
  adminTransactions: adminTransactionSlice,
  adminRefunds: adminRefundSlice,
  adminError: adminErrorSlice,
  adminConsoleLogs: adminConsoleLogSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
