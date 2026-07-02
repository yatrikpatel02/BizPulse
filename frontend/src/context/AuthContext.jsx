import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, register as registerService, logout as logoutService, getProfile, updateProfile as updateProfileService } from '../services/auth';
import { setCurrentAccessToken, onTokenRefreshed, onAuthError } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onTokenRefreshed(setAccessToken);
    onAuthError(() => {
      setAccessToken(null);
      setUser(null);
    });

    const initAuth = async () => {
      const hasRefreshCookie = document.cookie.split(';').some((c) => c.trim().startsWith('refresh_token='));
      if (!hasRefreshCookie) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch {
        // 401 or other auth errors leave user as null; interceptor calls onAuthError
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const data = await loginService(credentials);
    const token = data.token.access;
    setCurrentAccessToken(token);
    setAccessToken(token);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await registerService(userData);
    const token = data.token.access;
    setCurrentAccessToken(token);
    setAccessToken(token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await logoutService();
    setCurrentAccessToken(null);
    setAccessToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const updated = await updateProfileService(data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
