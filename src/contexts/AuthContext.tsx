import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, User } from '../lib/api';
import toast from 'react-hot-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  logout: () => Promise<any>;
  refreshToken: () => Promise<any>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext - Initializing");
    
    // Function to check token and get user
    const checkTokenAndGetUser = async () => {
      try {
        // Get current user
        const userData = await authAPI.getCurrentUser();
        console.log("AuthContext - User data:", userData);
        setUser(userData);
      } catch (error: any) {
        console.error("AuthContext - Error getting user:", error);
        
        // Check if the error is due to an expired token
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;
        
        if (isAuthError) {
          // Try to refresh token
          try {
            console.log("AuthContext - Attempting token refresh");
            const refreshResult = await authAPI.refreshToken();
            
            if (refreshResult.error) {
              throw new Error(refreshResult.error);
            }
            
            // Try to get user again after token refresh
            const userData = await authAPI.getCurrentUser();
            console.log("AuthContext - User data after token refresh:", userData);
            setUser(userData);
          } catch (refreshError) {
            console.error("AuthContext - Error refreshing token:", refreshError);
            // Clear tokens and set user to null
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
          }
        } else {
          // For other errors, just set user to null
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Check if token exists in localStorage
    if (authAPI.isAuthenticated()) {
      checkTokenAndGetUser();
    } else {
      setLoading(false);
    }
    
    // Set up token refresh timer (every 30 minutes)
    const refreshInterval = 30 * 60 * 1000; // 30 minutes in milliseconds
    const refreshTimer = setInterval(async () => {
      if (authAPI.isAuthenticated()) {
        try {
          console.log("AuthContext - Refreshing token on interval");
          await authAPI.refreshToken();
        } catch (error: any) {
          console.error("AuthContext - Error refreshing token on interval:", error);
          // If refresh fails, clear tokens and set user to null
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      }
    }, refreshInterval);
    
    // Clean up timer on unmount
    return () => {
      clearInterval(refreshTimer);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Submitting login form:', { email });
      
      const response = await authAPI.login(email, password);
      
      // Set user
      setUser(response.user);
      
      return { data: response, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Show error toast
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to sign in');
      }
      
      return {
        data: null,
        error: error.response?.data?.error || 'An unexpected error occurred'
      };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await authAPI.register(email, password, fullName);
      
      // Set user
      setUser(response.user);
      
      return { data: response, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Show error toast
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to sign up');
      }
      
      return {
        data: null,
        error: error.response?.data?.error || 'An unexpected error occurred'
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      
      // Clear user
      setUser(null);
      
      // Clear tokens to ensure complete logout
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      
      toast.success('Logged out successfully');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if there's an error, clear user and tokens
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      
      // Show error toast
      toast.error('Error logging out');
      
      return { 
        success: false, 
        error: error.response?.data?.error || 'An unexpected error occurred' 
      };
    }
  };
  
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      
      // Show error toast
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to refresh token');
      }
      
      return {
        data: null,
        error: error.response?.data?.error || 'An unexpected error occurred'
      };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    refreshToken,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
