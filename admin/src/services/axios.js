import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
});

// ── Request interceptor ───────────────────────────────────────────────────────
API.interceptors.request.use(
  async (config) => {
    const { store } = await import("../store");
    const state = store.getState();
    const accessToken = state.auth?.accessToken; // ← fixed: was using `token`
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`; // ← fixed: was using `token`
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const { store } = await import("../store");
        const state = store.getState();
        const refreshToken = state.auth?.refreshToken;

        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refreshToken },
        );

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        const { setTokens } = await import("../redux/slice/authSlice");
        store.dispatch(
          setTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          }),
        );

        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(original);
      } catch {
        const { store } = await import("../store");
        const { logout } = await import("../redux/slice/authSlice");
        store.dispatch(logout());
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default API;
