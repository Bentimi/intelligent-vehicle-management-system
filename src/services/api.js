import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://localhost:5000/api',
  baseURL: 'https://vehicle-management-service.onrender.com/api',
  withCredentials: true,
});

// Response interceptor: on 401, signal session expiry so AuthContext clears user
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url ?? '';
    const isAuthRoute = url.includes('/user/login') || url.includes('/user/me');

    if (error.response?.status === 401 && !isAuthRoute) {
      window.dispatchEvent(new Event('session_expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
