import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://localhost:5000/api',
  baseURL: 'https://vehicle-management-service.onrender.com/api',
  withCredentials: true, // send cookies
});

// Frontend does not need to send CSRF manually since it's stored in HttpOnly cookies

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
}

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (res) => {
    return res;
  },
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/user/refresh') &&
      !original.url?.includes('/user/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(original));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await api.post('/user/refresh');
        processQueue(null);
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError);
        // Fully dead session (refresh token expired) -> let AuthContext handle state clearing
        window.dispatchEvent(new Event('session_expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
