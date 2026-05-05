import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/es/storage";
import authReducer from "./redux/slice/authSlice";
import userReducer from "./redux/slice/userSlice";
import adminReducer from "./redux/slice/adminSlice";
import blogReducer from "./redux/slice/blogSlice";
import commentReducer from "./redux/slice/commentSlice";
import createTransform from "redux-persist/es/createTransform";

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
    authInitialized: false,
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
  blog: blogReducer,
  comment: commentReducer,
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
