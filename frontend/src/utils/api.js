import axios from 'axios';

// Detect environment and set base URL
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  // If we are in development mode (Vite dev server usually runs on 5173)
  if (window.location.port === '5173') {
    return 'http://localhost:3000/api';
  }

  // Use the current origin for production/tunnel deployments
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
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
