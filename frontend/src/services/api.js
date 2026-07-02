import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

let currentAccessToken = null;
let tokenRefreshCallback = null;
let authErrorCallback = null;

export const setCurrentAccessToken = (token) => {
  currentAccessToken = token;
};

export const onTokenRefreshed = (cb) => {
  tokenRefreshCallback = cb;
};

export const onAuthError = (cb) => {
  authErrorCallback = cb;
};

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (currentAccessToken) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/accounts/token/refresh/`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = response.data.access;
        currentAccessToken = newAccessToken;
        if (tokenRefreshCallback) tokenRefreshCallback(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        currentAccessToken = null;
        if (authErrorCallback) authErrorCallback();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
