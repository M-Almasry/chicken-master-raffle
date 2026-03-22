import axios from 'axios';

// Detect environment and set base URL
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  // Development: Vite dev server usually runs on 5173
  if (window.location.port === '5173') {
    return 'http://localhost:3555/api';
  }

  // Production: If running on the PM2 port (8555), point to the backend on 3555
  if (window.location.port === '8555') {
    return `${window.location.protocol}//${window.location.hostname}:3555/api`;
  }

  // Use the current origin for other production/tunnel deployments
  return `${window.location.origin}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add a request interceptor to attach the Authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration/401s
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear storage and redirect to login if unauthorized
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');

      // Only redirect if we are not already on the login page to avoid infinite loops
      const isLoginPage = window.location.pathname.includes('/login');
      if (!isLoginPage) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
