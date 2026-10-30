import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Django REST Framework default base URL configuration
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
export const LOGIN_TIMEOUT_MS = 90_000;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach JWT access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('avlod_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle token refresh & errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('avlod_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          if (res.data?.access) {
            localStorage.setItem('avlod_access_token', res.data.access);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            }
            return apiClient(originalRequest);
          }
        } catch {
          // Token refresh failed -> clear session
          localStorage.removeItem('avlod_access_token');
          localStorage.removeItem('avlod_refresh_token');
          localStorage.removeItem('avlod_auth_user');
          window.dispatchEvent(new CustomEvent('avlod_auth_expired'));
        }
      }
    }

    return Promise.reject(error);
  }
);
