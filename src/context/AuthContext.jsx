import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: read a plain (non-HttpOnly) cookie by name
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  };

  // Restore session on mount — but ONLY if the backend already set the
  // readable `logged_in` flag cookie. If it's absent there is no session,
  // so we skip the call entirely and avoid a noisy 401 in the console.
  useEffect(() => {
    if (!getCookie('logged_in')) {
      setIsLoading(false);
      return;
    }

    api.get('/user/me')
      .then((res) => {
        setUser(res.data?.data?.user);
      })
      .catch(() => {
        // /user/me failed despite the flag cookie existing (e.g. token expired).
        // Only clear user if login() hasn't already set one.
        setUser((prev) => (prev === null ? null : prev));
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
