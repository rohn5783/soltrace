import axios from 'axios';

// Configure a backend origin in VITE_BACKEND_URL for deployments; local dev uses Vite proxies.
const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, '');
export const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
});

// Vercel serves the SPA but does not run this Express API. Fail closed when a
// production API origin was not provided instead of treating the SPA rewrite
// response as API data.
api.interceptors.request.use((config) => {
  if (import.meta.env.PROD && !BACKEND_URL) {
    throw new Error('Production API is not configured. Set VITE_BACKEND_URL to the deployed Soltrace API origin.');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
