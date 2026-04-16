import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL;
const apiBaseUrl = typeof rawApiUrl === "string" ? rawApiUrl.trim() : "";

if (!apiBaseUrl && import.meta.env.PROD) {
  // Prevent silent production 404s caused by missing VITE_API_URL on Vercel.
  console.error(
    "Missing VITE_API_URL in production. Set it in Vercel project environment variables.",
  );
}

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
  baseURL: apiBaseUrl.replace(/\/+$/, ""),
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
