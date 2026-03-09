import axios from 'axios';

// Detect environment and set base URL
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  const hostname = window.location.hostname;

  // High-reliability fallbacks for local development
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.split('.')[0] === '10' ||
    hostname.endsWith('.local')
  ) {
    return 'http://localhost:3000/api';
  }

  // Default production URL (Render)
  return 'https://chicken-master-raffle.onrender.com/api';
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
