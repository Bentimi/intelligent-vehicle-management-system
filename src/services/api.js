import axios from 'axios';

const api = axios.create({
  baseURL: 'https://vehicle-management-service.onrender.com/api' || 'http://localhost:5000/api',
  // baseURL: 'http://localhost:5000/api',
  withCredentials: true, // send cookies
});

// Read a cookie by name
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

// Request interceptor: attach CSRF token for state-changing methods
api.interceptors.request.use((config) => {
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutating.includes((config.method || '').toUpperCase())) {
    // Try localStorage first (for cross-domain), then cookie (fallback)
    const csrf = localStorage.getItem('cg_csrf') || getCookie('csrfToken');
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});

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

// Response interceptor: capture CSRF token then auto-refresh on 401
api.interceptors.response.use(
  (res) => {
    // Capture CSRF token if returned in response body
    const csrf = res.data?.data?.csrfToken;
    if (csrf) {
      localStorage.setItem('cg_csrf', csrf);
    }
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
        // Redirect to login if refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
