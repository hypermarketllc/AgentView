import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, User } from '../lib/api';
import toast from 'react-hot-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  logout: () => Promise<any>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext - Initializing");
    
    // Check if token exists in localStorage
    if (authAPI.isAuthenticated()) {
      // Get current user
      authAPI.getCurrentUser()
        .then(userData => {
          console.log("AuthContext - User data:", userData);
          setUser(userData);
        })
        .catch(error => {
          console.error("AuthContext - Error getting user:", error);
          // Clear invalid token
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
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
      
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
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