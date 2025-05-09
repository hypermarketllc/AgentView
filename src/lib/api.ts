import axios from 'axios';

// Get API URL from window.env or use default
const API_URL = typeof window !== 'undefined' && window.env?.API_URL 
  ? window.env.API_URL 
  : '/crm/api';

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
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 (Unauthorized) and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No refresh token, logout
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          return Promise.reject(error);
        }
        
        // Call refresh token endpoint
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        
        // Save new tokens
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        
        // Update Authorization header
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, logout
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  position?: {
    id: string;
    name: string;
    level: number;
  };
}

export interface Deal {
  id: string;
  agent_id: string;
  carrier_id: string;
  product_id: string;
  client_name: string;
  annual_premium: number;
  app_number?: string;
  client_phone?: string;
  effective_date?: string;
  from_referral: boolean;
  status: string;
  created_at: string;
  agent_name?: string;
  carrier_name?: string;
  product_name?: string;
}

export interface Carrier {
  id: string;
  name: string;
  advance_rate?: number;
  payment_type?: string;
  advance_period_months?: number;
}

export interface Product {
  id: string;
  carrier_id: string;
  name: string;
}

export interface Position {
  id: string;
  name: string;
  level: number;
  description?: string;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    
    // Save tokens to localStorage
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    if (response.data.refreshToken) {
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }
    
    return response.data;
  },
  
  register: async (email: string, password: string, fullName: string) => {
    const response = await api.post('/auth/register', { email, password, fullName });
    
    // Save tokens to localStorage
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    if (response.data.refreshToken) {
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }
    
    return response.data;
  },
  
  logout: async () => {
    // Remove tokens from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    
    return { success: true };
  },
  
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/auth/refresh', { refreshToken });
    
    // Save new tokens
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    if (response.data.refreshToken) {
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }
    
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  }
};

// Deals API
export const dealsAPI = {
  getAll: async () => {
    const response = await api.get('/deals');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },
  
  create: async (dealData: any) => {
    const response = await api.post('/deals', dealData);
    return response.data;
  },
  
  update: async (id: string, dealData: any) => {
    const response = await api.put(`/deals/${id}`, dealData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/deals/${id}`);
    return response.data;
  }
};

// Carriers API
export const carriersAPI = {
  getAll: async () => {
    const response = await api.get('/carriers');
    return response.data;
  }
};

// Products API
export const productsAPI = {
  getAll: async () => {
    const response = await api.get('/products');
    return response.data;
  },
  
  getByCarrier: async (carrierId: string) => {
    const response = await api.get(`/products?carrierId=${carrierId}`);
    return response.data;
  }
};

// Positions API
export const positionsAPI = {
  getAll: async () => {
    const response = await api.get('/positions');
    return response.data;
  }
};

export default api;
