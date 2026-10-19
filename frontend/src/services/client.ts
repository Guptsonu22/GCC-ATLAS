import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.error?.message ||
      (error.code === 'ECONNABORTED' ? 'Request timed out' : error.message || 'Network error');
    return Promise.reject(new Error(message));
  },
);
