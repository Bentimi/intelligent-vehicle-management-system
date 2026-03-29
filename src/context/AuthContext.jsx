import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('cg_user')) || null; }
    catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) localStorage.setItem('cg_user', JSON.stringify(user));
    else      localStorage.removeItem('cg_user');
  }, [user]);

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
    } catch {
      // still clear local state even if request fails
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
