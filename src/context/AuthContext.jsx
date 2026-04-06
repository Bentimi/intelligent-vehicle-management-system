import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const AuthContext = createContext(null);
const SESSION_KEY = 'has_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount.
  // Guard: skip all network calls if localStorage says there's no session —
  // this prevents noisy 401s on unauthenticated page loads.
  // 1. Try /user/me with the current access token.
  // 2. If 401, silently POST /user/refresh then retry /user/me.
  // 3. If refresh also fails, clear session flag and stay logged out.
  useEffect(() => {
    const restoreSession = async () => {
      if (!localStorage.getItem(SESSION_KEY)) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/user/me');
        setUser(res.data?.data?.user);
      } catch (err) {
        if (err.response?.status === 401) {
          try {
            await api.post('/user/refresh');
            const retry = await api.get('/user/me');
            setUser(retry.data?.data?.user);
          } catch {
            localStorage.removeItem(SESSION_KEY);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Handle mid-flight session expiration (e.g. token expired during app use)
  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
    };
    window.addEventListener('session_expired', handleExpired);
    return () => window.removeEventListener('session_expired', handleExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const res = await api.post('/user/login', credentials);
      const userData = res.data?.data?.user;
      localStorage.setItem(SESSION_KEY, '1');
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
      toast.info('Session ended automatically.');
    }
    localStorage.removeItem(SESSION_KEY);
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
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
