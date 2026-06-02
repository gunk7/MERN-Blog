import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ── Request interceptor ───────────────────────────────────────────────────────
API.interceptors.request.use(
  async (config) => {
    const { store } = await import("../store");
    const state = store.getState();
    const accessToken = state.auth?.accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        console.log(
          `[Queue] ⏸️  401 detected. Refresh in progress. Queuing: ${originalRequest.url}`,
        );
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            console.log(
              `[Queue] 🚀 Retrying queued request: ${originalRequest.url}`,
            );
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      console.log("[Auth] 🔄 Initializing Token Refresh...");

      try {
        const { store } = await import("../store");
        const refreshToken = store.getState().auth?.refreshToken;

        if (!refreshToken) {
          console.error("[Auth] ❌ No refresh token found in store");
          throw new Error("No refresh token available");
        }

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { timeout: 10000 },
        );

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        console.log("[Auth] ✅ Token refresh successful. Updating Redux.");

        const { setTokens } = await import("../redux/slice/authSlice");
        store.dispatch(
          setTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          }),
        );

        isRefreshing = false;

        console.log(
          `[Queue] 🔓 Processing ${failedQueue.length} queued requests.`,
        );
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        console.error(
          "[Auth] 🚨 Refresh failed. Logging out user.",
          refreshError,
        );

        isRefreshing = false;
        processQueue(refreshError, null);

        const { store, persistor } = await import("../store");

        await persistor.purge();
        store.dispatch({ type: "RESET_APP" });

        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("blog_draft_")) {
            sessionStorage.removeItem(key);
          }
        });

        setTimeout(() => {
          window.location.href = "/login";
        }, 0);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default API;
