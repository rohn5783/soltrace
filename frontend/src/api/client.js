import axios from 'axios';

// Get backend URL from environment or default to live deployed Render backend in production
const RAW_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.PROD ? 'https://soltrace-1e7t.onrender.com' : '');

export const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, '');
export const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
