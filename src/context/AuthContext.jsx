import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate session on mount via secure cookie (HttpOnly)
  useEffect(() => {
    api.get('/user/me')
      .then((res) => {
        setUser(res.data?.data?.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Handle mid-flight session expiration
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('session_expired', handleExpired);
    return () => window.removeEventListener('session_expired', handleExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const res = await api.post('/user/login', credentials);
      const userData = res.data?.data?.user;
      setUser(userData);
      return userData;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/user/logout');
      toast.success('Logged out successfully!');
    } catch {
      // still clear local state even if request fails
      toast.info('Session ended automatically.');
    }
    setUser(null);
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => prev ? { ...prev, ...partial } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
