import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { authAPI } from '@/services/api';
import { initSocket, disconnectSocket } from '@/services/socket';

interface User {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  skills?: Array<{ name: string; level: string }>;
  interests?: string[];
  completedCollaborations?: number;
  averageRating?: number;
  totalRatings?: number;
  trustScore?: number;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const [token, setToken] = useLocalStorage('token', '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        if (isAuthenticated) {
          setIsAuthenticated(false);
          setUser(null);
        }
        return;
      }

      try {
        const response = await authAPI.getMe();
        if (response.success) {
          setUser(response.data);
          setIsAuthenticated(true);
          initSocket(token);
        }
      } catch (err) {
        // Token invalid, clear auth
        setIsAuthenticated(false);
        setToken('');
        setUser(null);
        disconnectSocket();
      }
    };
    checkAuth();
  }, [token, isAuthenticated, setUser, setIsAuthenticated, setToken]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.login(email, password);

      if (response.success) {
        setUser(response.data);
        setToken(response.data.token);
        setIsAuthenticated(true);
        localStorage.setItem('token', response.data.token);
        initSocket(response.data.token);
        return { success: true, message: response.message };
      }
      return { success: false, message: 'Login failed' };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [setIsAuthenticated, setUser, setToken]);

  const signup = useCallback(async (name: string, email: string, password: string, avatar?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.signup(name, email, password, avatar);

      if (response.success) {
        setUser(response.data);
        setToken(response.data.token);
        setIsAuthenticated(true);
        localStorage.setItem('token', response.data.token);
        initSocket(response.data.token);
        return { success: true, message: response.message };
      }
      return { success: false, message: 'Signup failed' };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Signup failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [setIsAuthenticated, setUser, setToken]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setToken('');
    disconnectSocket();
  }, [setIsAuthenticated, setUser, setToken]);

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.updateProfile(profileData);

      if (response.success) {
        setUser(response.data);
        return { success: true, message: response.message };
      }
      return { success: false, message: 'Update failed' };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Update failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  return {
    isAuthenticated,
    user,
    login,
    signup,
    logout,
    updateProfile,
    loading,
    error
  };
}
