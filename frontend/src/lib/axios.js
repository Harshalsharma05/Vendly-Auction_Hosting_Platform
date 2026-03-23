import axios from "axios";

function normalizeTokenValue(tokenValue) {
  if (!tokenValue || typeof tokenValue !== "string") {
    return "";
  }

  const normalized = tokenValue.replace(/^Bearer\s+/i, "").trim();

  if (
    !normalized ||
    normalized.toLowerCase() === "undefined" ||
    normalized.toLowerCase() === "null"
  ) {
    return "";
  }

  return normalized;
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = normalizeTokenValue(localStorage.getItem("token"));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosInstance;
