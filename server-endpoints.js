/**
 * server-endpoints.js
 * 
 * Central configuration file for all server API endpoints
 * All endpoint paths should be defined here to make updates easier
 */

const SERVER_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  
  // User settings endpoints
  USER: {
    SETTINGS: '/user/settings',
    PASSWORD: '/user/password',
  },
  
  // System settings endpoints
  SETTINGS: {
    SYSTEM: '/settings/system',
  },
  
  // Data endpoints
  DATA: {
    CARRIERS: '/carriers',
    PRODUCTS: '/products',
    POSITIONS: '/positions',
    DEALS: '/deals',
  },
  
  // System health endpoints
  SYSTEM: {
    HEALTH: '/health',
    HEALTH_CHECKS: '/system-health-checks',
  }
};

export default SERVER_ENDPOINTS;
