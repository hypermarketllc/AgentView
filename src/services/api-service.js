/**
 * api-service.js
 * 
 * Central API service for making HTTP requests to the backend
 * Uses the API_ENDPOINTS configuration for all endpoint paths
 */

import axios from 'axios';
import API_ENDPOINTS from '../config/api-endpoints.js';

// Get API URL from environment or use default
const API_URL = process.env.API_URL || 'http://localhost:3000/crm/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from storage or environment
    const token = localStorage ? localStorage.getItem('auth_token') : null;
    const envToken = process.env.AUTH_TOKEN;
    const cmdToken = process.argv && process.argv.length > 2 ? process.argv[2] : null;
    
    const authToken = token || envToken || cmdToken;
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API service methods
const ApiService = {
  // Auth methods
  auth: {
    login: (credentials) => api.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    register: (userData) => api.post(API_ENDPOINTS.AUTH.REGISTER, userData),
    getCurrentUser: () => api.get(API_ENDPOINTS.AUTH.ME),
    logout: () => api.post(API_ENDPOINTS.AUTH.LOGOUT),
  },
  
  // User methods
  user: {
    getSettings: () => api.get(API_ENDPOINTS.USER.SETTINGS),
    updateSettings: (settings) => api.put(API_ENDPOINTS.USER.SETTINGS, settings),
    updatePassword: (passwordData) => api.put(API_ENDPOINTS.USER.PASSWORD, passwordData),
  },
  
  // System settings methods
  settings: {
    getSystemSettings: () => api.get(API_ENDPOINTS.SETTINGS.SYSTEM),
    updateSystemSettings: (settings) => api.put(API_ENDPOINTS.SETTINGS.SYSTEM, settings),
  },
  
  // Data methods
  data: {
    getCarriers: () => api.get(API_ENDPOINTS.DATA.CARRIERS),
    getProducts: (carrierId) => api.get(API_ENDPOINTS.DATA.PRODUCTS, { params: { carrierId } }),
    getPositions: () => api.get(API_ENDPOINTS.DATA.POSITIONS),
    getDeals: () => api.get(API_ENDPOINTS.DATA.DEALS),
    createDeal: (dealData) => api.post(API_ENDPOINTS.DATA.DEALS, dealData),
  },
  
  // System health methods
  system: {
    checkHealth: () => api.get(API_ENDPOINTS.SYSTEM.HEALTH),
    getHealthChecks: () => api.get(API_ENDPOINTS.SYSTEM.HEALTH_CHECKS),
    createHealthCheck: (data) => api.post(API_ENDPOINTS.SYSTEM.HEALTH_CHECKS, data),
    deleteHealthCheck: (id) => api.delete(`${API_ENDPOINTS.SYSTEM.HEALTH_CHECKS}/${id}`),
    deleteAllHealthChecks: () => api.delete(API_ENDPOINTS.SYSTEM.HEALTH_CHECKS),
  },
};

export { api, API_ENDPOINTS };
export default ApiService;
