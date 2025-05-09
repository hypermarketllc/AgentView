/**
 * api-registry.js
 * 
 * Central registry of all API endpoints.
 * This file defines all API endpoints with their paths, methods, authentication requirements,
 * and handler functions. It serves as a single source of truth for the API structure.
 */

/**
 * API Registry
 * 
 * Structure:
 * {
 *   [category]: {
 *     [endpointKey]: {
 *       path: String,
 *       method: String,
 *       requiresAuth: Boolean,
 *       handler: String,
 *       description: String
 *     }
 *   }
 * }
 */
export const API_REGISTRY = {
  // Authentication endpoints
  auth: {
    login: {
      path: '/auth/login',
      method: 'POST',
      requiresAuth: false,
      handler: 'handleLogin',
      description: 'Authenticate user and get JWT token'
    },
    register: {
      path: '/auth/register',
      method: 'POST',
      requiresAuth: false,
      handler: 'handleRegister',
      description: 'Register a new user'
    },
    currentUser: {
      path: '/auth/me',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetCurrentUser',
      description: 'Get current authenticated user'
    },
    logout: {
      path: '/auth/logout',
      method: 'POST',
      requiresAuth: true,
      handler: 'handleLogout',
      description: 'Logout current user'
    },
    refreshToken: {
      path: '/auth/refresh',
      method: 'POST',
      requiresAuth: false,
      handler: 'handleRefreshToken',
      description: 'Refresh JWT token'
    }
  },
  
  // User settings endpoints
  user: {
    settings: {
      path: '/user/settings',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetUserSettings',
      description: 'Get user settings'
    ,
    deleteSettings: {
      path: '/user/settings',
      method: 'DELETE',
      requiresAuth: true,
      handler: 'handleDeleteUserSettings',
      description: 'Delete user settings'
    ,
    getSettingByKey: {
      path: '/settings/:key',
      method: 'GET',
      requiresAuth: false,
      handler: 'handleGetSettingByKey',
      description: 'Get setting by key'
    },
    createSetting: {
      path: '/settings',
      method: 'POST',
      requiresAuth: true,
      handler: 'handleCreateSetting',
      description: 'Create a new setting'
    },
    deleteSetting: {
      path: '/settings/:key',
      method: 'DELETE',
      requiresAuth: true,
      handler: 'handleDeleteSetting',
      description: 'Delete a setting'
    }
  }
  },
    updateSettings: {
      path: '/user/settings',
      method: 'PUT',
      requiresAuth: true,
      handler: 'handleUpdateUserSettings',
      description: 'Update user settings'
    }
  },
  
  // System health endpoints
  system: {
    health: {
      path: '/system/health',
      method: 'GET',
      requiresAuth: false,
      handler: 'handleGetHealth',
      description: 'Get basic health status'
    },
    healthSummary: {
      path: '/system/health/summary',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetHealthSummary',
      description: 'Get system health summary'
    },
    healthHistory: {
      path: '/system/health/history',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetHealthHistory',
      description: 'Get system health history'
    },
    runHealthChecks: {
      path: '/system/health/run',
      method: 'POST',
      requiresAuth: true,
      handler: 'handleRunHealthChecks',
      description: 'Run health checks'
    },
    errorStats: {
      path: '/system/errors/stats',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetErrorStats',
      description: 'Get error statistics'
    },
    errorDetails: {
      path: '/system/errors/:id',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetErrorDetails',
      description: 'Get error details'
    },
    healthChecks: {
      path: '/system/health/checks',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetHealthChecks',
      description: 'Get system health checks'
    },
    createHealthCheck: {
      path: '/system/health/checks',
      method: 'POST',
      requiresAuth: true,
      handler: 'handleCreateHealthCheck',
      description: 'Create a health check'
    },
    deleteHealthCheck: {
      path: '/system/health/checks/:id',
      method: 'DELETE',
      requiresAuth: true,
      handler: 'handleDeleteHealthCheck',
      description: 'Delete a health check'
    },
    deleteAllHealthChecks: {
      path: '/system/health/checks/all',
      method: 'DELETE',
      requiresAuth: true,
      handler: 'handleDeleteAllHealthChecks',
      description: 'Delete all health checks'
    }
  },
  
  // System settings endpoints
  settings: {
    getSettings: {
      path: '/settings',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetSystemSettings',
      description: 'Get system settings'
    },
    updateSettings: {
      path: '/settings',
      method: 'PUT',
      requiresAuth: true,
      handler: 'handleUpdateSystemSettings',
      description: 'Update system settings'
    }
  },
  
  // Data endpoints
  carriers: {
    getCarriers: {
      path: '/carriers',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetCarriers',
      description: 'Get all carriers'
    }
  },
  
  products: {
    getProducts: {
      path: '/products',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetProducts',
      description: 'Get all products'
    }
  },
  
  positions: {
    getPositions: {
      path: '/positions',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetPositions',
      description: 'Get all positions'
    }
  },
  
  deals: {
    getDeals: {
      path: '/deals',
      method: 'GET',
      requiresAuth: true,
      handler: 'handleGetDeals',
      description: 'Get all deals'
    },
    createDeal: {
      path: '/deals',
      method: 'POST',
      requiresAuth: true,
      handler: 'handleCreateDeal',
      description: 'Create a new deal'
    }
  }
};

/**
 * Get all endpoints as a flat array
 * 
 * @returns {Array} - Array of all endpoints
 */
export function getAllEndpoints() {
  const endpoints = [];
  
  for (const [categoryKey, category] of Object.entries(API_REGISTRY)) {
    for (const [endpointKey, endpoint] of Object.entries(category)) {
      endpoints.push({
        category: categoryKey,
        key: endpointKey,
        ...endpoint
      });
    }
  }
  
  return endpoints;
}

/**
 * Get endpoints by category
 * 
 * @param {String} category - Category to filter by
 * @returns {Array} - Array of endpoints in the category
 */
export function getEndpointsByCategory(category) {
  if (!API_REGISTRY[category]) {
    return [];
  }
  
  return Object.entries(API_REGISTRY[category]).map(([key, endpoint]) => ({
    category,
    key,
    ...endpoint
  }));
}

/**
 * Find endpoint by path and method
 * 
 * @param {String} path - Path to find
 * @param {String} method - HTTP method to find
 * @returns {Object|null} - Endpoint object or null if not found
 */
export function findEndpoint(path, method) {
  for (const [categoryKey, category] of Object.entries(API_REGISTRY)) {
    for (const [endpointKey, endpoint] of Object.entries(category)) {
      if (endpoint.path === path && endpoint.method === method) {
        return {
          category: categoryKey,
          key: endpointKey,
          ...endpoint
        };
      }
    }
  }
  
  return null;
}
