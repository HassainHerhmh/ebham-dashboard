import axios from "axios";

/* =========================
   🔗 Base URL
========================= */
const API_URL = import.meta.env.VITE_API_URL;

/* =========================
   🟢 Axios Instance
========================= */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================
   🟢 Request Interceptor
========================= */
apiClient.interceptors.request.use((config) => {
  const userStr = localStorage.getItem("user");

  if (userStr) {
    try {
      const user = JSON.parse(userStr);

      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }

      if (user?.role) {
        config.headers["x-user-role"] = user.role;
      }
    } catch {
      console.warn("Invalid user in localStorage");
    }
  }

  return config;
});

/* =========================
   🔴 Response Interceptor
========================= */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "❌ API Error:",
      error?.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

/* =========================
   🧠 API (مطابق للسيرفر)
========================= */
const api = {
  /* 🔐 Auth */
  login: (data: { identifier: string; password: string }) =>
    apiClient.post("/login", data).then((res) => res.data),

  /* 🧪 Health */
  health: () => apiClient.get("/").then((res) => res.data),

  /* 🧾 Orders */
  orders: {
    getAll: () => apiClient.get("/orders").then((r) => r.data),
  },

  /* 👥 Users */
  users: {
    getAll: () => apiClient.get("/users").then((r) => r.data),
  },
};

export default api;
